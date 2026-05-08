from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd
import torch
from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.utils.validation import check_is_fitted
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

from ..config import LABELS
from ..preprocessing import clean_turkish_text


class _LSTMNet(nn.Module):
    def __init__(
        self,
        vocab_size: int,
        embedding_dim: int,
        hidden_dim: int,
        extra_dim: int,
        num_classes: int,
        pad_idx: int = 0,
        dropout: float = 0.2,
    ) -> None:
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embedding_dim, padding_idx=pad_idx)
        self.lstm = nn.LSTM(
            input_size=embedding_dim,
            hidden_size=hidden_dim,
            num_layers=1,
            batch_first=True,
            bidirectional=True,
        )
        self.dropout = nn.Dropout(dropout)
        self.classifier = nn.Linear(hidden_dim * 2 + extra_dim, num_classes)

    def forward(self, tokens: torch.Tensor, extra: torch.Tensor) -> torch.Tensor:
        emb = self.embedding(tokens)
        _, (h_n, _) = self.lstm(emb)
        forward_last = h_n[-2]
        backward_last = h_n[-1]
        text_vec = torch.cat([forward_last, backward_last], dim=1)
        feat = torch.cat([self.dropout(text_vec), extra], dim=1)
        return self.classifier(feat)


@dataclass
class _EncodedBatch:
    x_tokens: np.ndarray
    x_extra: np.ndarray


