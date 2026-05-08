ALTER TABLE triage_records
ADD COLUMN IF NOT EXISTS created_by_kullanici_adi VARCHAR(100) NOT NULL DEFAULT 'system';

CREATE INDEX IF NOT EXISTS idx_triage_records_created_by
  ON triage_records (created_by_kullanici_adi, basvuru_zamani DESC);
