#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from triage_modeling.artifacts import load_artifact
from triage_modeling.training import predict_with_confidence


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Predict triage label for one sample.")
    parser.add_argument("--artifact-dir", required=True)
    parser.add_argument("--yas", type=float, required=True)
    parser.add_argument("--cinsiyet", required=True)
    parser.add_argument("--sikayet", required=True)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    model, metadata = load_artifact(args.artifact_dir)

    x = pd.DataFrame(
        [
            {
                "yas": args.yas,
                "cinsiyet": args.cinsiyet,
                "sikayet": args.sikayet,
            }
        ]
    )

    y_pred, conf = predict_with_confidence(model, x)
    out = {
        "model": metadata.get("model_name"),
        "etiket": y_pred[0],
        "confidence": float(conf[0]) if len(conf) else None,
    }
    print(json.dumps(out, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
