# Operations Runbook (Local / Demo)

Bu runbook projeyi sifirdan ayağa kaldirmak, kontrol etmek ve temel operasyon adimlarini standart hale getirmek icindir.

## 1) On Kosullar
- Java 21+
- Maven 3.9+
- Node 20+
- Python 3 + pip
- Container runtime: docker veya podman

## 2) Veritabani Baslatma
```bash
cd infra
./start-db.sh
```

Kontrol:
```bash
# docker kullaniyorsan
docker ps | rg akilli-triage-postgres

# podman kullaniyorsan
podman ps | rg akilli-triage-postgres
```

## 3) Backend Baslatma
```bash
cd apps/backend
mvn spring-boot:run
```

Health kontrol:
```bash
curl -i http://localhost:8080/api/health
```

## 4) Frontend Baslatma
Yeni terminal:
```bash
cd apps/frontend
npm install
npm run dev
```

URL:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`

Demo kullanicilar:
- `admin / admin123`
- `personel / personel123`

## 5) Model Provider (Opsiyonel: python-cli)
Modeli secili artifact ile calistirmak icin backend terminalinde env set et:

```bash
export APP_MODEL_PROVIDER=python-cli
export APP_MODEL_ARTIFACT_DIR=../../packages/modeling/artifacts/selected/tfidf_svm
export APP_MODEL_SCRIPT_PATH=../../packages/modeling/scripts/predict_one.py
export APP_MODEL_PYTHON_BINARY=../../packages/modeling/.venv/bin/python
```

Model venv hazir degilse:
```bash
cd packages/modeling
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 6) Hizli Dogrulama
Model harici smoke:
```bash
cd infra
./smoke-check.sh
```

Model bagimli smoke:
```bash
cd infra
./model-smoke-check.sh
```

## 7) Test Komutlari
Backend testleri:
```bash
cd apps/backend
mvn test
```

Frontend build:
```bash
cd apps/frontend
npm run build
```

Playwright (mock):
```bash
cd apps/frontend
npx playwright install chromium
npm run e2e
```

Playwright (real backend):
```bash
cd apps/frontend
npm run e2e:real
```

## 8) Sik Gorulen Problemler

### 8.1 `Connection to localhost:5432 refused`
Sebep: PostgreSQL ayakta degil.
Cozum:
```bash
cd infra
./start-db.sh
```

### 8.2 `Unsupported Database: PostgreSQL 16.x`
Cozum: backend’de `flyway-database-postgresql` bagimliligi gerekir (projede mevcut).

### 8.3 STT `libcublas.so.12 not found`
Sebep: GPU lib bekleniyor.
Cozum:
- CPU ile calistir
- `faster-whisper` kurulumunu Python user venv ile yap

### 8.4 Admin logda eski triage kayitlari gorunmuyor
Cozum:
- Yeni surumde `system_logs + triage_records` merge var
- Log filtresini `Tum Islemler` yap
- Sayfayi sert yenile (`Ctrl+Shift+R`)

## 9) Kapatma / Temizlik
Uygulamalari terminalden `Ctrl+C` ile durdur.
DB kapatma:
```bash
cd infra
# docker
docker compose down
# podman-compose
podman-compose down
```
