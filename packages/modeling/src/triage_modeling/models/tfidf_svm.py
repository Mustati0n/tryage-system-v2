from __future__ import annotations

from sklearn.calibration import CalibratedClassifierCV
from sklearn.pipeline import Pipeline
from sklearn.svm import LinearSVC

from ..preprocessing import build_tfidf_preprocessor


def _build_calibrated_svm(
    class_weight: str | None,
    calibration_method: str = "sigmoid",
    calibration_cv: int = 3,
) -> CalibratedClassifierCV:
    base = LinearSVC(class_weight=class_weight, random_state=42)
    try:
        return CalibratedClassifierCV(estimator=base, method=calibration_method, cv=calibration_cv)
    except TypeError:
        return CalibratedClassifierCV(base_estimator=base, method=calibration_method, cv=calibration_cv)


def build_tfidf_svm_pipeline(
    class_weight: str | None = None,
    calibration_method: str = "sigmoid",
    calibration_cv: int = 3,
) -> Pipeline:
    classifier = _build_calibrated_svm(
        class_weight=class_weight,
        calibration_method=calibration_method,
        calibration_cv=calibration_cv,
    )

    return Pipeline(
        steps=[
            ("preprocess", build_tfidf_preprocessor()),
            ("clf", classifier),
        ]
    )
