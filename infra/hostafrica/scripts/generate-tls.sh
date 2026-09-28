#!/usr/bin/env bash
# Generate a self-signed TLS certificate for local/staging bring-up drills.
# Production must replace these with ACME-issued certificates.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${1:-$ROOT/tls}"
DAYS="${TLS_DAYS:-825}"
AUTH_HOSTNAME="${AUTH_HOSTNAME:-auth.local.test}"
MEDIA_HOSTNAME="${MEDIA_HOSTNAME:-media.local.test}"
MINIO_CONSOLE_HOSTNAME="${MINIO_CONSOLE_HOSTNAME:-storage-admin.local.test}"

mkdir -p "$OUT_DIR"
openssl req -x509 -newkey rsa:4096 -sha256 -days "$DAYS" -nodes \
  -keyout "$OUT_DIR/privkey.pem" \
  -out "$OUT_DIR/fullchain.pem" \
  -subj "/CN=${AUTH_HOSTNAME}/O=Stories of Islam Platform/C=US" \
  -addext "subjectAltName=DNS:${AUTH_HOSTNAME},DNS:${MEDIA_HOSTNAME},DNS:${MINIO_CONSOLE_HOSTNAME},DNS:localhost,IP:127.0.0.1"

chmod 600 "$OUT_DIR/privkey.pem"
chmod 644 "$OUT_DIR/fullchain.pem"
printf 'Wrote %s and %s\n' "$OUT_DIR/fullchain.pem" "$OUT_DIR/privkey.pem"
