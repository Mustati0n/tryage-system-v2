from __future__ import annotations

from dataclasses import asdict
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from .artifacts import save_artifact
from .config import DataSchema, TrainConfig
from .data import load_dataset, split_dataset
from .evaluation import EvalResult, evaluate_predictions
from .registry import create_model


def predict_with_confidence(model: Any, x: pd.DataFrame) -> tuple[np.ndarray, np.ndarray]:
    y_pred = model.predict(x)

    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(x)
        conf = np.max(proba, axis=1)
        return y_pred, conf

    if hasattr(model, "decision_function"):
        scores = model.decision_function(x)
        exp = np.exp(scores - np.max(scores, axis=1, keepdims=True))
        probs = exp / exp.sum(axis=1, keepdims=True)
        conf = np.max(probs, axis=1)
        return y_pred, conf

    return y_pred, np.full(shape=(len(y_pred),), fill_value=np.nan)


def train_once(config: TrainConfig, data_path: str | Path, schema: DataSchema | None = None) -> tuple[Any, EvalResult, dict[str, Any]]:
    schema = schema or DataSchema()
    df = load_dataset(data_path=data_path, schema=schema)
    split = split_dataset(
        df=df,
        schema=schema,
        test_size=config.test_size,
        random_state=config.random_state,
    )

    model_kwargs = dict(config.model_params or {})
    model_kwargs.setdefault("class_weight", config.class_weight)
    model = create_model(config.model_name, **model_kwargs)
    model.fit(split.x_train, split.y_train)

    y_pred, confidence = predict_with_confidence(model, split.x_test)
    eval_result = evaluate_predictions(config.model_name, split.y_test, y_pred)

    metadata = {
        "model_name": config.model_name,
        "class_weight": config.class_weight,
        "model_params": config.model_params or {},
        "test_size": config.test_size,
        "random_state": config.random_state,
        "schema": asdict(schema),
        "n_train": int(len(split.x_train)),
        "n_test": int(len(split.x_test)),
        "metrics": {
            "accuracy": eval_result.accuracy,
            "macro_f1": eval_result.macro_f1,
            "weighted_f1": eval_result.weighted_f1,
            "kirmizi_recall": eval_result.red_recall,
        },
    }

    pred_out = pd.DataFrame(
        {
            "y_true": split.y_test.values,
            "y_pred": y_pred,
            "confidence": confidence,
        }
    )

    config.output_dir.mkdir(parents=True, exist_ok=True)
    pred_out.to_csv(config.output_dir / "predictions.csv", index=False)
    eval_result.report_df.to_csv(config.output_dir / "classification_report.csv")
    eval_result.confusion_df.to_csv(config.output_dir / "confusion_matrix.csv")

    save_artifact(model=model, metadata=metadata, output_dir=config.output_dir)
    return model, eval_result, metadata
