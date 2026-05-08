from __future__ import annotations

from dataclasses import dataclass

from sklearn.pipeline import Pipeline

from ..preprocessing import build_bert_tabular_preprocessor


@dataclass(frozen=True)
class GbdtBackend:
    name: str
    estimator: object


def _resolve_gbdt_backend(class_weight: str | None) -> GbdtBackend:
    try:
        from lightgbm import LGBMClassifier

        return GbdtBackend(
            name="lightgbm",
            estimator=LGBMClassifier(
                n_estimators=350,
                learning_rate=0.05,
                num_leaves=63,
                subsample=0.9,
                colsample_bytree=0.9,
                random_state=42,
                class_weight=class_weight,
            ),
        )
    except Exception:
        pass

    try:
        from xgboost import XGBClassifier

        return GbdtBackend(
            name="xgboost",
            estimator=XGBClassifier(
                n_estimators=350,
                learning_rate=0.05,
                max_depth=6,
                subsample=0.9,
                colsample_bytree=0.9,
                objective="multi:softprob",
                eval_metric="mlogloss",
                random_state=42,
                tree_method="hist",
            ),
        )
    except Exception as exc:
        raise RuntimeError(
            "berturk_gbdt icin lightgbm veya xgboost bagimliligi bulunamadi."
        ) from exc


def build_berturk_gbdt_pipeline(
    class_weight: str | None = None,
    bert_model_name: str = "dbmdz/bert-base-turkish-cased",
    device: str = "cpu",
) -> Pipeline:
    backend = _resolve_gbdt_backend(class_weight=class_weight)

    preprocessor = build_bert_tabular_preprocessor(
        bert_model_name=bert_model_name,
        device=device,
    )

    pipe = Pipeline(
        steps=[
            ("preprocess", preprocessor),
            ("clf", backend.estimator),
        ]
    )

    # Inspectability: backend name pipeline attribute.
    pipe.backend_name = backend.name  # type: ignore[attr-defined]
    return pipe
