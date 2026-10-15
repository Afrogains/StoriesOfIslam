#!/bin/sh
set -eu

: "${BACKUP_FILE:?set BACKUP_FILE to an encrypted PostgreSQL dump}"
: "${AGE_IDENTITY_FILE:?set AGE_IDENTITY_FILE}"
: "${RESTORE_DATABASE_URL:?set RESTORE_DATABASE_URL to an isolated drill database}"
: "${EXPECTED_PUBLIC_OBJECT:?set EXPECTED_PUBLIC_OBJECT}"
: "${MINIO_OFFSITE_ALIAS:=offsite}"

workdir="$(mktemp -d)"
trap 'rm -rf "$workdir"' EXIT

age --decrypt --identity "$AGE_IDENTITY_FILE" "$BACKUP_FILE" > "$workdir/database.dump"
pg_restore --clean --if-exists --no-owner --no-privileges \
  --dbname "$RESTORE_DATABASE_URL" "$workdir/database.dump"

psql "$RESTORE_DATABASE_URL" --set ON_ERROR_STOP=1 <<'SQL'
SELECT count(*) AS category_count FROM categories;
SELECT count(*) AS published_story_count FROM stories WHERE publication_status='published';
SELECT count(*) AS asset_count FROM media_assets;
SQL

mc stat "$MINIO_OFFSITE_ALIAS/stories-public/$EXPECTED_PUBLIC_OBJECT"
printf 'restore drill completed successfully\n'
