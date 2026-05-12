# Faz-5 Final Model Secimi (Klinik Oncelik)

## Karar Kriteri
1. `KIRMIZI recall`
2. `macro_f1`
3. Inference gecikmesi ve operasyonel kolaylik

## Ayni Protokolde Karsilastirma (test_size=0.2, random_state=42)
| Model | Accuracy | Macro F1 | Weighted F1 | KIRMIZI Recall |
|---|---:|---:|---:|---:|
| tfidf_svm | 0.7902 | 0.7879 | 0.7893 | **0.8067** |
| berturk_gbdt | 0.7567 | 0.7592 | 0.7584 | 0.7395 |
| xlmr_gbdt | 0.7188 | 0.7164 | 0.7185 | 0.7227 |
| lstm_text | 0.6741 | 0.6785 | 0.6789 | 0.6639 |

## Sonuc
- Nihai secim: `tfidf_svm`
- Neden:
  - Klinik oncelik metriginde (`KIRMIZI recall`) en yuksek sonuc
  - Genel denge metrikleri (`macro_f1`, `weighted_f1`) daha iyi
  - Uretim gecikmesi ve operasyonel yuk diger derin modellerden daha dusuk

## Entegrasyon Durumu
- Secili artifact: `packages/modeling/artifacts/selected/tfidf_svm`
- Backend default: `APP_MODEL_ARTIFACT_DIR=../../packages/modeling/artifacts/selected/tfidf_svm`
- Smoke check default: `EXPECTED_MODEL=tfidf_svm-v1`
