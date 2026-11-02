#!/usr/bin/env bash
# Deploy the production Expo web zip to HostAfrica over FTP/FTPS.
# Required secrets (env):
#   HOSTAFRICA_FTP_USER
#   HOSTAFRICA_FTP_PASSWORD
# Optional:
#   HOSTAFRICA_FTP_HOST   (default: storiesofislam.app)
#   HOSTAFRICA_FTP_PORT   (default: 21)
#   HOSTAFRICA_FTP_REMOTE_DIR  (default: /public_html)
#   HOSTAFRICA_FTP_SECURE  (true|false, default true → FTPS)
#   ZIP                  path to storiesofislam-web-frontend.zip
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ZIP="${ZIP:-$ROOT/deploy/storiesofislam-web-frontend.zip}"
HOST="${HOSTAFRICA_FTP_HOST:-storiesofislam.app}"
PORT="${HOSTAFRICA_FTP_PORT:-21}"
REMOTE_DIR="${HOSTAFRICA_FTP_REMOTE_DIR:-/public_html}"
SECURE="${HOSTAFRICA_FTP_SECURE:-true}"
USER="${HOSTAFRICA_FTP_USER:-}"
PASS="${HOSTAFRICA_FTP_PASSWORD:-}"

if [[ -z "$USER" || -z "$PASS" ]]; then
  echo "Set HOSTAFRICA_FTP_USER and HOSTAFRICA_FTP_PASSWORD" >&2
  exit 1
fi
if [[ ! -f "$ZIP" ]]; then
  echo "Missing $ZIP — run: bash scripts/package-web-frontend.sh" >&2
  exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
unzip -qo "$ZIP" -d "$TMP/site"

# Prefer curl with --ssl-reqd for FTPS; fall back to plain FTP when asked.
upload_tree() {
  local local_root="$1"
  (
    cd "$local_root"
    find . -type f | sed 's|^\./||' | while read -r rel; do
      remote_path="${REMOTE_DIR%/}/$rel"
      remote_dir="$(dirname "$remote_path")"
      echo "→ $remote_path"
      if [[ "$SECURE" == "true" ]]; then
        curl -sS --ftp-create-dirs --ssl-reqd --insecure \
          --user "${USER}:${PASS}" \
          --ftp-pasv \
          -T "$rel" \
          "ftp://${HOST}:${PORT}${remote_path}"
      else
        curl -sS --ftp-create-dirs \
          --user "${USER}:${PASS}" \
          --ftp-pasv \
          -T "$rel" \
          "ftp://${HOST}:${PORT}${remote_path}"
      fi
    done
  )
}

# Remove the HostAfrica parking page so our index.html wins.
remove_parking() {
  local target
  for target in index.html index.php default.html; do
    local url="ftp://${HOST}:${PORT}${REMOTE_DIR%/}/$target"
    if [[ "$SECURE" == "true" ]]; then
      curl -sS --ssl-reqd --insecure --user "${USER}:${PASS}" --ftp-pasv -Q "DELE ${REMOTE_DIR%/}/$target" "ftp://${HOST}:${PORT}/" >/dev/null 2>&1 || true
    else
      curl -sS --user "${USER}:${PASS}" --ftp-pasv -Q "DELE ${REMOTE_DIR%/}/$target" "ftp://${HOST}:${PORT}/" >/dev/null 2>&1 || true
    fi
  done
}

echo "Deploying $ZIP → ftp://${HOST}${REMOTE_DIR} (secure=$SECURE)"
remove_parking
upload_tree "$TMP/site"
echo "Done. Open https://storiesofislam.app"
