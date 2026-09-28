#!/usr/bin/env bash
# Run THIS on the HostAfrica server (SSH or cPanel Terminal), not from a laptop/agent.
# Uses the cPanel UNIX socket. Never commit real passwords.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

: "${DB_NAME:=afroclov_StoriesOfIslam}"
: "${DB_USER:=afroclov_StoriesOfIslam}"
: "${DB_PASSWORD:?set DB_PASSWORD}"
: "${DB_SOCKET:=/var/lib/mysql/mysql.sock}"
: "${DB_HOST:=localhost}"
: "${DATABASE_SSL:=false}"

export DB_NAME DB_USER DB_PASSWORD DB_SOCKET DB_HOST DATABASE_SSL

if [[ ! -S "$DB_SOCKET" ]]; then
  printf 'Socket %s not found — run this on the HostAfrica host\n' "$DB_SOCKET" >&2
  exit 1
fi

# Quick auth check via socket
mysql --socket="$DB_SOCKET" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e 'SELECT 1 AS ok;' >/dev/null

npm ci
npm run db:migrate
npm run db:seed
npm run db:migrate

mysql --socket="$DB_SOCKET" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
  SELECT 'categories' t, COUNT(*) n FROM categories
  UNION ALL SELECT 'figures', COUNT(*) FROM figures
  UNION ALL SELECT 'stories', COUNT(*) FROM stories
  UNION ALL SELECT 'schema_migrations', COUNT(*) FROM schema_migrations;
"

printf 'HostAfrica MySQL migrate/seed complete via %s\n' "$DB_SOCKET"