class TriageLSTMClassifier(BaseEstimator, ClassifierMixin):
    def __init__(
        self,
        age_col: str = "yas",
        gender_col: str = "cinsiyet",
        complaint_col: str = "sikayet",
        max_vocab_size: int = 12000,
        min_token_freq: int = 2,
        max_len: int = 96,
        embedding_dim: int = 96,
        hidden_dim: int = 96,
        dropout: float = 0.2,
        lr: float = 1e-3,
        batch_size: int = 64,
        epochs: int = 8,
        class_weight: str | None = None,
        random_state: int = 42,
        device: str = "cpu",
    ) -> None:
        self.age_col = age_col
        self.gender_col = gender_col
        self.complaint_col = complaint_col
        self.max_vocab_size = max_vocab_size
        self.min_token_freq = min_token_freq
        self.max_len = max_len
        self.embedding_dim = embedding_dim
        self.hidden_dim = hidden_dim
        self.dropout = dropout
        self.lr = lr
        self.batch_size = batch_size
        self.epochs = epochs
        self.class_weight = class_weight
        self.random_state = random_state
        self.device = device

    def _tokenize(self, text: str) -> list[str]:
        clean = clean_turkish_text(text)
        return [tok for tok in clean.split(" ") if tok]

    def _build_vocab(self, texts: pd.Series) -> dict[str, int]:
        counter: Counter[str] = Counter()
        for s in texts.fillna("").astype(str):
            counter.update(self._tokenize(s))
        most_common = [t for t, c in counter.items() if c >= self.min_token_freq]
        most_common = most_common[: max(0, self.max_vocab_size - 2)]
        vocab = {"<PAD>": 0, "<UNK>": 1}
        for token in most_common:
            if token not in vocab:
                vocab[token] = len(vocab)
        return vocab

    def _encode_texts(self, texts: pd.Series) -> np.ndarray:
        out = np.zeros((len(texts), self.max_len), dtype=np.int64)
        unk = self.vocab_.get("<UNK>", 1)
        for i, s in enumerate(texts.fillna("").astype(str).tolist()):
            token_ids = [self.vocab_.get(tok, unk) for tok in self._tokenize(s)[: self.max_len]]
            if token_ids:
                out[i, : len(token_ids)] = np.asarray(token_ids, dtype=np.int64)
        return out

    def _fit_gender_levels(self, values: pd.Series) -> None:
        levels = sorted(set(values.fillna("BILINMIYOR").astype(str).str.upper().str.strip().tolist()))
        self.gender_levels_ = levels
        self.gender_to_idx_ = {g: i for i, g in enumerate(levels)}

    def _encode_gender(self, values: pd.Series) -> np.ndarray:
        vals = values.fillna("BILINMIYOR").astype(str).str.upper().str.strip().tolist()
        out = np.zeros((len(vals), len(self.gender_levels_)), dtype=np.float32)
        for i, g in enumerate(vals):
            j = self.gender_to_idx_.get(g)
            if j is not None:
                out[i, j] = 1.0
        return out

    def _fit_age_stats(self, values: pd.Series) -> None:
        ages = pd.to_numeric(values, errors="coerce")
        med = float(np.nanmedian(ages))
        filled = np.where(np.isnan(ages), med, ages).astype(np.float32)
        mean = float(np.mean(filled))
        std = float(np.std(filled))
        self.age_median_ = med
        self.age_mean_ = mean
        self.age_std_ = std if std > 1e-8 else 1.0

    def _encode_age(self, values: pd.Series) -> np.ndarray:
        ages = pd.to_numeric(values, errors="coerce")
        filled = np.where(np.isnan(ages), self.age_median_, ages).astype(np.float32)
        scaled = (filled - self.age_mean_) / self.age_std_
        return scaled.reshape(-1, 1).astype(np.float32)

    def _encode(self, x: pd.DataFrame) -> _EncodedBatch:
        x_tokens = self._encode_texts(x[self.complaint_col])
        x_gender = self._encode_gender(x[self.gender_col])
        x_age = self._encode_age(x[self.age_col])
        x_extra = np.concatenate([x_age, x_gender], axis=1)
        return _EncodedBatch(x_tokens=x_tokens, x_extra=x_extra)

    def _set_torch_seed(self) -> None:
        torch.manual_seed(self.random_state)
        np.random.seed(self.random_state)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(self.random_state)

    def fit(self, x: pd.DataFrame, y: pd.Series) -> "TriageLSTMClassifier":
        self._set_torch_seed()
        self.classes_ = np.array(LABELS, dtype=object)
        self.class_to_idx_ = {c: i for i, c in enumerate(self.classes_)}

        self.vocab_ = self._build_vocab(x[self.complaint_col])
        self._fit_gender_levels(x[self.gender_col])
        self._fit_age_stats(x[self.age_col])

        encoded = self._encode(x)
        y_idx = np.array([self.class_to_idx_[str(label)] for label in y.tolist()], dtype=np.int64)

        ds = TensorDataset(
            torch.from_numpy(encoded.x_tokens),
            torch.from_numpy(encoded.x_extra),
            torch.from_numpy(y_idx),
        )
        loader = DataLoader(ds, batch_size=self.batch_size, shuffle=True)

        dev = torch.device("cuda" if self.device == "cuda" and torch.cuda.is_available() else "cpu")
        self.device_ = dev
        self.model_ = _LSTMNet(
            vocab_size=len(self.vocab_),
            embedding_dim=self.embedding_dim,
            hidden_dim=self.hidden_dim,
            extra_dim=encoded.x_extra.shape[1],
            num_classes=len(self.classes_),
            dropout=self.dropout,
        ).to(dev)

        if self.class_weight == "balanced":
            counts = np.bincount(y_idx, minlength=len(self.classes_)).astype(np.float32)
            counts[counts == 0] = 1.0
            weights = len(y_idx) / (len(self.classes_) * counts)
            criterion = nn.CrossEntropyLoss(weight=torch.tensor(weights, dtype=torch.float32, device=dev))
        else:
            criterion = nn.CrossEntropyLoss()

        optimizer = torch.optim.Adam(self.model_.parameters(), lr=self.lr)

        self.model_.train()
        for _ in range(self.epochs):
            for batch_tokens, batch_extra, batch_y in loader:
                batch_tokens = batch_tokens.to(dev)
                batch_extra = batch_extra.to(dev)
                batch_y = batch_y.to(dev)

                optimizer.zero_grad(set_to_none=True)
                logits = self.model_(batch_tokens, batch_extra)
                loss = criterion(logits, batch_y)
                loss.backward()
                optimizer.step()

        self.is_fitted_ = True
        return self

    def _predict_logits(self, x: pd.DataFrame) -> np.ndarray:
        check_is_fitted(self, "is_fitted_")
        encoded = self._encode(x)
        ds = TensorDataset(torch.from_numpy(encoded.x_tokens), torch.from_numpy(encoded.x_extra))
        loader = DataLoader(ds, batch_size=self.batch_size, shuffle=False)

        self.model_.eval()
        chunks: list[np.ndarray] = []
        with torch.no_grad():
            for batch_tokens, batch_extra in loader:
                logits = self.model_(batch_tokens.to(self.device_), batch_extra.to(self.device_))
                chunks.append(logits.cpu().numpy())
        return np.vstack(chunks) if chunks else np.zeros((0, len(self.classes_)), dtype=np.float32)

    def predict_proba(self, x: pd.DataFrame) -> np.ndarray:
        logits = self._predict_logits(x)
        tensor = torch.from_numpy(logits)
        probs = torch.softmax(tensor, dim=1).numpy()
        return probs

    def predict(self, x: pd.DataFrame) -> np.ndarray:
        probs = self.predict_proba(x)
        idx = np.argmax(probs, axis=1)
        return self.classes_[idx]


def build_lstm_text_pipeline(
    class_weight: str | None = None,
    max_vocab_size: int = 12000,
    min_token_freq: int = 2,
    max_len: int = 96,
    embedding_dim: int = 96,
    hidden_dim: int = 96,
    dropout: float = 0.2,
    lr: float = 1e-3,
    batch_size: int = 64,
    epochs: int = 8,
    random_state: int = 42,
    device: str = "cpu",
    **_: Any,
) -> TriageLSTMClassifier:
    return TriageLSTMClassifier(
        class_weight=class_weight,
        max_vocab_size=max_vocab_size,
        min_token_freq=min_token_freq,
        max_len=max_len,
        embedding_dim=embedding_dim,
        hidden_dim=hidden_dim,
        dropout=dropout,
        lr=lr,
        batch_size=batch_size,
        epochs=epochs,
        random_state=random_state,
        device=device,
    )
