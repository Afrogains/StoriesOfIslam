#!/bin/sh
set -eu

: "${DATABASE_URL:?set DATABASE_URL}"
: "${BACKUP_AGE_RECIPIENT:?set BACKUP_AGE_RECIPIENT}"
: "${RCLONE_REMOTE:?set RCLONE_REMOTE, for example b2:stories-backups}"
: "${MINIO_ALIAS:=production}"
: "${MINIO_OFFSITE_ALIAS:=offsite}"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
workdir="$(mktemp -d)"
trap 'rm -rf "$workdir"' EXIT

pg_dump --format=custom --no-owner --no-privileges "$DATABASE_URL" \
  | age --recipient "$BACKUP_AGE_RECIPIENT" > "$workdir/postgres-$timestamp.dump.age"

rclone copy "$workdir/postgres-$timestamp.dump.age" \
  "$RCLONE_REMOTE/postgres/" --immutable

# The offsite target must use a different provider/account from the VPS.
mc mirror --overwrite --remove "$MINIO_ALIAS/stories-public" \
  "$MINIO_OFFSITE_ALIAS/stories-public"
mc mirror --overwrite --remove "$MINIO_ALIAS/stories-private" \
  "$MINIO_OFFSITE_ALIAS/stories-private"

rclone delete "$RCLONE_REMOTE/postgres/" --min-age 35d
printf 'backup completed %s\n' "$timestamp"
