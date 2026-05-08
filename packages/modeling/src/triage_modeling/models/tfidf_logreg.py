from __future__ import annotations

from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

from ..preprocessing import build_tfidf_preprocessor


def build_tfidf_logreg_pipeline(class_weight: str | None = None) -> Pipeline:
    classifier = LogisticRegression(
        max_iter=2000,
        class_weight=class_weight,
        random_state=42,
    )

    return Pipeline(
        steps=[
            ("preprocess", build_tfidf_preprocessor()),
            ("clf", classifier),
        ]
    )
