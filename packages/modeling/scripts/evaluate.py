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

from triage_modeling.artifacts import load_artifact
from triage_modeling.config import DataSchema
from triage_modeling.data import load_dataset, split_dataset
from triage_modeling.evaluation import evaluate_predictions, quick_comment
from triage_modeling.training import predict_with_confidence


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate saved triage model.")
    parser.add_argument("--artifact-dir", required=True)
    parser.add_argument("--data-path", required=True)
    parser.add_argument("--test-size", type=float, default=0.2)
    parser.add_argument("--random-state", type=int, default=42)
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    model, metadata = load_artifact(args.artifact_dir)
    schema = DataSchema(**metadata.get("schema", {}))

    df = load_dataset(args.data_path, schema=schema)
    split = split_dataset(df, schema=schema, test_size=args.test_size, random_state=args.random_state)

    y_pred, conf = predict_with_confidence(model, split.x_test)
    result = evaluate_predictions(metadata.get("model_name", "unknown"), split.y_test, y_pred)

    print(json.dumps(
        {
            "accuracy": result.accuracy,
            "macro_f1": result.macro_f1,
            "weighted_f1": result.weighted_f1,
            "kirmizi_recall": result.red_recall,
            "confidence_avg": float(conf.mean()) if len(conf) else None,
        },
        ensure_ascii=False,
        indent=2,
    ))
    print(quick_comment(result))


if __name__ == "__main__":
    main()
