#!/usr/bin/env bash
# Roll back the API host to a previously known-good image digest.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

: "${API_IMAGE:?set API_IMAGE to the previous immutable digest}"
: "${API_HOSTNAME:?set API_HOSTNAME}"

docker compose up -d --remove-orphans
for _ in $(seq 1 30); do
  if curl -fsS "https://${API_HOSTNAME}/health/ready" >/dev/null; then
    printf 'Rollback healthy: %s\n' "$API_IMAGE"
    exit 0
  fi
  sleep 2
done

printf 'Rollback failed health checks for %s\n' "$API_IMAGE" >&2
exit 1
