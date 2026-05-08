# Faz-1 Protokol Dondurma (Transformer / BERT / LSTM)

## Amaç
Yeni model deneylerinde (LSTM, BERT, Transformer) adil karşılaştırma için veri bölme, metrik ve karar kurallarını sabitlemek.

## Sabit Protokol
- Veri kaynağı: `triage.csv`
- Hedef kolon: `etiket`
- Girdiler: `yas`, `cinsiyet`, `sikayet`
- Split: stratified holdout
- Test oranı: `0.20`
- Random seed: `42`
- Sınıf dengesizliği yaklaşımı:
  - Destekleyen modellerde `class_weight=balanced` denenecek
  - Derin öğrenmede class-weight/focal-loss adayları ayrı deney olarak izlenecek

## Zorunlu Metrikler
- `accuracy`
- `macro_f1`
- `weighted_f1`
- class-wise `precision`, `recall`, `f1`
- confusion matrix
- kritik metrik: `KIRMIZI recall`

## Klinik Öncelik Sırası (Nihai Seçim)
1. KIRMIZI recall
2. Macro F1
3. Inference maliyeti / operasyon kolaylığı

## Baseline
- Referans model korunur: `tfidf_svm` (seçili artifact + policy + guardrail yapısı bozulmaz)

## Deney Kuralları
- Her yeni model aynı split ile raporlanır
- Her model için kısa yorum zorunlu:
  - Güçlü yön
  - Zayıf yön
  - En çok zorlandığı sınıf
- Sonuçlar tek karşılaştırma tablosunda toplanır

## Faz-2 Hazırlık (LSTM)
- Tokenizer/sequence pipeline
- Embedding + sequence classifier
- class-weight/focal-loss varyantı

## Durum
- [x] Protokol donduruldu
- [ ] LSTM deneyi
- [ ] BERT deneyi
- [ ] Transformer deneyi (BERT dışı)
- [ ] Nihai seçim
