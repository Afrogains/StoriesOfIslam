#!/usr/bin/env bash
# Local/staging backup helper that uses the Compose PostgreSQL client tools so
# host pg_dump major versions cannot block encrypted dump creation.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/.env}"
COMPOSE_FILES=(-f "$ROOT/docker-compose.yml")
if docker compose --env-file "$ENV_FILE" -f "$ROOT/docker-compose.yml" -f "$ROOT/docker-compose.host.yml" ps -q postgres >/dev/null 2>&1; then
  COMPOSE_FILES+=(-f "$ROOT/docker-compose.host.yml")
fi

: "${BACKUP_AGE_RECIPIENT:?set BACKUP_AGE_RECIPIENT}"
: "${BACKUP_OUTPUT_DIR:?set BACKUP_OUTPUT_DIR}"
POSTGRES_USER="${POSTGRES_USER:-stories_app}"
POSTGRES_DB="${POSTGRES_DB:-stories_of_islam}"

mkdir -p "$BACKUP_OUTPUT_DIR"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
outfile="$BACKUP_OUTPUT_DIR/postgres-$timestamp.dump.age"

docker compose --env-file "$ENV_FILE" "${COMPOSE_FILES[@]}" exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner --no-privileges \
  | age --recipient "$BACKUP_AGE_RECIPIENT" > "$outfile"

printf '%s\n' "$outfile"
