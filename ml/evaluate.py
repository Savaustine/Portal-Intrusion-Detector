"""Evaluate the held-out activity-log intrusion detector."""

from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import classification_report

try:
    from ml.train import MODEL_PATH, TEST_PATH, train_model
except ModuleNotFoundError:
    from train import MODEL_PATH, TEST_PATH, train_model

REPORT_PATH = Path(__file__).resolve().parent / "model" / "evaluation_report.txt"


def evaluate_model(model_path: str | Path = MODEL_PATH, test_data_path: str | Path = TEST_PATH) -> str:
    model_file = Path(model_path)
    test_file = Path(test_data_path)
    if not model_file.exists() or not test_file.exists():
        train_model()
    artifact = joblib.load(model_file)
    test_data = pd.read_csv(test_file)
    predictions = artifact["model"].predict(test_data[artifact["feature_columns"]])
    report = classification_report(
        test_data["suspicious"], predictions,
        labels=[0, 1], target_names=["normal", "suspicious"], zero_division=0,
    )
    REPORT_PATH.write_text("SentryPortal IDS Evaluation\n=========================\n\n" + report, encoding="utf-8")
    print(report)
    print(f"Saved evaluation report to {REPORT_PATH}")
    return report


if __name__ == "__main__":
    evaluate_model()
