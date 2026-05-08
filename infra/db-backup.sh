#!/usr/bin/env bash
set -euo pipefail

# Simple PostgreSQL backup helper for local/demo environments.
# Uses env vars when provided, falls back to project defaults.

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-triage_db}"
DB_USER="${DB_USER:-triage}"
DB_PASSWORD="${DB_PASSWORD:-triage}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/db-backups/akilli-triage}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

mkdir -p "${BACKUP_DIR}"

ts="$(date +%F_%H-%M-%S)"
backup_file="${BACKUP_DIR}/triage_${ts}.sql"

export PGPASSWORD="${DB_PASSWORD}"

echo "[info] Backup starting: ${backup_file}"
pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --clean \
  --if-exists \
  > "${backup_file}"

gzip -f "${backup_file}"
echo "[ok] Backup created: ${backup_file}.gz"

# Retention cleanup
find "${BACKUP_DIR}" -type f -name "triage_*.sql.gz" -mtime +"${RETENTION_DAYS}" -delete
echo "[ok] Retention cleanup done (>${RETENTION_DAYS} days deleted)"

