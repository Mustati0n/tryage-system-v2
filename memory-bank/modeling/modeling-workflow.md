# Model Katmani Is Akisi

Bu dosya sadece modelleme katmani gelistirme adimlarini takip etmek icin tutulur.

## Faz-1: Yapilanma
- [x] `packages/modeling` klasor yapisi olusturuldu
- [x] Ortak config/sabitler/modul iskeleti eklendi

## Faz-2: Ortak Veri ve Preprocessing
- [x] Veri yukleme + kolon dogrulama akisi
- [x] `yas` icin eksik deger doldurma + olcekleme
- [x] `cinsiyet` encode akisi
- [x] `sikayet` text preprocessing akisi

## Faz-3: Modeller
- [x] TF-IDF + Logistic Regression
- [x] TF-IDF + Linear SVM
- [x] BERTurk embedding + LightGBM/XGBoost
- [x] Model registry/factory (config ile model secimi)

## Faz-4: Egitim ve Degerlendirme
- [x] Stratified split/cv akisi (stratified holdout split sabitlendi; cv sonraki iterasyona acik)
- [x] Accuracy + Macro F1 + Weighted F1 + class-wise metrikler
- [x] Confusion matrix + KIRMIZI recall raporu
- [x] Model karsilastirma tablosu (script + cikti formati hazir)

## Faz-5: Inference ve Dokumantasyon
- [x] Artefact kaydet/yukle
- [x] Tek ornekten tahmin scripti
- [x] Kullanim notlari / README guncellemesi
- [x] Memory Bank guncellemesi

## Faz-6: Model Secimi ve Sistem Entegrasyonu
- [x] `triage.csv` ile uc model ayni splitte test edildi
- [x] Sonuclar raporlandi (`packages/modeling/artifacts/compare/comparison.csv`)
- [x] En iyi model secildi: `tfidf_svm` (KIRMIZI recall en yuksek)
- [x] Secili model sabit artifact yoluna alindi (`packages/modeling/artifacts/selected/tfidf_svm`)
- [x] Backend model provider yapisi eklendi (`python-cli` + `heuristic` fallback)
- [x] Model degisimi config/env ile tek noktadan yapilabilir hale getirildi

## Faz-7: Klinik Guvenlik Policy
- [x] Guardrail tabanli keyword escalation eklendi (`red` ve `yellow`)
- [x] Guardrail parametreleri konfig dosyasina alindi (`app.model.guardrail.*`)
- [x] Guardrail davranisi integration test ile dogrulandi

## Faz-8: Confidence Policy
- [x] Dusuk guvenli YESIL tahmini icin policy eklendi (`min-green-confidence`)
- [x] Policy parametresi konfig dosyasina alindi (`app.model.policy.min-green-confidence`)
- [x] Policy davranisi integration test ile dogrulandi (`YESIL -> SARI`)

## Faz-9: Policy Tuning
- [x] `tune_policy.py` scripti eklendi (threshold tuning)
- [x] `tfidf_svm` predictions uzerinden threshold raporu uretildi
- [x] Onerilen esik `0.65` olarak secildi ve backend defaultuna yansitildi

## Faz-10: Kalibrasyon Karsilastirmasi
- [x] `compare_svm_calibration.py` scripti eklendi
- [x] `sigmoid` ve `isotonic` ayni splitte karsilastirildi
- [x] Klinik oncelik (KIRMIZI recall + genel F1) ile `sigmoid` secildi

## Faz-11: Extended Kalibrasyon
- [x] `compare_svm_calibration_extended.py` scripti eklendi
- [x] `sigmoid`, `isotonic` ve `temperature_scaled_sigmoid` ayni akisla karsilastirildi
- [x] Label/probability class-order metrik tutarliligi duzeltildi
- [x] Extended sonuca gore secili artifact kalibrasyonu `isotonic` olarak guncellendi

## Faz-12: Yeni Model Arastirma (LSTM / BERT / Transformer)
- [x] Faz-1 protokol dondurma dokumani olusturuldu (`memory-bank/modeling/phase1-protocol-freeze.md`)
- [x] Faz-2 LSTM ilk deneyi tamamlandi (`packages/modeling/artifacts/phase2/lstm_text/phase2-lstm-summary.md`)
- [x] LSTM artifact fiziksel test icin `selected/lstm_text` altina alindi ve backend varsayilani LSTM'e cevrildi
- [ ] Faz-3 BERT deneyi
- [ ] Faz-4 Transformer deneyi (BERT disi)
- [ ] Faz-5 Klinik odakli nihai secim ve artifact guncellemesi
