# Faz-2 LSTM Ilk Deneme Ozeti

## Protokol
- Veri: `triage.csv`
- Split: stratified holdout (`test_size=0.20`)
- Seed: `42`
- Class weight: `balanced`

## LSTM Sonucu (`lstm_text`)
- Accuracy: `0.6741`
- Macro F1: `0.6785`
- Weighted F1: `0.6789`
- KIRMIZI Recall: `0.6639`

## Baseline ile Kisa Kiyas
- `tfidf_svm`:
  - Macro F1: `0.7907`
  - KIRMIZI Recall: `0.8151`
- Ilk LSTM denemesi, mevcut baseline'in gerisinde.

## Yorum
- Bu sonuc LSTM'in bu hiperparametrelerle yeterli olmadigini gosteriyor.
- Faz-2 icin sonraki alt adim: LSTM tuning (epoch/hidden_dim/max_len/lr/focal-loss adayi).
