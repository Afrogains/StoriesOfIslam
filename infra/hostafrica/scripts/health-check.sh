#!/usr/bin/env bash
# Lightweight host health probe for systemd timer / uptime monitoring.
set -euo pipefail

AUTH_HOSTNAME="${AUTH_HOSTNAME:?set AUTH_HOSTNAME}"
MEDIA_HOSTNAME="${MEDIA_HOSTNAME:?set MEDIA_HOSTNAME}"
DISK_WARN_PCT="${DISK_WARN_PCT:-75}"
CURL_INSECURE="${CURL_INSECURE:-0}"
CURL_OPTS=(-fsS --max-time 10)
if [[ "$CURL_INSECURE" == "1" ]]; then
  CURL_OPTS+=(-k)
fi

curl "${CURL_OPTS[@]}" "https://${AUTH_HOSTNAME}/realms/stories-of-islam/.well-known/openid-configuration" >/dev/null
curl "${CURL_OPTS[@]}" "https://${MEDIA_HOSTNAME}/minio/health/live" >/dev/null

usage="$(df -P / | awk 'NR==2 {gsub(/%/,"",$5); print $5}')"
if [[ "$usage" -ge "$DISK_WARN_PCT" ]]; then
  printf 'disk usage %s%% exceeds warn threshold %s%%\n' "$usage" "$DISK_WARN_PCT" >&2
  exit 2
fi

if command -v docker >/dev/null; then
  unhealthy="$(docker ps --filter health=unhealthy --format '{{.Names}}' || true)"
  if [[ -n "$unhealthy" ]]; then
    printf 'unhealthy containers: %s\n' "$unhealthy" >&2
    exit 3
  fi
fi

printf 'health-check ok disk=%s%%\n' "$usage"
