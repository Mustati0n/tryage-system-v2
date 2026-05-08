# Model Bagimli E2E ve Kabul Test Checklist

Bu dosya model entegrasyonu olan ortamlarda (provider=`python-cli`) calistirilacak kontrolleri izler.

## Hazirlik
- [x] PostgreSQL ayakta
- [x] Backend ayakta (`http://localhost:8080`)
- [x] Frontend ayakta (`http://localhost:5173`)
- [x] `packages/modeling/.venv` hazir ve secili artifact mevcut
- [x] `APP_MODEL_PROVIDER=python-cli` ile backend acildi

## API Smoke (Model Bagimli)
- [x] `infra/model-smoke-check.sh` basarili
- [x] `/api/system/models` icinde `selectedModel=tfidf_svm-v1`
- [x] `/api/system/models` `configNote` icinde `provider=python-cli`
- [x] `POST /api/triage/predict` normal senaryoda gecerli etiket + `0..1` guven donuyor
- [x] Guardrail red senaryosu (`gogus agrisi + nefes darligi`) `KIRMIZI` donuyor

## UI E2E (Gercek Backend)
- [x] Personel login -> hasta olustur -> tahmin -> kaydet basarili
- [x] Tahmin kartinda model versiyonu gorunuyor
- [x] Admin login -> kayit sec -> dataset'e ekle basarili
- [x] Ayni kayit ikinci kez dataset'e eklenemiyor

## Klinik Guvenlik Kontrolleri
- [x] Dusuk guvenli YESIL policy'si beklenen durumlarda `SARI`ya yukseltiyor
- [x] Red guardrail aktifken riskli anahtar kelimelerde downgrade olmuyor
- [x] KIRMIZI recall odakli secim notu (`model-selection.json`) guncel

## Raporlama
- [x] Test tarihi/saati not edildi
- [x] Basarisiz adimlar ve ekran goruntuleri eklendi
- [x] Son karar `memory-bank/activeContext.md` ve `progress.md` dosyalarina islendi
