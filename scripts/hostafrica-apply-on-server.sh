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

MYSQL_BIN="mysql"
command -v mariadb >/dev/null 2>&1 && MYSQL_BIN="mariadb"

# Prefer MYSQL_PWD for special characters (& ? ! etc.). Falls back to a quoted cnf.
export MYSQL_PWD="$DB_PASSWORD"

if ! "$MYSQL_BIN" --socket="$DB_SOCKET" -u"$DB_USER" "$DB_NAME" -e 'SELECT 1 AS ok;' >/dev/null; then
  cat <<EOF >&2
MySQL/MariaDB login failed for user '${DB_USER}' on database '${DB_NAME}'.

Check in cPanel → MySQL Databases:
  1) Exact database name
  2) Exact username (often different from the DB name)
  3) Reset the user password, then export DB_PASSWORD again
  4) Confirm the user is assigned to the database with ALL PRIVILEGES

Quick test (type password when prompted — do not paste into the command line):
  ${MYSQL_BIN} --socket=${DB_SOCKET} -u${DB_USER} -p ${DB_NAME} -e 'SELECT 1'

Easiest fallback: phpMyAdmin → select the DB → Import db/hostafrica-bootstrap.sql
EOF
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  printf 'npm not found. Import db/hostafrica-bootstrap.sql via phpMyAdmin instead.\n' >&2
  exit 1
fi

npm ci
npm run db:migrate
npm run db:seed
npm run db:migrate

"$MYSQL_BIN" --socket="$DB_SOCKET" -u"$DB_USER" "$DB_NAME" -e "
  SELECT 'categories' t, COUNT(*) n FROM categories
  UNION ALL SELECT 'figures', COUNT(*) FROM figures
  UNION ALL SELECT 'stories', COUNT(*) FROM stories
  UNION ALL SELECT 'schema_migrations', COUNT(*) FROM schema_migrations;
"

printf 'HostAfrica MySQL migrate/seed complete via %s\n' "$DB_SOCKET"
