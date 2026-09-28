#!/usr/bin/env bash
# Provision or refresh the HostAfrica Docker Compose stack.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MODE="${1:-staging}"
ENV_FILE="${ENV_FILE:-$ROOT/.env}"
COMPOSE_FILES=(-f docker-compose.yml)

if [[ ! -f "$ENV_FILE" ]]; then
  cp "$ROOT/.env.example" "$ENV_FILE"
  printf 'Created %s — replace every placeholder password before continuing.\n' "$ENV_FILE"
  exit 1
fi

# shellcheck disable=SC1090
set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

: "${POSTGRES_PASSWORD:?}"
: "${KEYCLOAK_DB_PASSWORD:?}"
: "${KEYCLOAK_ADMIN_PASSWORD:?}"
: "${MINIO_ROOT_PASSWORD:?}"
: "${S3_SECRET_KEY:?}"
: "${AUTH_HOSTNAME:?}"
: "${MEDIA_HOSTNAME:?}"
: "${MINIO_CONSOLE_HOSTNAME:?}"
: "${TLS_CERT_PATH:?}"
: "${TLS_KEY_PATH:?}"

if [[ ! -f "$TLS_CERT_PATH" || ! -f "$TLS_KEY_PATH" ]]; then
  printf 'TLS files missing. Run scripts/generate-tls.sh or point TLS_*_PATH to ACME certs.\n' >&2
  exit 1
fi

if [[ "$MODE" == "local" || "$MODE" == "host" ]]; then
  COMPOSE_FILES+=(-f docker-compose.host.yml)
elif [[ "$MODE" == "bridge-local" ]]; then
  COMPOSE_FILES+=(-f docker-compose.local.yml)
fi

docker compose --env-file "$ENV_FILE" "${COMPOSE_FILES[@]}" config >/tmp/stories-compose.rendered.yml
printf 'Rendered Compose config to /tmp/stories-compose.rendered.yml\n'

docker compose --env-file "$ENV_FILE" "${COMPOSE_FILES[@]}" pull
docker compose --env-file "$ENV_FILE" "${COMPOSE_FILES[@]}" up -d --remove-orphans

printf 'Waiting for healthy services...\n'
for _ in $(seq 1 60); do
  if docker compose --env-file "$ENV_FILE" "${COMPOSE_FILES[@]}" ps --format json \
    | jq -s -e 'length > 0 and all(.[]; (.Health // "") == "healthy" or (.Health // "") == "" or .State == "exited")' >/dev/null 2>&1; then
    break
  fi
  sleep 5
done

docker compose --env-file "$ENV_FILE" "${COMPOSE_FILES[@]}" ps
printf 'Provision complete for mode=%s\n' "$MODE"
printf 'Next: apply migrations from the API host, run scripts/validate-stack.sh, install systemd timers.\n'
