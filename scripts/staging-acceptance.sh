#!/usr/bin/env bash
# End-to-end staging acceptance probes against deployed services.
set -euo pipefail

: "${API_BASE_URL:?set API_BASE_URL}"
: "${KEYCLOAK_ISSUER:?set KEYCLOAK_ISSUER}"
: "${MEDIA_BASE_URL:?set MEDIA_BASE_URL}"
: "${METRICS_TOKEN:=}"

CURL_INSECURE="${CURL_INSECURE:-0}"
CURL_OPTS=(-fsS --max-time 20)
if [[ "$CURL_INSECURE" == "1" ]]; then
  CURL_OPTS+=(-k)
fi

failures=0
check() {
  local name="$1"
  shift
  if "$@"; then
    printf 'PASS %s\n' "$name"
  else
    printf 'FAIL %s\n' "$name"
    failures=$((failures + 1))
  fi
}

check api-live curl "${CURL_OPTS[@]}" "$API_BASE_URL/health/live" >/dev/null
check api-ready curl "${CURL_OPTS[@]}" "$API_BASE_URL/health/ready" | jq -e '.status=="ready"' >/dev/null
check oidc curl "${CURL_OPTS[@]}" "$KEYCLOAK_ISSUER/.well-known/openid-configuration" \
  | jq -e '.authorization_endpoint and .token_endpoint and .jwks_uri' >/dev/null
check catalog curl "${CURL_OPTS[@]}" "$API_BASE_URL/v1/categories" | jq -e 'type=="array" or .categories or .data' >/dev/null
check figures curl "${CURL_OPTS[@]}" "$API_BASE_URL/v1/figures?category=qisas-al-anbiya" \
  | jq -e '(type=="array" and length>=1) or (.data|type=="array")' >/dev/null
check stories curl "${CURL_OPTS[@]}" "$API_BASE_URL/v1/stories?pageSize=5" \
  | jq -e '(.data|type=="array") or type=="array"' >/dev/null
if curl "${CURL_OPTS[@]}" "$MEDIA_BASE_URL/minio/health/live" >/dev/null 2>&1 \
  || curl "${CURL_OPTS[@]}" "$MEDIA_BASE_URL/" >/dev/null 2>&1; then
  printf 'PASS media-live\n'
else
  printf 'FAIL media-live\n'
  failures=$((failures + 1))
fi

if [[ -n "$METRICS_TOKEN" ]]; then
  check metrics curl "${CURL_OPTS[@]}" -H "Authorization: Bearer $METRICS_TOKEN" \
    "$API_BASE_URL/metrics" | grep -q stories_process_uptime_seconds
fi

# Draft isolation: unauthenticated requests must not expose draft endpoints.
status="$(curl "${CURL_OPTS[@]}" -o /dev/null -w '%{http_code}' \
  "$API_BASE_URL/v1/editor/stories/00000000-0000-0000-0000-000000000000/publish" || true)"
if [[ "$status" == "401" || "$status" == "403" || "$status" == "404" ]]; then
  printf 'PASS draft-admin-denied (%s)\n' "$status"
else
  printf 'FAIL draft-admin-denied (status %s)\n' "$status"
  failures=$((failures + 1))
fi

# Favorites require auth
fav_status="$(curl "${CURL_OPTS[@]}" -o /dev/null -w '%{http_code}' \
  "$API_BASE_URL/v1/me/favorites" || true)"
if [[ "$fav_status" == "401" || "$fav_status" == "403" ]]; then
  printf 'PASS favorites-auth-required (%s)\n' "$fav_status"
else
  printf 'FAIL favorites-auth-required (status %s)\n' "$fav_status"
  failures=$((failures + 1))
fi

if [[ "$failures" -gt 0 ]]; then
  printf '%s staging acceptance checks failed\n' "$failures" >&2
  exit 1
fi
printf 'Staging acceptance probes passed\n'
