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
from triage_modeling.evaluation import quick_comment
from triage_modeling.registry import available_models
from triage_modeling.training import train_once


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train one triage model.")
    parser.add_argument("--data-path", required=True)
    parser.add_argument("--model", required=True, choices=available_models())
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--test-size", type=float, default=0.2)
    parser.add_argument("--random-state", type=int, default=42)
    parser.add_argument("--class-weight", choices=["none", "balanced"], default="none")
    parser.add_argument("--svm-calibration-method", choices=["sigmoid", "isotonic"], default="sigmoid")
    parser.add_argument("--svm-calibration-cv", type=int, default=3)
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    class_weight = None if args.class_weight == "none" else args.class_weight
    cfg = TrainConfig(
        model_name=args.model,
        output_dir=Path(args.output_dir),
        test_size=args.test_size,
        random_state=args.random_state,
        class_weight=class_weight,
        model_params=(
            {"calibration_method": args.svm_calibration_method, "calibration_cv": args.svm_calibration_cv}
            if args.model == "tfidf_svm"
            else {}
        ),
    )

    _, result, metadata = train_once(config=cfg, data_path=args.data_path)

    print("Training tamamlandi")
    print(json.dumps(metadata["metrics"], indent=2, ensure_ascii=False))
    print(quick_comment(result))


if __name__ == "__main__":
    main()
