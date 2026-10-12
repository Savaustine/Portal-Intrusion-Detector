"""Feature engineering shared by offline training and live IDS inference."""

from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Iterable, Mapping

import numpy as np
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB_PATH = PROJECT_ROOT / "backend" / "sentryportal.db"
DEFAULT_OUTPUT_PATH = Path(__file__).resolve().parent / "data" / "processed_activity.csv"
ACTION_TYPES = (
    "login",
    "failed_login",
    "view_dashboard",
    "view_grades",
    "view_files",
    "download_file",
    "change_password",
    "register",
    "other",
)
FEATURE_COLUMNS = [
    *(f"action_{action}" for action in ACTION_TYPES),
    "hour",
    "is_off_hours",
    "request_count_10m",
    "failed_login_count_10m",
    "followed_failed_login",
    "student_action_count_10m",
]


def load_activity_logs(
    db_path: str | Path = DEFAULT_DB_PATH, csv_path: str | Path | None = None
) -> pd.DataFrame:
    """Load logs from SQLite read-only, falling back to an exported CSV."""
    path = Path(db_path)
    if path.exists():
        uri = f"file:{path.resolve().as_posix()}?mode=ro"
        try:
            with sqlite3.connect(uri, uri=True) as connection:
                return pd.read_sql_query("SELECT * FROM activity_logs ORDER BY timestamp", connection)
        except (sqlite3.DatabaseError, pd.errors.DatabaseError):
            pass

    csv_file = Path(csv_path) if csv_path else Path(__file__).resolve().parent / "data" / "activity_logs.csv"
    if csv_file.exists():
        return pd.read_csv(csv_file)
    return pd.DataFrame()


def synthetic_activity_logs(size: int = 180) -> pd.DataFrame:
    """Create deterministic demo records when a new project has no logs yet."""
    rng = np.random.default_rng(42)
    start = pd.Timestamp("2026-01-12 08:00:00")
    rows: list[dict] = []
    for index in range(size):
        student_id = 99 if index >= size - 30 else 1 + index % 6
        suspicious_window = index >= size - 30
        if suspicious_window:
            timestamp = start + pd.Timedelta(minutes=2 * (index - size + 30), hours=23)
            action = "failed_login"
            success = False
        else:
            timestamp = start + pd.Timedelta(minutes=index * 7)
            action = rng.choice(["view_dashboard", "view_grades", "view_files", "download_file"])
            success = True
        rows.append({"id": index + 1, "student_id": student_id, "action": action,
                     "success": success, "timestamp": timestamp.isoformat()})
    return pd.DataFrame(rows)


def _normalise_logs(records: Iterable[Mapping] | pd.DataFrame) -> pd.DataFrame:
    frame = records.copy() if isinstance(records, pd.DataFrame) else pd.DataFrame(records)
    for column, default in (("student_id", 0), ("action", "other"), ("success", True)):
        if column not in frame:
            frame[column] = default
    if "timestamp" not in frame:
        frame["timestamp"] = pd.Timestamp.now(tz="UTC")
    frame["timestamp"] = pd.to_datetime(frame["timestamp"], utc=True, errors="coerce").fillna(pd.Timestamp.now(tz="UTC"))
    frame["student_id"] = frame["student_id"].fillna(0).astype(str)
    frame["action"] = frame["action"].fillna("other").where(frame["action"].isin(ACTION_TYPES), "other")
    frame["success"] = frame["success"].map(lambda value: str(value).lower() not in {"false", "0", "no"})
    return frame.sort_values(["student_id", "timestamp"]).reset_index(drop=True)


def build_features(records: Iterable[Mapping] | pd.DataFrame) -> pd.DataFrame:
    """Build explainable per-activity features used by both training and inference."""
    frame = _normalise_logs(records)
    if frame.empty:
        return pd.DataFrame(columns=FEATURE_COLUMNS)
    features = pd.DataFrame(index=frame.index)
    for action in ACTION_TYPES:
        features[f"action_{action}"] = (frame["action"] == action).astype(int)
    features["hour"] = frame["timestamp"].dt.hour.astype(int)
    features["is_off_hours"] = ((features["hour"] < 6) | (features["hour"] >= 22)).astype(int)
    request_counts = []
    failed_counts = []
    student_counts = []
    followed_failed = []
    for index, row in frame.iterrows():
        window_start = row["timestamp"] - pd.Timedelta(minutes=10)
        history = frame[(frame["student_id"] == row["student_id"]) &
                        (frame["timestamp"] >= window_start) &
                        (frame["timestamp"] <= row["timestamp"])]
        request_counts.append(len(history))
        failed_counts.append(int(((history["action"] == "failed_login") | (~history["success"])).sum()))
        student_counts.append(len(history))
        previous = frame[(frame["student_id"] == row["student_id"]) & (frame.index < index)]
        followed_failed.append(int(not previous.empty and ((previous.iloc[-1]["action"] == "failed_login") or not previous.iloc[-1]["success"])))
    features["request_count_10m"] = request_counts
    features["failed_login_count_10m"] = failed_counts
    features["followed_failed_login"] = followed_failed
    features["student_action_count_10m"] = student_counts
    return features[FEATURE_COLUMNS].astype(float)


def bootstrap_labels(records: Iterable[Mapping] | pd.DataFrame, features: pd.DataFrame) -> pd.Series:
    """Apply transparent demo rules; these labels are not ground truth."""
    # Rule-based bootstrap labels are only a training/demo convenience until real incident labels exist.
    labels = ((features["failed_login_count_10m"] >= 3) |
              (features["request_count_10m"] >= 10) |
              ((features["is_off_hours"] == 1) & (features["followed_failed_login"] == 1))).astype(int)
    return labels.rename("suspicious")


def preprocess_data(raw_data_path: str | Path | None = None, output_data_path: str | Path = DEFAULT_OUTPUT_PATH) -> pd.DataFrame:
    records = load_activity_logs(csv_path=raw_data_path) if raw_data_path else load_activity_logs()
    if records.empty:
        records = synthetic_activity_logs()
    features = build_features(records)
    result = features.copy()
    result["suspicious"] = bootstrap_labels(records, features)
    output = Path(output_data_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    result.to_csv(output, index=False)
    return result


if __name__ == "__main__":
    data = preprocess_data()
    print(f"Preprocessed {len(data)} activity records into {DEFAULT_OUTPUT_PATH}")
    print(f"Bootstrap labels: {int(data['suspicious'].sum())} suspicious, {int((data['suspicious'] == 0).sum())} normal")
