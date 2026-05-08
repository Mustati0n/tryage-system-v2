#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, f1_score


def multiclass_brier(y_true: pd.Series, proba: np.ndarray, labels: list[str]) -> float:
    label_to_idx = {l: i for i, l in enumerate(labels)}
    onehot = np.zeros_like(proba)
    for i, y in enumerate(y_true):
        onehot[i, label_to_idx[y]] = 1.0
    return float(np.mean(np.sum((proba - onehot) ** 2, axis=1)))


def ece_top1(y_true: pd.Series, y_pred: np.ndarray, conf: np.ndarray, n_bins: int = 10) -> float:
    bins = np.linspace(0.0, 1.0, n_bins + 1)
    ece = 0.0
    n = len(y_true)
    for i in range(n_bins):
        lo, hi = bins[i], bins[i + 1]
        mask = (conf >= lo) & (conf < hi if i < n_bins - 1 else conf <= hi)
        if not np.any(mask):
            continue
        acc = np.mean((y_true.values[mask] == y_pred[mask]).astype(float))
        c = float(np.mean(conf[mask]))
        ece += (np.sum(mask) / n) * abs(acc - c)
    return float(ece)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Compare SVM calibration methods on same split.")
    parser.add_argument("--data-path", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--test-size", type=float, default=0.2)
    parser.add_argument("--random-state", type=int, default=42)
    parser.add_argument("--class-weight", choices=["none", "balanced"], default="balanced")
    parser.add_argument("--calibration-cv", type=int, default=3)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    root = Path(__file__).resolve().parents[1]
    src = root / "src"
    import sys

    if str(src) not in sys.path:
        sys.path.insert(0, str(src))

    from triage_modeling.data import load_dataset, split_dataset
    from triage_modeling.registry import create_model
    from triage_modeling.evaluation import evaluate_predictions

    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    class_weight = None if args.class_weight == "none" else args.class_weight

    df = load_dataset(args.data_path)
    split = split_dataset(df, test_size=args.test_size, random_state=args.random_state)

    rows = []
    labels = ["YESIL", "SARI", "KIRMIZI"]

    for method in ["sigmoid", "isotonic"]:
        model = create_model(
            "tfidf_svm",
            class_weight=class_weight,
            calibration_method=method,
            calibration_cv=args.calibration_cv,
        )
        model.fit(split.x_train, split.y_train)

        y_pred = model.predict(split.x_test)
        proba = model.predict_proba(split.x_test)
        conf = np.max(proba, axis=1)

        eval_res = evaluate_predictions(f"tfidf_svm_{method}", split.y_test, y_pred)

        rows.append(
            {
                "method": method,
                "accuracy": float(accuracy_score(split.y_test, y_pred)),
                "macro_f1": float(f1_score(split.y_test, y_pred, average="macro", labels=labels, zero_division=0)),
                "weighted_f1": float(
                    f1_score(split.y_test, y_pred, average="weighted", labels=labels, zero_division=0)
                ),
                "kirmizi_recall": eval_res.red_recall,
                "brier_multiclass": multiclass_brier(split.y_test, proba, labels),
                "ece_top1": ece_top1(split.y_test, y_pred, conf),
            }
        )

    report = pd.DataFrame(rows).sort_values(
        by=["kirmizi_recall", "macro_f1", "weighted_f1", "ece_top1"],
        ascending=[False, False, False, True],
    )
    report.to_csv(out_dir / "svm-calibration-comparison.csv", index=False)

    best = report.iloc[0].to_dict()
    (out_dir / "svm-calibration-recommendation.json").write_text(
        json.dumps({"recommended": best, "all": rows}, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(report.to_string(index=False))
    print("\nRecommended:", best["method"])


if __name__ == "__main__":
    main()
