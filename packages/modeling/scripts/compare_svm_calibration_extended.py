#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.optimize import minimize_scalar
from sklearn.metrics import accuracy_score, f1_score, log_loss, recall_score
from sklearn.model_selection import train_test_split


LABELS = ["YESIL", "SARI", "KIRMIZI"]


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


def temp_scale_probs(probs: np.ndarray, temperature: float) -> np.ndarray:
    eps = 1e-12
    logits = np.log(np.clip(probs, eps, 1.0))
    scaled = logits / temperature
    scaled = scaled - np.max(scaled, axis=1, keepdims=True)
    exp = np.exp(scaled)
    return exp / exp.sum(axis=1, keepdims=True)


def tune_temperature(calib_probs: np.ndarray, y_calib: pd.Series, class_labels: list[str]) -> float:
    class_to_idx = {label: idx for idx, label in enumerate(class_labels)}
    y_idx = np.array([class_to_idx[y] for y in y_calib.values])

    def objective(t: float) -> float:
        p = temp_scale_probs(calib_probs, t)
        return float(log_loss(y_idx, p, labels=list(range(len(class_labels)))))

    result = minimize_scalar(objective, bounds=(0.5, 5.0), method="bounded")
    return float(result.x)


def score_row(
    method: str,
    y_true: pd.Series,
    y_pred: np.ndarray,
    proba: np.ndarray,
    class_labels: list[str],
) -> dict:
    conf = np.max(proba, axis=1)
    return {
        "method": method,
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "macro_f1": float(f1_score(y_true, y_pred, average="macro", labels=LABELS, zero_division=0)),
        "weighted_f1": float(f1_score(y_true, y_pred, average="weighted", labels=LABELS, zero_division=0)),
        "kirmizi_recall": float(recall_score(y_true, y_pred, labels=["KIRMIZI"], average="macro", zero_division=0)),
        "brier_multiclass": multiclass_brier(y_true, proba, class_labels),
        "ece_top1": ece_top1(y_true, y_pred, conf),
        "nll": float(log_loss(y_true, proba, labels=class_labels)),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Extended calibration comparison for tfidf_svm.")
    parser.add_argument("--data-path", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--test-size", type=float, default=0.2)
    parser.add_argument("--calib-size", type=float, default=0.2)
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

    from triage_modeling.data import load_dataset
    from triage_modeling.registry import create_model

    class_weight = None if args.class_weight == "none" else args.class_weight
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    df = load_dataset(args.data_path)
    X = df[["yas", "cinsiyet", "sikayet"]].copy()
    y = df["etiket"].copy()

    x_dev, x_test, y_dev, y_test = train_test_split(
        X,
        y,
        test_size=args.test_size,
        random_state=args.random_state,
        stratify=y,
    )

    x_train, x_calib, y_train, y_calib = train_test_split(
        x_dev,
        y_dev,
        test_size=args.calib_size,
        random_state=args.random_state,
        stratify=y_dev,
    )

    rows: list[dict] = []

    svm_sigmoid = create_model(
        "tfidf_svm",
        class_weight=class_weight,
        calibration_method="sigmoid",
        calibration_cv=args.calibration_cv,
    )
    svm_sigmoid.fit(x_train, y_train)
    prob_sigmoid = svm_sigmoid.predict_proba(x_test)
    pred_sigmoid = svm_sigmoid.predict(x_test)
    classes_sigmoid = list(svm_sigmoid.named_steps["clf"].classes_)
    rows.append(score_row("sigmoid", y_test, pred_sigmoid, prob_sigmoid, classes_sigmoid))

    svm_isotonic = create_model(
        "tfidf_svm",
        class_weight=class_weight,
        calibration_method="isotonic",
        calibration_cv=args.calibration_cv,
    )
    svm_isotonic.fit(x_train, y_train)
    prob_isotonic = svm_isotonic.predict_proba(x_test)
    pred_isotonic = svm_isotonic.predict(x_test)
    classes_isotonic = list(svm_isotonic.named_steps["clf"].classes_)
    rows.append(score_row("isotonic", y_test, pred_isotonic, prob_isotonic, classes_isotonic))

    calib_probs = svm_sigmoid.predict_proba(x_calib)
    temperature = tune_temperature(calib_probs, y_calib, classes_sigmoid)

    prob_temp = temp_scale_probs(prob_sigmoid, temperature)
    pred_temp = np.array([classes_sigmoid[i] for i in np.argmax(prob_temp, axis=1)])
    temp_row = score_row(
        "temperature_scaled_sigmoid",
        y_test,
        pred_temp,
        prob_temp,
        classes_sigmoid,
    )
    temp_row["temperature"] = temperature
    rows.append(temp_row)

    report = pd.DataFrame(rows)
    report = report.sort_values(
        by=["kirmizi_recall", "macro_f1", "weighted_f1", "ece_top1", "nll"],
        ascending=[False, False, False, True, True],
    ).reset_index(drop=True)

    report.to_csv(out_dir / "svm-calibration-extended-comparison.csv", index=False)

    best = report.iloc[0].to_dict()
    if "temperature" in best and pd.isna(best["temperature"]):
        best["temperature"] = None
    payload = {
        "recommended": best,
        "temperature_if_used": temperature,
        "criteria": ["kirmizi_recall", "macro_f1", "weighted_f1", "ece_top1", "nll"],
    }
    (out_dir / "svm-calibration-extended-recommendation.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(report.to_string(index=False))
    print("\nRecommended:", best["method"])


if __name__ == "__main__":
    main()
