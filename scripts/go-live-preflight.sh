#!/usr/bin/env bash
# Fail closed if required go-live secrets/hostnames are still placeholders.
set -euo pipefail

ENV_FILE="${1:-.env}"
if [[ ! -f "$ENV_FILE" ]]; then
  printf 'Missing %s — copy .env.example and fill HostAfrica values\n' "$ENV_FILE" >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

failures=0
require() {
  local name="$1"
  local value="${!name:-}"
  if [[ -z "$value" ]]; then
    printf 'FAIL %s is empty\n' "$name"
    failures=$((failures + 1))
    return
  fi
  if [[ "$value" == *change-me* || "$value" == *example.com* || "$value" == *example* && "$name" == *PASSWORD* ]]; then
    printf 'FAIL %s still looks like a placeholder\n' "$name"
    failures=$((failures + 1))
    return
  fi
  printf 'PASS %s\n' "$name"
}

require DB_HOST
require DB_NAME
require DB_USER
require DB_PASSWORD
require KEYCLOAK_ISSUER
require S3_ENDPOINT
require S3_ACCESS_KEY
require S3_SECRET_KEY
require S3_PUBLIC_BASE_URL
require METRICS_TOKEN

if [[ "${KEYCLOAK_ISSUER}" != https://* ]]; then
  printf 'FAIL KEYCLOAK_ISSUER must be https in production/staging\n'
  failures=$((failures + 1))
else
  printf 'PASS KEYCLOAK_ISSUER uses https\n'
fi

if [[ "${NODE_ENV:-}" == "production" ]]; then
  require OPENAI_API_KEY
  require ELEVENLABS_API_KEY
fi

if [[ "$failures" -gt 0 ]]; then
  printf '%s preflight checks failed\n' "$failures" >&2
  exit 1
fi
printf 'Go-live preflight passed for %s\n' "$ENV_FILE"
