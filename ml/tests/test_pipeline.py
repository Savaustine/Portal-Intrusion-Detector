from pathlib import Path

import joblib
import pandas as pd

from ml.preprocess import FEATURE_COLUMNS


def test_trained_model_loads_and_predicts():
    model_path = Path(__file__).resolve().parents[1] / "model" / "activity_classifier.joblib"
    assert model_path.exists(), f"Missing trained model artifact: {model_path}"
    artifact = joblib.load(model_path)
    sample = pd.DataFrame([{column: 0.0 for column in FEATURE_COLUMNS}])
    prediction = artifact["model"].predict(sample[artifact["feature_columns"]])
    assert prediction.shape == (1,)
    assert int(prediction[0]) in (0, 1)