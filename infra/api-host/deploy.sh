#!/usr/bin/env bash
# Deploy an immutable API/worker image on the dedicated API host.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

: "${API_IMAGE:?set API_IMAGE}"
: "${API_HOSTNAME:?set API_HOSTNAME}"
: "${API_ENV_FILE:=/etc/stories/api.env}"

if [[ ! -f "$API_ENV_FILE" ]]; then
  printf 'Missing %s\n' "$API_ENV_FILE" >&2
  exit 1
fi

docker compose pull
docker compose up -d --remove-orphans
docker compose ps
curl -fsS "https://${API_HOSTNAME}/health/ready" | jq .
printf 'API host deployment complete for %s\n' "$API_IMAGE"
