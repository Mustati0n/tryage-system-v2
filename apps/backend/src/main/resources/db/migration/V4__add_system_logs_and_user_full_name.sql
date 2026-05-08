ALTER TABLE users
  ADD COLUMN IF NOT EXISTS ad_soyad VARCHAR(150);

CREATE TABLE IF NOT EXISTS system_logs (
  id BIGSERIAL PRIMARY KEY,
  action_type VARCHAR(40) NOT NULL,
  actor_username VARCHAR(100) NOT NULL,
  actor_role VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_action_type ON system_logs (action_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_actor_role ON system_logs (actor_role);
CREATE INDEX IF NOT EXISTS idx_system_logs_actor_username ON system_logs (actor_username);
