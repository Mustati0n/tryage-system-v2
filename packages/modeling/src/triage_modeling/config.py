from dataclasses import dataclass
from pathlib import Path
from typing import Any

LABELS = ["YESIL", "SARI", "KIRMIZI"]
RANDOM_STATE = 42

DEFAULT_TEXT_MAX_FEATURES = 30000
DEFAULT_TEXT_NGRAM_RANGE = (1, 2)


@dataclass(frozen=True)
class DataSchema:
    age_col: str = "yas"
    gender_col: str = "cinsiyet"
    complaint_col: str = "sikayet"
    target_col: str = "etiket"


@dataclass(frozen=True)
class TrainConfig:
    model_name: str
    output_dir: Path
    test_size: float = 0.2
    random_state: int = RANDOM_STATE
    class_weight: str | None = None
    model_params: dict[str, Any] | None = None


LABEL_ALIASES = {
    "YESIL": "YESIL",
    "YEŞIL": "YESIL",
    "YEŞİL": "YESIL",
    "SARI": "SARI",
    "KIRMIZI": "KIRMIZI",
}
