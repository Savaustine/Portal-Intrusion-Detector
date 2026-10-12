"""Train the demo activity-log intrusion detector."""

from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

try:
    from ml.preprocess import DEFAULT_OUTPUT_PATH, FEATURE_COLUMNS, preprocess_data
except ModuleNotFoundError:
    from preprocess import DEFAULT_OUTPUT_PATH, FEATURE_COLUMNS, preprocess_data

MODEL_DIR = Path(__file__).resolve().parent / "model"
MODEL_PATH = MODEL_DIR / "activity_classifier.joblib"
TEST_PATH = MODEL_DIR / "test_data.csv"


def train_model(data_path: str | Path = DEFAULT_OUTPUT_PATH, model_output_path: str | Path = MODEL_PATH):
    data_file = Path(data_path)
    data = preprocess_data(output_data_path=data_file) if not data_file.exists() else pd.read_csv(data_file)
    x = data[FEATURE_COLUMNS]
    y = data["suspicious"]
    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.25, random_state=42, stratify=y
    )
    classifier = RandomForestClassifier(random_state=42, class_weight="balanced")
    classifier.fit(x_train, y_train)
    output = Path(model_output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": classifier, "feature_columns": FEATURE_COLUMNS}, output)
    test_data = x_test.copy()
    test_data["suspicious"] = y_test
    test_data.to_csv(TEST_PATH, index=False)
    print(f"Trained RandomForestClassifier on {len(x_train)} records")
    print(f"Saved model to {output}")
    return classifier


if __name__ == "__main__":
    train_model()
