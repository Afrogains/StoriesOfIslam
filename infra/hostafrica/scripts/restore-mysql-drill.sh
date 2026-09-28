#!/usr/bin/env bash
# Restore an age-encrypted MySQL dump into an isolated drill database.
set -euo pipefail

: "${BACKUP_FILE:?set BACKUP_FILE to an encrypted .sql.age dump}"
: "${BACKUP_AGE_IDENTITY:?set BACKUP_AGE_IDENTITY (age identity file)}"
: "${DB_HOST:?set DB_HOST}"
: "${DB_PORT:=3306}"
: "${DB_USER:?set DB_USER}"
: "${DB_PASSWORD:?set DB_PASSWORD}"
: "${RESTORE_DB_NAME:=stories_restore_drill}"

export MYSQL_PWD="$DB_PASSWORD"
mysql --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" \
  -e "DROP DATABASE IF EXISTS \`${RESTORE_DB_NAME}\`; CREATE DATABASE \`${RESTORE_DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

age --decrypt -i "$BACKUP_AGE_IDENTITY" -o - "$BACKUP_FILE" \
  | mysql --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" "$RESTORE_DB_NAME"

printf 'Restore drill into %s complete. Row counts:\n' "$RESTORE_DB_NAME"
mysql --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" "$RESTORE_DB_NAME" -e "
  SELECT 'categories' AS t, COUNT(*) AS n FROM categories
  UNION ALL SELECT 'figures', COUNT(*) FROM figures
  UNION ALL SELECT 'stories', COUNT(*) FROM stories
  UNION ALL SELECT 'schema_migrations', COUNT(*) FROM schema_migrations;
"
