#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from triage_modeling.config import TrainConfig
from triage_modeling.evaluation import quick_comment, summarize_results
from triage_modeling.training import train_once


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Compare all triage models on same split.")
    parser.add_argument("--data-path", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--test-size", type=float, default=0.2)
    parser.add_argument("--random-state", type=int, default=42)
    parser.add_argument("--class-weight", choices=["none", "balanced"], default="none")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    output_root = Path(args.output_dir)
    output_root.mkdir(parents=True, exist_ok=True)

    class_weight = None if args.class_weight == "none" else args.class_weight
    model_names = ["tfidf_logreg", "tfidf_svm", "berturk_gbdt"]

    results = []
    comments: dict[str, str] = {}

    for name in model_names:
        cfg = TrainConfig(
            model_name=name,
            output_dir=output_root / name,
            test_size=args.test_size,
            random_state=args.random_state,
            class_weight=class_weight,
        )
        _, eval_result, _ = train_once(config=cfg, data_path=args.data_path)
        results.append(eval_result)
        comments[name] = quick_comment(eval_result)

    summary = summarize_results(results)
    summary.to_csv(output_root / "comparison.csv", index=False)
    md_lines = []
    if not summary.empty:
        headers = list(summary.columns)
        md_lines.append("| " + " | ".join(headers) + " |")
        md_lines.append("| " + " | ".join(["---"] * len(headers)) + " |")
        for _, row in summary.iterrows():
            md_lines.append("| " + " | ".join(str(row[h]) for h in headers) + " |")
    else:
        md_lines.append("No comparison rows produced.")
    (output_root / "comparison.md").write_text("\n".join(md_lines), encoding="utf-8")
    (output_root / "model_comments.json").write_text(json.dumps(comments, ensure_ascii=False, indent=2), encoding="utf-8")

    print(summary.to_string(index=False))
    print("\nModel yorumlari:")
    for model_name, note in comments.items():
        print(f"- {model_name}: {note}")


if __name__ == "__main__":
    main()
