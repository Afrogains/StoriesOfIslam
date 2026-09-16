#!/usr/bin/env bash
# Create/rotate least-privilege API and worker database roles.
set -euo pipefail

: "${DATABASE_URL:?set DATABASE_URL}"
: "${STORIES_RUNTIME_PASSWORD:?set STORIES_RUNTIME_PASSWORD}"
: "${STORIES_WORKER_PASSWORD:?set STORIES_WORKER_PASSWORD}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

psql "$DATABASE_URL" --set ON_ERROR_STOP=1 \
  --set=runtime_password="$STORIES_RUNTIME_PASSWORD" \
  --set=worker_password="$STORIES_WORKER_PASSWORD" <<'SQL'
SELECT format('CREATE ROLE stories_runtime LOGIN PASSWORD %L', :'runtime_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'stories_runtime')\gexec
SELECT format('ALTER ROLE stories_runtime LOGIN PASSWORD %L', :'runtime_password')
WHERE EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'stories_runtime')\gexec
SELECT format('CREATE ROLE stories_worker LOGIN PASSWORD %L', :'worker_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'stories_worker')\gexec
SELECT format('ALTER ROLE stories_worker LOGIN PASSWORD %L', :'worker_password')
WHERE EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'stories_worker')\gexec
SQL

psql "$DATABASE_URL" --set ON_ERROR_STOP=1 -f "$ROOT/sql/runtime-roles.sql"
printf 'Applied stories_runtime and stories_worker roles\n'
