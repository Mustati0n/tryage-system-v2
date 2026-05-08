CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  kullanici_adi VARCHAR(100) NOT NULL UNIQUE,
  sifre_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(20) NOT NULL,
  aktif_mi BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS patients (
  id BIGSERIAL PRIMARY KEY,
  ad VARCHAR(100) NOT NULL,
  soyad VARCHAR(100) NOT NULL,
  tc_kimlik_no VARCHAR(11) NOT NULL UNIQUE,
  dogum_tarihi DATE NOT NULL,
  cinsiyet VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS triage_records (
  id BIGSERIAL PRIMARY KEY,
  hasta_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  yas INT NOT NULL,
  cinsiyet VARCHAR(20) NOT NULL,
  sikayet_metni TEXT NOT NULL,
  etiket VARCHAR(20) NOT NULL,
  guven DOUBLE PRECISION NOT NULL,
  model_versiyonu VARCHAR(100) NOT NULL,
  ses_dosya_yolu TEXT NULL,
  durum VARCHAR(30) NOT NULL,
  override_etiket VARCHAR(20) NULL,
  override_nedeni TEXT NULL,
  basvuru_zamani TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dataset_items (
  id BIGSERIAL PRIMARY KEY,
  triage_kayit_id BIGINT NOT NULL UNIQUE REFERENCES triage_records(id) ON DELETE CASCADE,
  gercek_etiket VARCHAR(20) NOT NULL,
  note TEXT NULL,
  kaynak VARCHAR(30) NOT NULL,
  eklenme_zamani TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_triage_records_basvuru_zamani ON triage_records (basvuru_zamani DESC);
CREATE INDEX IF NOT EXISTS idx_triage_records_etiket_guven ON triage_records (etiket, guven);
CREATE INDEX IF NOT EXISTS idx_triage_records_override_etiket ON triage_records (override_etiket);

INSERT INTO users (kullanici_adi, sifre_hash, rol, aktif_mi)
VALUES
  ('admin', 'admin123', 'ADMIN', TRUE),
  ('personel', 'personel123', 'PERSONEL', TRUE)
ON CONFLICT (kullanici_adi) DO NOTHING;
