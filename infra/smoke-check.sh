#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://localhost:8080}"

echo "[info] API health kontrolu: ${API_BASE}/api/health"
HEALTH_RESPONSE="$(curl -sS "${API_BASE}/api/health")"
echo "$HEALTH_RESPONSE" | grep -q '"status":"UP"'
echo "[ok] health UP"

echo "[info] Admin login kontrolu"
ADMIN_LOGIN_RESPONSE="$(
  curl -sS -X POST "${API_BASE}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"kullaniciAdi":"admin","sifre":"admin123"}'
)"
echo "$ADMIN_LOGIN_RESPONSE" | grep -q '"accessToken":"'
echo "[ok] admin login"

echo "[info] Personel login kontrolu"
PERSONEL_LOGIN_RESPONSE="$(
  curl -sS -X POST "${API_BASE}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"kullaniciAdi":"personel","sifre":"personel123"}'
)"
echo "$PERSONEL_LOGIN_RESPONSE" | grep -q '"accessToken":"'
echo "[ok] personel login"

echo "[done] smoke check basarili"
