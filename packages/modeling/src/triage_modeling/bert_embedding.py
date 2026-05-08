from __future__ import annotations

from typing import Any

import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin


class BerturkSentenceEmbedder(BaseEstimator, TransformerMixin):
    """Converts Turkish complaint text to dense BERT embeddings."""

    def __init__(
        self,
        model_name: str = "dbmdz/bert-base-turkish-cased",
        batch_size: int = 16,
        max_length: int = 160,
        device: str = "cpu",
    ) -> None:
        self.model_name = model_name
        self.batch_size = batch_size
        self.max_length = max_length
        self.device = device

        self._tokenizer = None
        self._model = None
        self._torch = None

    def fit(self, x: np.ndarray, y: np.ndarray | None = None) -> "BerturkSentenceEmbedder":
        self._ensure_loaded()
        self.is_fitted_ = True
        return self

    def transform(self, x: np.ndarray) -> np.ndarray:
        if not hasattr(self, "is_fitted_"):
            raise RuntimeError("BerturkSentenceEmbedder fit edilmeden transform cagrildi.")
        self._ensure_loaded()
        texts = [str(t) for t in x]

        vectors: list[np.ndarray] = []
        for i in range(0, len(texts), self.batch_size):
            batch = texts[i : i + self.batch_size]
            encoded = self._tokenizer(
                batch,
                padding=True,
                truncation=True,
                max_length=self.max_length,
                return_tensors="pt",
            )
            encoded = {k: v.to(self.device) for k, v in encoded.items()}

            with self._torch.no_grad():
                outputs = self._model(**encoded)
                last_hidden = outputs.last_hidden_state
                attention = encoded["attention_mask"].unsqueeze(-1)
                masked = last_hidden * attention
                summed = masked.sum(dim=1)
                denom = attention.sum(dim=1).clamp(min=1)
                mean_pooled = summed / denom
                vectors.append(mean_pooled.cpu().numpy())

        return np.vstack(vectors)

    def _ensure_loaded(self) -> None:
        if self._model is not None and self._tokenizer is not None:
            return

        try:
            import torch
            from transformers import AutoModel, AutoTokenizer
        except ImportError as exc:
            raise RuntimeError(
                "BERTurk embedding icin 'transformers' ve 'torch' gerekli. "
                "requirements.txt icinden yukleyin."
            ) from exc

        self._torch = torch
        self._tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self._model = AutoModel.from_pretrained(self.model_name).to(self.device)
        self._model.eval()

    def __getstate__(self) -> dict[str, Any]:
        state = self.__dict__.copy()
        state["_tokenizer"] = None
        state["_model"] = None
        state["_torch"] = None
        return state
