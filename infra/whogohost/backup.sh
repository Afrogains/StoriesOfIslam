#!/bin/sh
# Encrypted PostgreSQL dump + MinIO offsite mirror.
# Prefer dumping through the Compose postgres container so the database can
# remain on the internal Docker network without a host-published port.
set -eu

: "${BACKUP_AGE_RECIPIENT:?set BACKUP_AGE_RECIPIENT}"
: "${RCLONE_REMOTE:?set RCLONE_REMOTE, for example b2:stories-backups}"
: "${MINIO_ALIAS:=production}"
: "${MINIO_OFFSITE_ALIAS:=offsite}"
: "${COMPOSE_PROJECT_DIR:=/opt/stories/whogohost}"
: "${POSTGRES_SERVICE:=postgres}"
: "${POSTGRES_USER:=stories_app}"
: "${POSTGRES_DB:=stories_of_islam}"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
workdir="$(mktemp -d)"
trap 'rm -rf "$workdir"' EXIT

if [ -n "${DATABASE_URL:-}" ] && command -v pg_dump >/dev/null 2>&1; then
  # Optional host-reachable DATABASE_URL path for dedicated backup runners.
  pg_dump --format=custom --no-owner --no-privileges "$DATABASE_URL" \
    | age --recipient "$BACKUP_AGE_RECIPIENT" > "$workdir/postgres-$timestamp.dump.age"
else
  docker compose --project-directory "$COMPOSE_PROJECT_DIR" exec -T "$POSTGRES_SERVICE" \
    pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner --no-privileges \
    | age --recipient "$BACKUP_AGE_RECIPIENT" > "$workdir/postgres-$timestamp.dump.age"
fi

rclone copy "$workdir/postgres-$timestamp.dump.age" \
  "$RCLONE_REMOTE/postgres/" --immutable

# The offsite target must use a different provider/account from the VPS.
mc mirror --overwrite --remove "$MINIO_ALIAS/stories-public" \
  "$MINIO_OFFSITE_ALIAS/stories-public"
mc mirror --overwrite --remove "$MINIO_ALIAS/stories-private" \
  "$MINIO_OFFSITE_ALIAS/stories-private"

rclone delete "$RCLONE_REMOTE/postgres/" --min-age 35d
printf 'backup completed %s\n' "$timestamp"
