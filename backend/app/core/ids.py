from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Mapping

import joblib
import pandas as pd

from app.core.database import SessionLocal
from app.models.activity import ActivityLog, Alert

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
from ml.preprocess import build_features  # noqa: E402

MODEL_PATH = ROOT / "ml" / "model" / "activity_classifier.joblib"
_artifact: dict[str, Any] | None = None


def load_model() -> bool:
    global _artifact
    if MODEL_PATH.exists():
        _artifact = joblib.load(MODEL_PATH)
    else:
        _artifact = None
    return _artifact is not None


def _fallback_classification(features: pd.DataFrame) -> tuple[str, float]:
    try:
        row = features.iloc[-1]
        failed_cnt = row.get("failed_login_count_10m", 0)
        req_cnt = row.get("request_count_10m", 0)
        off_hours = row.get("is_off_hours", 0)
        followed_failed = row.get("followed_failed_login", 0)
        suspicious = (failed_cnt >= 3 or req_cnt >= 10 or (off_hours and followed_failed))
        return ("suspicious" if suspicious else "normal", 0.95 if suspicious else 0.80)
    except Exception:
        return ("normal", 0.80)


def classify_activity(activity_log: Mapping[str, Any], history: list[Mapping[str, Any]] | None = None) -> tuple[str, float]:
    try:
        records = [*(history or []), dict(activity_log)]
        features = build_features(records)
        if features.empty:
            return "normal", 0.0
        if _artifact is None:
            return _fallback_classification(features)
        
        model = _artifact.get("model")
        columns = _artifact.get("feature_columns")
        if model is None or columns is None:
            return _fallback_classification(features)

        # Ensure all expected columns exist in features
        for col in columns:
            if col not in features.columns:
                features[col] = 0.0

        row = features[columns].iloc[[-1]]
        label = int(model.predict(row)[0])
        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(row)[0]
            confidence = float(max(probabilities))
        else:
            confidence = 0.95 if label else 0.85
        return ("suspicious" if label else "normal", confidence)
    except Exception:
        return ("normal", 0.80)


def log_activity(
    student_id: int, action: str, success: bool = True, details: str | None = None,
    db=None,
) -> ActivityLog:
    """Persist an activity, classify it with recent student history, and raise alerts."""
    owns_session = db is None
    session = db or SessionLocal()
    try:
        recent = []
        try:
            recent = session.query(ActivityLog).filter(ActivityLog.student_id == student_id).order_by(ActivityLog.timestamp.asc()).all()
        except Exception:
            pass

        timestamp = datetime.now(timezone.utc)
        payload = {"student_id": student_id, "action": action, "success": success, "timestamp": timestamp}
        history = [
            {"student_id": item.student_id, "action": item.action, "success": item.success, "timestamp": item.timestamp}
            for item in recent
        ]

        try:
            label, confidence = classify_activity(payload, history)
        except Exception:
            label, confidence = "normal", 0.80

        activity = ActivityLog(
            student_id=student_id,
            action=action,
            success=success,
            timestamp=timestamp,
            classification=label,
            confidence=round(confidence * 100),
            details=details,
        )
        session.add(activity)
        session.flush()

        if label == "suspicious":
            severity = "high" if confidence >= 0.85 else "medium"
            session.add(Alert(
                activity_id=activity.id,
                student_id=student_id,
                severity=severity,
                message=f"Suspicious activity detected: {action} ({confidence:.0%} confidence)",
            ))

        if owns_session:
            session.commit()
            session.refresh(activity)

        return activity
    except Exception:
        if owns_session:
            try:
                session.rollback()
            except Exception:
                pass
        # Return a fallback ActivityLog object so caller doesn't crash
        return ActivityLog(
            student_id=student_id,
            action=action,
            success=success,
            timestamp=datetime.now(timezone.utc),
            classification="normal",
            confidence=80,
            details=details,
        )
    finally:
        if owns_session:
            try:
                session.close()
            except Exception:
                pass