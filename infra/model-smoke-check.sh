#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://localhost:8080}"

parse_json_field() {
  local field="$1"
  python3 -c '
import json
import sys

field = sys.argv[1]
payload = json.load(sys.stdin)
value = payload.get(field, "")
if value is None:
    value = ""
print(value)
' "$field"
}

assert_predict_shape() {
  python3 -c '
import json
import sys

payload = json.load(sys.stdin)
etiket = payload.get("etiket")
guven = payload.get("guven")
model = payload.get("modelVersiyonu")

if etiket not in {"YESIL", "SARI", "KIRMIZI"}:
    raise SystemExit(f"[fail] Gecersiz etiket: {etiket}")
if not isinstance(guven, (int, float)) or not (0.0 <= float(guven) <= 1.0):
    raise SystemExit(f"[fail] Gecersiz guven degeri: {guven}")
if not isinstance(model, str) or not model.strip():
    raise SystemExit("[fail] modelVersiyonu bos")
print("[ok] predict response shape dogrulandi")
'
}

echo "[info] API health kontrolu: ${API_BASE}/api/health"
HEALTH_RESPONSE="$(curl -sS "${API_BASE}/api/health")"
echo "$HEALTH_RESPONSE" | grep -q '"status":"UP"'
echo "[ok] health UP"

echo "[info] Personel login"
PERSONEL_LOGIN_RESPONSE="$(
  curl -sS -X POST "${API_BASE}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"kullaniciAdi":"personel","sifre":"personel123"}'
)"
PERSONEL_TOKEN="$(printf '%s' "$PERSONEL_LOGIN_RESPONSE" | parse_json_field "accessToken")"
test -n "$PERSONEL_TOKEN"
echo "[ok] personel login"

echo "[info] Admin login"
ADMIN_LOGIN_RESPONSE="$(
  curl -sS -X POST "${API_BASE}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"kullaniciAdi":"admin","sifre":"admin123"}'
)"
ADMIN_TOKEN="$(printf '%s' "$ADMIN_LOGIN_RESPONSE" | parse_json_field "accessToken")"
test -n "$ADMIN_TOKEN"
echo "[ok] admin login"

echo "[info] System model config kontrolu"
SYSTEM_MODELS_RESPONSE="$(
  curl -sS -X GET "${API_BASE}/api/system/models" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}"
)"
SELECTED_MODEL="$(printf '%s' "$SYSTEM_MODELS_RESPONSE" | parse_json_field "modelVersiyonu")"
CONFIG_NOTE="$(printf '%s' "$SYSTEM_MODELS_RESPONSE" | parse_json_field "not")"
echo "$SELECTED_MODEL" | grep -q 'tfidf_svm-v1'
echo "$CONFIG_NOTE" | grep -q 'provider=python-cli'
echo "[ok] selectedModel ve provider dogrulandi"

echo "[info] Normal predict kontrolu"
NORMAL_PREDICT="$(
  curl -sS -X POST "${API_BASE}/api/triage/predict" \
    -H "Authorization: Bearer ${PERSONEL_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"yas":32,"cinsiyet":"ERKEK","sikayetMetni":"2 gundur halsizlik ve hafif ates var"}'
)"
printf '%s' "$NORMAL_PREDICT" | assert_predict_shape

echo "[info] Guardrail red escalation kontrolu"
RED_PREDICT="$(
  curl -sS -X POST "${API_BASE}/api/triage/predict" \
    -H "Authorization: Bearer ${PERSONEL_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"yas":54,"cinsiyet":"ERKEK","sikayetMetni":"ani gogus agrisi ve nefes darligi"}'
)"
RED_ETIKET="$(printf '%s' "$RED_PREDICT" | parse_json_field "etiket")"
RED_MODEL="$(printf '%s' "$RED_PREDICT" | parse_json_field "modelVersiyonu")"
test "$RED_ETIKET" = "KIRMIZI"
echo "$RED_MODEL" | grep -q 'v1'
echo "[ok] guardrail red tahmini KIRMIZI"

echo "[done] model smoke check basarili"
