#!/usr/bin/env bash
set -euo pipefail

# Restore helper:
#   ./infra/db-restore.sh /abs/path/to/triage_YYYY-MM-DD_HH-MM-SS.sql.gz

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <backup-file.sql|backup-file.sql.gz>"
  exit 1
fi

INPUT_FILE="$1"
if [[ ! -f "${INPUT_FILE}" ]]; then
  echo "[error] File not found: ${INPUT_FILE}"
  exit 1
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-triage_db}"
DB_USER="${DB_USER:-triage}"
DB_PASSWORD="${DB_PASSWORD:-triage}"

export PGPASSWORD="${DB_PASSWORD}"

echo "[warn] This will overwrite existing objects in ${DB_NAME}."
echo "[info] Restoring from: ${INPUT_FILE}"

if [[ "${INPUT_FILE}" == *.gz ]]; then
  gunzip -c "${INPUT_FILE}" | psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}"
else
  psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -f "${INPUT_FILE}"
fi

echo "[ok] Restore completed."

