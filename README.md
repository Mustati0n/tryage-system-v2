# Akilli Triage System

Monorepo yapisi:
- `apps/backend`: Spring Boot API
- `apps/frontend`: React UI
- `packages/contracts`: ortak tipler
- `packages/modeling`: model egitimi/karsilastirma/inference katmani
- `infra`: local altyapi (docker-compose)

## Hızlı Başlangıç

Detayli operasyon adimlari ve sorun giderme:
- `memory-bank/deployment/operations-runbook.md`

### 1) PostgreSQL
```bash
cd infra
./start-db.sh
```

Eger `docker` yoksa script otomatik olarak `podman-compose` veya `podman compose` dener.

### 2) Backend
```bash
cd apps/backend
./mvnw spring-boot:run   # mvnw yoksa: mvn spring-boot:run
```

### 2.1) Local STT (faster-whisper) Kurulumu
```bash
# Fedora/RHEL
sudo dnf install -y ffmpeg python3 python3-pip

cd apps/backend
python3 -m pip install --user faster-whisper
```

Notlar:
- STT scripti: `apps/backend/scripts/stt_faster_whisper.py`
- Varsayilan provider: `faster-whisper-cli`
- STT ayarlari `apps/backend/.env.example` icinde mevcut

### 3) Frontend
```bash
cd apps/frontend
npm install
npm run dev
```

### 4) Demo Kullanıcılar
- `admin / admin123`
- `personel / personel123`

### 5) Smoke Check (model harici hızlı doğrulama)
```bash
cd infra
./smoke-check.sh
```

### 5.1) Model Smoke Check (model bagimli)
Onkosul:
- Backend `APP_MODEL_PROVIDER=python-cli` ile acik olmali
- `packages/modeling/.venv` ve secili artifact hazir olmali

```bash
cd infra
./model-smoke-check.sh
```

### 6) Browser-level E2E (Playwright)
```bash
cd apps/frontend
npx playwright install chromium   # bir kez
npm run e2e
```

### 7) Browser-level E2E (Gercek Backend ile)
Onkosul:
- PostgreSQL ve backend ayakta olmali (`http://localhost:8080`)

Komut:
```bash
cd apps/frontend
npm run e2e:real
```

Not:
- `e2e` komutu mock API ile hizli UI akis testi yapar.
- `e2e:real` komutu gercek backend endpointlerine baglanir.

## Modelleme Katmani (Backend'e Dokunmadan)

Bu repo icinde model secimi/egitimi/degerlendirmesi `packages/modeling` altinda ayrik tutulur.

### Modelleme Kurulumu
```bash
cd packages/modeling
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Tek Model Egitim
```bash
python scripts/train.py \
  --data-path /path/to/data.csv \
  --model tfidf_logreg \
  --output-dir artifacts/tfidf_logreg
```

### Tum Modelleri Karsilastirma
```bash
python scripts/compare.py \
  --data-path /path/to/data.csv \
  --output-dir artifacts/compare \
  --class-weight balanced
```

### Tek Ornek Tahmin
```bash
python scripts/predict_one.py \
  --artifact-dir artifacts/tfidf_logreg \
  --yas 40 \
  --cinsiyet KADIN \
  --sikayet \"gogus agrisi ve nefes darligi\"
```

### Sisteme Entegre Secili Model
- Karsilastirma sonucu secilen model: `tfidf_svm`
- Secim kaydi: `packages/modeling/artifacts/selected/model-selection.json`
- Backend varsayilan artifact yolu:
  - `../../packages/modeling/artifacts/selected/tfidf_svm`

Model degistirmek icin sadece config/env:
```bash
APP_MODEL_PROVIDER=python-cli
APP_MODEL_ARTIFACT_DIR=../../packages/modeling/artifacts/selected/tfidf_svm
APP_MODEL_SCRIPT_PATH=../../packages/modeling/scripts/predict_one.py
APP_MODEL_PYTHON_BINARY=../../packages/modeling/.venv/bin/python
```

### Klinik Guardrail (KIRMIZI kacirmama destegi)
Model sonucu YESIL olsa bile riskli anahtar kelimelerde tahmini guvenli seviyeye yukseltebilirsin:

```bash
APP_MODEL_GUARDRAIL_ENABLED=true
APP_MODEL_GUARDRAIL_RED_KEYWORDS="nefes darligi,gogus agrisi,bilinc kaybi,bayilma,siddetli kanama,felc"
APP_MODEL_GUARDRAIL_YELLOW_KEYWORDS="ates,karin agrisi,kusma,bas donmesi,cok agri"
APP_MODEL_POLICY_MIN_GREEN_CONFIDENCE=0.65
```

Davranis:
- `red` sinyali varsa: etiket en az `KIRMIZI`
- `yellow` sinyali varsa ve model `YESIL` dediyse: etiket `SARI`
- `YESIL` confidence bu esigin altindaysa: etiket `SARI`

Not:
- `triage.csv` analizinde (`unsafe_rate <= 0.05` hedefi) onerilen policy esigi `0.65` bulundu.
- Rapor dosyalari: `packages/modeling/artifacts/selected/tfidf_svm/policy-threshold-report.csv` ve `policy-threshold-recommendation.json`
- Tuning scripti: `packages/modeling/scripts/tune_policy.py`
- Guncel kalibrasyon secimi: `isotonic` (extended karsilastirma: `compare_svm_calibration_extended.py`)
