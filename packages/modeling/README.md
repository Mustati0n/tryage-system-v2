# Triage Modeling Package

Bu paket backend/API koduna dokunmadan model secimi, egitimi, degerlendirmesi ve inference akislarini yonetmek icin olusturuldu.

## Hedef
- Ortak preprocessing + ortak split mantigi
- 3 modeli adil karsilastirma:
 - 4 modeli adil karsilastirma:
  1. `tfidf_logreg`
  2. `tfidf_svm`
  3. `berturk_gbdt`
  4. `lstm_text`
- Config/registry ile kolay model degisimi

## Kurulum
```bash
cd packages/modeling
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Veri Formati
CSV beklenir. Varsayilan kolonlar:
- `yas`
- `cinsiyet`
- `sikayet`
- `etiket` (YESIL / SARI / KIRMIZI)

## Egitim
```bash
python scripts/train.py \
  --data-path /path/to/data.csv \
  --model tfidf_logreg \
  --output-dir artifacts/tfidf_logreg
```

## Tum Modelleri Karsilastirma
```bash
python scripts/compare.py \
  --data-path /path/to/data.csv \
  --output-dir artifacts/compare
```

## Policy Threshold Tuning (Low-Confidence Green)
```bash
python scripts/tune_policy.py \
  --predictions-csv artifacts/compare/tfidf_svm/predictions.csv \
  --output-dir artifacts/selected/tfidf_svm \
  --max-unsafe-rate 0.05
```

## SVM Calibration Comparison
```bash
python scripts/compare_svm_calibration.py \
  --data-path /path/to/data.csv \
  --output-dir artifacts/selected/tfidf_svm \
  --class-weight balanced \
  --calibration-cv 3
```

## Extended Calibration (Sigmoid / Isotonic / Temperature Scaling)
```bash
python scripts/compare_svm_calibration_extended.py \
  --data-path /path/to/data.csv \
  --output-dir artifacts/selected/tfidf_svm \
  --class-weight balanced \
  --calibration-cv 3
```

## Kayitli Modeli Degerlendirme
```bash
python scripts/evaluate.py \
  --artifact-dir artifacts/tfidf_logreg \
  --data-path /path/to/data.csv
```

## Tek Ornek Tahmin
```bash
python scripts/predict_one.py \
  --artifact-dir artifacts/tfidf_logreg \
  --yas 47 \
  --cinsiyet ERKEK \
  --sikayet "gogus agrisi ve nefes darligi"
```

## Not
- `berturk_gbdt` modeli oncelikle LightGBM dener; yoksa XGBoost dener.
- Her ikisi de yoksa hata mesaji verir.
- Guncel secili artifact `tfidf_svm` + `isotonic` kalibrasyon ile kaydedilmistir.
