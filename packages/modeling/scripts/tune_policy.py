#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd
from sklearn.metrics import accuracy_score, f1_score, recall_score


def evaluate(df: pd.DataFrame, threshold: float) -> dict:
    pred = df["y_pred"].copy()
    escalate_mask = (pred == "YESIL") & (df["confidence"] < threshold)
    pred.loc[escalate_mask] = "SARI"

    y_true = df["y_true"]

    total_not_green = int((y_true != "YESIL").sum())
    unsafe = int(((y_true != "YESIL") & (pred == "YESIL")).sum())

    return {
        "threshold": float(threshold),
        "accuracy": float(accuracy_score(y_true, pred)),
        "macro_f1": float(f1_score(y_true, pred, average="macro", labels=["YESIL", "SARI", "KIRMIZI"], zero_division=0)),
        "weighted_f1": float(
            f1_score(y_true, pred, average="weighted", labels=["YESIL", "SARI", "KIRMIZI"], zero_division=0)
        ),
        "kirmizi_recall": float(recall_score(y_true, pred, labels=["KIRMIZI"], average="macro", zero_division=0)),
        "unsafe_not_green_as_green": unsafe,
        "unsafe_rate": float(unsafe / total_not_green) if total_not_green else 0.0,
        "escalated_green_count": int(escalate_mask.sum()),
    }


def choose_recommendation(rows: list[dict], max_unsafe_rate: float) -> dict:
    feasible = [r for r in rows if r["unsafe_rate"] <= max_unsafe_rate]
    if feasible:
        return sorted(feasible, key=lambda r: (r["weighted_f1"], r["macro_f1"], -r["unsafe_rate"]), reverse=True)[0]
    return sorted(rows, key=lambda r: (r["unsafe_rate"], r["weighted_f1"], r["macro_f1"]))[0]


def main() -> None:
    parser = argparse.ArgumentParser(description="Tune low-confidence green policy threshold.")
    parser.add_argument("--predictions-csv", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--max-unsafe-rate", type=float, default=0.05)
    args = parser.parse_args()

    df = pd.read_csv(args.predictions_csv)
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    thresholds = [round(x, 2) for x in [0.0, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85]]
    rows = [evaluate(df, t) for t in thresholds]
    report = pd.DataFrame(rows)
    report.to_csv(out_dir / "policy-threshold-report.csv", index=False)

    recommended = choose_recommendation(rows, max_unsafe_rate=args.max_unsafe_rate)
    payload = {
        "max_unsafe_rate_target": args.max_unsafe_rate,
        "recommended_threshold": recommended["threshold"],
        "recommended_metrics": recommended,
    }
    (out_dir / "policy-threshold-recommendation.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(report.to_string(index=False))
    print("\nRecommended threshold:", recommended["threshold"])


if __name__ == "__main__":
    main()
