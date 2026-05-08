from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
)

from .config import LABELS


@dataclass
class EvalResult:
    model_name: str
    accuracy: float
    macro_f1: float
    weighted_f1: float
    red_recall: float
    report_df: pd.DataFrame
    confusion_df: pd.DataFrame


def evaluate_predictions(model_name: str, y_true: pd.Series, y_pred: np.ndarray) -> EvalResult:
    report = classification_report(y_true, y_pred, labels=LABELS, output_dict=True, zero_division=0)
    report_df = pd.DataFrame(report).transpose()

    cm = confusion_matrix(y_true, y_pred, labels=LABELS)
    confusion_df = pd.DataFrame(cm, index=[f"true_{x}" for x in LABELS], columns=[f"pred_{x}" for x in LABELS])

    red_recall = float(report.get("KIRMIZI", {}).get("recall", 0.0))

    return EvalResult(
        model_name=model_name,
        accuracy=float(accuracy_score(y_true, y_pred)),
        macro_f1=float(f1_score(y_true, y_pred, average="macro", labels=LABELS, zero_division=0)),
        weighted_f1=float(f1_score(y_true, y_pred, average="weighted", labels=LABELS, zero_division=0)),
        red_recall=red_recall,
        report_df=report_df,
        confusion_df=confusion_df,
    )


def summarize_results(results: list[EvalResult]) -> pd.DataFrame:
    rows = []
    for r in results:
        rows.append(
            {
                "model": r.model_name,
                "accuracy": r.accuracy,
                "macro_f1": r.macro_f1,
                "weighted_f1": r.weighted_f1,
                "kirmizi_recall": r.red_recall,
            }
        )
    out = pd.DataFrame(rows)
    if not out.empty:
        out = out.sort_values(by=["kirmizi_recall", "macro_f1", "weighted_f1"], ascending=False).reset_index(drop=True)
    return out


def quick_comment(result: EvalResult) -> str:
    worst_class = (
        result.report_df.loc[LABELS, "f1-score"].astype(float).sort_values().index[0]
        if all(lbl in result.report_df.index for lbl in LABELS)
        else "BILINMIYOR"
    )

    strengths = []
    if result.red_recall >= 0.80:
        strengths.append("KIRMIZI yakalama guclu")
    if result.macro_f1 >= 0.75:
        strengths.append("siniflar arasi denge iyi")
    if not strengths:
        strengths.append("hizli baseline/iterasyon dostu")

    return (
        f"Guclu yan: {', '.join(strengths)} | "
        f"Zayif yan: {worst_class} sinifinda F1 daha dusuk | "
        f"Risk: KIRMIZI recall={result.red_recall:.3f}"
    )
