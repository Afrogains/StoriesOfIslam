#!/usr/bin/env bash
# Encrypted HostAfrica MySQL dump of the application database.
set -euo pipefail

: "${BACKUP_AGE_RECIPIENT:?set BACKUP_AGE_RECIPIENT}"
: "${BACKUP_OUTPUT_DIR:?set BACKUP_OUTPUT_DIR}"
: "${DB_HOST:?set DB_HOST}"
: "${DB_PORT:=3306}"
: "${DB_NAME:?set DB_NAME}"
: "${DB_USER:?set DB_USER}"
: "${DB_PASSWORD:?set DB_PASSWORD}"

mkdir -p "$BACKUP_OUTPUT_DIR"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
outfile="$BACKUP_OUTPUT_DIR/mysql-$DB_NAME-$timestamp.sql.age"

export MYSQL_PWD="$DB_PASSWORD"
mysqldump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --user="$DB_USER" \
  --single-transaction \
  --routines \
  --triggers \
  --hex-blob \
  --default-character-set=utf8mb4 \
  "$DB_NAME" \
  | age --recipient "$BACKUP_AGE_RECIPIENT" > "$outfile"

printf '%s\n' "$outfile"
