#!/usr/bin/env bash
# Validate HostAfrica PostgreSQL (Keycloak), Keycloak, MinIO, Nginx TLS, and bucket policies.
# Application MySQL (HostAfrica) is validated by the API /health/ready check.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/.env}"
COMPOSE_FILES=(-f "$ROOT/docker-compose.yml")
if [[ -f "$ROOT/docker-compose.host.yml" ]] && docker compose --env-file "$ENV_FILE" -f "$ROOT/docker-compose.yml" -f "$ROOT/docker-compose.host.yml" ps -q postgres >/dev/null 2>&1; then
  COMPOSE_FILES+=(-f "$ROOT/docker-compose.host.yml")
fi

# shellcheck disable=SC1090
set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

AUTH_HOSTNAME="${AUTH_HOSTNAME:?}"
MEDIA_HOSTNAME="${MEDIA_HOSTNAME:?}"
POSTGRES_USER="${POSTGRES_USER:-stories_app}"
POSTGRES_DB="${POSTGRES_DB:-stories_of_islam}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:?}"
S3_ACCESS_KEY="${S3_ACCESS_KEY:?}"
S3_SECRET_KEY="${S3_SECRET_KEY:?}"
MINIO_ROOT_USER="${MINIO_ROOT_USER:?}"
MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD:?}"
MINIO_ENDPOINT="${MINIO_ENDPOINT:-http://127.0.0.1:9000}"
export MINIO_ENDPOINT MINIO_ROOT_USER MINIO_ROOT_PASSWORD S3_ACCESS_KEY S3_SECRET_KEY
CURL_INSECURE="${CURL_INSECURE:-1}"
CURL_OPTS=()
if [[ "$CURL_INSECURE" == "1" ]]; then
  CURL_OPTS+=(-k)
fi

failures=0
pass() { printf 'PASS %s\n' "$1"; }
fail() { printf 'FAIL %s: %s\n' "$1" "$2"; failures=$((failures + 1)); }

compose() {
  docker compose --env-file "$ENV_FILE" "${COMPOSE_FILES[@]}" "$@"
}

# Nginx health over HTTP
if curl -fsS "http://127.0.0.1/healthz" | grep -q ok; then
  pass 'nginx-healthz'
else
  fail 'nginx-healthz' 'HTTP /healthz did not return ok'
fi

# Keycloak OIDC discovery through TLS hostname
if curl -fsS "${CURL_OPTS[@]}" --resolve "${AUTH_HOSTNAME}:443:127.0.0.1" \
  "https://${AUTH_HOSTNAME}/realms/stories-of-islam/.well-known/openid-configuration" \
  | jq -e '.issuer and .authorization_endpoint and .jwks_uri' >/dev/null; then
  pass 'keycloak-oidc-discovery'
else
  fail 'keycloak-oidc-discovery' 'OIDC discovery document incomplete'
fi

# PostgreSQL readiness
if compose exec -T postgres pg_isready -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null \
  || compose exec -T postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null; then
  pass 'postgres-ready'
else
  fail 'postgres-ready' 'pg_isready failed'
fi

owner="$(compose exec -T postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT pg_catalog.pg_get_userbyid(datdba) FROM pg_database WHERE datname='${POSTGRES_DB}'" | tr -d '\r')"
if [[ "$owner" == "$POSTGRES_USER" ]]; then
  pass 'postgres-app-owner'
else
  fail 'postgres-app-owner' "unexpected owner ${owner}"
fi

if curl -fsS "${CURL_OPTS[@]}" "https://${MEDIA_HOSTNAME}/minio/health/live" >/dev/null \
  || curl -fsS "${CURL_OPTS[@]}" --resolve "${MEDIA_HOSTNAME}:443:127.0.0.1" \
    "https://${MEDIA_HOSTNAME}/minio/health/live" >/dev/null \
  || curl -fsS "http://127.0.0.1:9000/minio/health/live" >/dev/null; then
  pass 'minio-live'
else
  fail 'minio-live' 'MinIO health endpoint unreachable'
fi

# Prefer host MinIO when published; otherwise join the Compose network.
MC_NETWORK=host
if ! curl -fsS --max-time 2 "http://127.0.0.1:9000/minio/health/live" >/dev/null 2>&1; then
  MINIO_ENDPOINT="http://minio:9000"
  export MINIO_ENDPOINT
  MC_NETWORK="$(compose ps -q minio | xargs -I{} docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{println $k}}{{end}}' {} | head -n1)"
  if [[ -z "$MC_NETWORK" ]]; then
    fail 'minio-network' 'unable to resolve MinIO docker network'
  fi
fi

run_mc() {
  docker run --rm --network "$MC_NETWORK" --entrypoint /bin/sh \
    -e MINIO_ROOT_USER -e MINIO_ROOT_PASSWORD -e MINIO_ENDPOINT \
    quay.io/minio/mc:RELEASE.2025-07-21T05-28-08Z \
    -c "$1"
}

run_mc '
  set -eu
  mc alias set local "$MINIO_ENDPOINT" "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"
  pub="$(mc anonymous get local/stories-public)"
  priv="$(mc anonymous get local/stories-private)"
  case "$pub" in *download*|*Download*) ;; *) echo "bad public: $pub"; exit 1 ;; esac
  case "$priv" in *none*|*None*|*private*|*Private*|*AccessDenied*) ;; *) echo "bad private: $priv"; exit 1 ;; esac
  printf "public=%s private=%s\n" "$pub" "$priv"
' && pass 'minio-anonymous-policies' || fail 'minio-anonymous-policies' 'public/private bucket policies incorrect'

object_key="validation/private-$(date -u +%s).txt"
run_mc "
  set -eu
  mc alias set local \"\$MINIO_ENDPOINT\" \"\$MINIO_ROOT_USER\" \"\$MINIO_ROOT_PASSWORD\"
  printf 'draft-secret\n' | mc pipe local/stories-private/${object_key}
"
if curl -fsS "${CURL_OPTS[@]}" "https://${MEDIA_HOSTNAME}/stories-private/${object_key}" >/dev/null 2>&1 \
  || curl -fsS "${CURL_OPTS[@]}" --resolve "${MEDIA_HOSTNAME}:443:127.0.0.1" \
    "https://${MEDIA_HOSTNAME}/stories-private/${object_key}" >/dev/null 2>&1 \
  || curl -fsS "http://127.0.0.1:9000/stories-private/${object_key}" >/dev/null 2>&1; then
  fail 'minio-draft-isolation' 'private object was anonymously readable'
else
  pass 'minio-draft-isolation'
fi

if [[ "$failures" -gt 0 ]]; then
  printf '%s validation check(s) failed\n' "$failures" >&2
  exit 1
fi
printf 'All HostAfrica stack validation checks passed\n'
