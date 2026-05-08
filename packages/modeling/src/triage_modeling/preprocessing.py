from __future__ import annotations

import re

import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer, OneHotEncoder, StandardScaler

from .bert_embedding import BerturkSentenceEmbedder
from .config import DEFAULT_TEXT_MAX_FEATURES, DEFAULT_TEXT_NGRAM_RANGE


def clean_turkish_text(text: str) -> str:
    s = (text or "").lower().strip()
    s = re.sub(r"\s+", " ", s)
    return s


def _to_1d_text(values: np.ndarray) -> np.ndarray:
    flat = values.ravel()
    return np.array([clean_turkish_text(str(x)) for x in flat], dtype=object)


def build_tfidf_preprocessor(
    age_col: str = "yas",
    gender_col: str = "cinsiyet",
    complaint_col: str = "sikayet",
) -> ColumnTransformer:
    text_pipe = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="constant", fill_value="")),
            ("to_1d", FunctionTransformer(_to_1d_text, validate=False)),
            (
                "tfidf",
                TfidfVectorizer(
                    max_features=DEFAULT_TEXT_MAX_FEATURES,
                    ngram_range=DEFAULT_TEXT_NGRAM_RANGE,
                    min_df=2,
                    max_df=0.98,
                    sublinear_tf=True,
                ),
            ),
        ]
    )

    age_pipe = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scale", StandardScaler()),
        ]
    )

    gender_pipe = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )

    return ColumnTransformer(
        transformers=[
            ("text", text_pipe, [complaint_col]),
            ("age", age_pipe, [age_col]),
            ("gender", gender_pipe, [gender_col]),
        ],
        remainder="drop",
    )


def build_bert_tabular_preprocessor(
    age_col: str = "yas",
    gender_col: str = "cinsiyet",
    complaint_col: str = "sikayet",
    bert_model_name: str = "dbmdz/bert-base-turkish-cased",
    batch_size: int = 16,
    max_length: int = 160,
    device: str = "cpu",
) -> ColumnTransformer:
    text_pipe = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="constant", fill_value="")),
            ("to_1d", FunctionTransformer(_to_1d_text, validate=False)),
            (
                "bert_embed",
                BerturkSentenceEmbedder(
                    model_name=bert_model_name,
                    batch_size=batch_size,
                    max_length=max_length,
                    device=device,
                ),
            ),
        ]
    )

    age_pipe = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scale", StandardScaler()),
        ]
    )

    gender_pipe = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ]
    )

    return ColumnTransformer(
        transformers=[
            ("text", text_pipe, [complaint_col]),
            ("age", age_pipe, [age_col]),
            ("gender", gender_pipe, [gender_col]),
        ],
        remainder="drop",
        sparse_threshold=0.0,
    )
