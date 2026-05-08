from __future__ import annotations

from collections.abc import Callable

from sklearn.pipeline import Pipeline

from .models import (
    build_berturk_gbdt_pipeline,
    build_lstm_text_pipeline,
    build_tfidf_logreg_pipeline,
    build_tfidf_svm_pipeline,
)

ModelBuilder = Callable[..., Pipeline]

MODEL_REGISTRY: dict[str, ModelBuilder] = {
    "tfidf_logreg": build_tfidf_logreg_pipeline,
    "tfidf_svm": build_tfidf_svm_pipeline,
    "berturk_gbdt": build_berturk_gbdt_pipeline,
    "lstm_text": build_lstm_text_pipeline,
}


def available_models() -> list[str]:
    return sorted(MODEL_REGISTRY.keys())


def create_model(model_name: str, **kwargs) -> Pipeline:
    if model_name not in MODEL_REGISTRY:
        raise ValueError(
            f"Bilinmeyen model: {model_name}. Kullanilabilir: {', '.join(available_models())}"
        )
    return MODEL_REGISTRY[model_name](**kwargs)
