from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib


def save_artifact(model: Any, metadata: dict[str, Any], output_dir: str | Path) -> None:
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    joblib.dump(model, out / "model.joblib")
    (out / "metadata.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")


def load_artifact(artifact_dir: str | Path) -> tuple[Any, dict[str, Any]]:
    root = Path(artifact_dir)
    model = joblib.load(root / "model.joblib")
    metadata = json.loads((root / "metadata.json").read_text(encoding="utf-8"))
    return model, metadata
