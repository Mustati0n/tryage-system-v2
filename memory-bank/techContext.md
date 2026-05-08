# Tech Context

## Önerilen Teknoloji Seti (Baseline)
> Not: Baseline, `bitirme_api_analiz.docx` + gereksinimler + UML üzerinden netleştirildi.

## Backend
- Dil/Çatı: `Java 21 + Spring Boot 3.x`
- API: Spring Web + Validation
- Auth: Spring Security + JWT (`access + refresh`) (onaylandı)
- DB erişimi: Spring Data JPA
- Veritabanı: `PostgreSQL 16`
- Migration: Flyway
- Dokümantasyon: springdoc OpenAPI

## Frontend
- `React + TypeScript + Vite`
- UI: sade component tabanlı yaklaşım (gerekirse MUI/AntD)
- Veri erişimi: TanStack Query + Axios
- Form: React Hook Form + Zod
- Browser E2E: Playwright

## Ses ve Model
- STT: local Whisper/faster-whisper (onaylandı)
  - MVP: batch transcribe
  - Sonraki faz: canlı transcript
- Model: harici `ModelService` entegrasyonu (REST/gRPC fark etmez, adapter ile soyutlanır)
- Ayrik modelleme paketi: `packages/modeling` (Python)
  - Baseline/aday modeller: `TF-IDF+LogReg`, `TF-IDF+LinearSVM`, `BERTurk embedding + LightGBM/XGBoost`
  - Ortak scriptler: `train.py`, `evaluate.py`, `compare.py`, `predict_one.py`
  - Secili model: `tfidf_svm` (`packages/modeling/artifacts/selected/tfidf_svm`)
  - Secim notu: `packages/modeling/artifacts/selected/model-selection.json`
- Backend model entegrasyonu:
  - `ModelInferenceService` ile `app.model.provider` bazli cagrim
  - `python-cli` provider: `predict_one.py` uzerinden artifact inference
  - `heuristic` provider: fallback yol
  - `app.model.guardrail.*` ile red/yellow keyword bazli klinik escalation desteği
  - `app.model.policy.min-green-confidence` ile low-confidence green policy desteği
  - `packages/modeling/scripts/tune_policy.py` ile threshold tuning desteği
  - `packages/modeling/scripts/compare_svm_calibration.py` ile SVM calibration (`sigmoid/isotonic`) karsilastirmasi
  - `packages/modeling/scripts/compare_svm_calibration_extended.py` ile genisletilmis calibration karsilastirmasi (`sigmoid/isotonic/temperature scaling`)
  - Guncel secili artifact kalibrasyonu: `isotonic`

## Linux + Veritabanı Değerlendirmesi
- Linux kullanımı için en pratik ve stabil seçenek PostgreSQL.
- Veritabanı seçimi işletim sisteminden çok veri modeli/ölçek/güvenilirlik ile ilgilidir.
- Linux tarafında PostgreSQL kurulumu, backup, log ve performans araçları olgun.
- Sonuç: Linux için “DB çok fark eder mi?” sorusunda, evet mimari ve operasyonel açıdan eder; ancak PostgreSQL bu proje için güvenli varsayılandır.

## Dev Setup
- Monorepo dizin yapısı:
  - `apps/backend`
  - `apps/frontend`
  - `packages/contracts`
  - `infra` (docker-compose, nginx, env örnekleri)
  - `memory-bank`
- Çalıştırma: `docker-compose` ile db + backend + frontend
- Fedora notu: Docker yoksa `podman/podman-compose` ile aynı compose dosyası çalıştırılabilir.
- Yardımcı script: `infra/start-db.sh` (`docker` -> `podman-compose` -> `podman compose` fallback)
- Yardımcı smoke script: `infra/smoke-check.sh` (health + demo login kontrolu)
- Model bagimli smoke script: `infra/model-smoke-check.sh` (`/api/system/models` + `/api/triage/predict` + guardrail kontrolu)

## Teknik Kısıtlar
- KVKK/operasyon politikası:
  - Ses dosyası saklama opsiyonel
  - Ses saklanırsa retention: 30 gün
  - Log retention: 30 gün
  - Transkript + kayıt verisi: proje süresince / manuel silinene kadar
- Model servis gecikmesi kullanıcı deneyimini etkileyeceği için timeout/retry stratejisi şart
- Confidence standardı:
  - Backend: `0..1` float
  - Frontend: `%` gösterim
- Admin kalite puanı özelliği MVP dışında planlandı
