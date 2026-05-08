#!/usr/bin/env bash
set -euo pipefail

# Installs/updates a daily backup cron entry for current user.
# Default schedule: every day 02:30.

SCHEDULE="${1:-30 2 * * *}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT_PATH="${PROJECT_ROOT}/infra/db-backup.sh"
CRON_TAG="# AKILLI_TRIAGE_DB_BACKUP"

if [[ ! -x "${SCRIPT_PATH}" ]]; then
  chmod +x "${SCRIPT_PATH}"
fi

current_cron="$(mktemp)"
new_cron="$(mktemp)"
trap 'rm -f "${current_cron}" "${new_cron}"' EXIT

crontab -l 2>/dev/null | grep -v "${CRON_TAG}" > "${current_cron}" || true

{
  cat "${current_cron}"
  echo "${SCHEDULE} ${SCRIPT_PATH} >> \$HOME/db-backups/akilli-triage/backup.log 2>&1 ${CRON_TAG}"
} > "${new_cron}"

crontab "${new_cron}"
echo "[ok] Cron backup installed/updated:"
echo "     ${SCHEDULE} ${SCRIPT_PATH}"

