from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path

import pandas as pd
from sklearn.model_selection import train_test_split

from .config import DataSchema, LABELS, LABEL_ALIASES, RANDOM_STATE


@dataclass
class DatasetSplit:
    x_train: pd.DataFrame
    x_test: pd.DataFrame
    y_train: pd.Series
    y_test: pd.Series


def _normalize_text(value: object) -> str:
    if value is None:
        return ""
    return str(value).strip()


def normalize_label(label: object) -> str:
    text = _normalize_text(label).upper()
    return LABEL_ALIASES.get(text, text)


def load_dataset(data_path: str | Path, schema: DataSchema | None = None) -> pd.DataFrame:
    schema = schema or DataSchema()
    path = Path(data_path)
    if not path.exists():
        raise FileNotFoundError(f"Dataset bulunamadi: {path}")

    delimiter = _detect_delimiter(path)
    df = pd.read_csv(path, sep=delimiter)
    required_cols = [schema.age_col, schema.gender_col, schema.complaint_col, schema.target_col]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"Dataset zorunlu kolonlari eksik: {missing}")

    out = df[required_cols].copy()
    out[schema.gender_col] = out[schema.gender_col].astype("string").fillna("BILINMIYOR").str.upper().str.strip()
    out[schema.complaint_col] = out[schema.complaint_col].astype("string").fillna("")
    out[schema.target_col] = out[schema.target_col].map(normalize_label)

    # Some CSV exports may contain duplicated header rows in the middle.
    out = out[
        (out[schema.target_col].astype(str).str.upper().str.strip() != schema.target_col.upper())
        & (out[schema.gender_col].astype(str).str.upper().str.strip() != schema.gender_col.upper())
    ].copy()

    unknown_labels = sorted(set(out[schema.target_col].dropna().unique()) - set(LABELS))
    if unknown_labels:
        raise ValueError(f"Beklenmeyen etiketler var: {unknown_labels}")

    return out


def _detect_delimiter(path: Path) -> str:
    with path.open("r", encoding="utf-8", newline="") as f:
        sample = f.read(4096)
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",;\t|")
        return dialect.delimiter
    except csv.Error:
        return ","


def split_dataset(
    df: pd.DataFrame,
    schema: DataSchema | None = None,
    test_size: float = 0.2,
    random_state: int = RANDOM_STATE,
) -> DatasetSplit:
    schema = schema or DataSchema()
    x = df[[schema.age_col, schema.gender_col, schema.complaint_col]].copy()
    y = df[schema.target_col].copy()

    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=test_size,
        random_state=random_state,
        stratify=y,
    )

    return DatasetSplit(x_train=x_train, x_test=x_test, y_train=y_train, y_test=y_test)
