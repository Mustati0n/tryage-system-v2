#!/usr/bin/env bash
set -euo pipefail

# Installs a user-level systemd service+timer for daily DB backup.
# Works even when crontab is blocked by PAM policy.

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_SCRIPT="${PROJECT_ROOT}/infra/db-backup.sh"
USER_SYSTEMD_DIR="${HOME}/.config/systemd/user"
SERVICE_FILE="${USER_SYSTEMD_DIR}/akilli-triage-db-backup.service"
TIMER_FILE="${USER_SYSTEMD_DIR}/akilli-triage-db-backup.timer"

mkdir -p "${USER_SYSTEMD_DIR}"
chmod +x "${BACKUP_SCRIPT}"

cat > "${SERVICE_FILE}" <<EOF
[Unit]
Description=Akilli Triage PostgreSQL backup

[Service]
Type=oneshot
ExecStart=${BACKUP_SCRIPT}
EOF

cat > "${TIMER_FILE}" <<EOF
[Unit]
Description=Run Akilli Triage DB backup daily

[Timer]
OnCalendar=*-*-* 02:30:00
Persistent=true
Unit=akilli-triage-db-backup.service

[Install]
WantedBy=timers.target
EOF

systemctl --user daemon-reload
systemctl --user enable --now akilli-triage-db-backup.timer

echo "[ok] User systemd backup timer enabled."
echo "[info] Check status:"
echo "  systemctl --user status akilli-triage-db-backup.timer"
echo "  systemctl --user list-timers | rg akilli-triage-db-backup"

