#!/usr/bin/env bash
# Run in cPanel Terminal (or SSH) on the HostAfrica account that owns afroclovers.com.ng.
# Extracts deploy/storiesofislam-web-frontend.zip into public_html.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ZIP="${1:-$ROOT/deploy/storiesofislam-web-frontend.zip}"
PUBLIC_HTML="${PUBLIC_HTML:-$HOME/public_html}"

if [[ ! -f "$ZIP" ]]; then
  echo "Missing zip: $ZIP" >&2
  echo "On the server: git pull, then re-run this script." >&2
  exit 1
fi

if [[ ! -d "$PUBLIC_HTML" ]]; then
  echo "public_html not found at $PUBLIC_HTML" >&2
  exit 1
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="$HOME/public_html-backup-$STAMP"
mkdir -p "$BACKUP"
for f in index.html index.php default.html; do
  if [[ -f "$PUBLIC_HTML/$f" ]]; then
    cp -a "$PUBLIC_HTML/$f" "$BACKUP/"
  fi
done

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
unzip -qo "$ZIP" -d "$TMP"

# Clear previous SPA assets that would otherwise linger
rm -rf "$PUBLIC_HTML/_expo" "$PUBLIC_HTML/assets"
# Avoid leaving the HostAfrica parking page in place
rm -f "$PUBLIC_HTML/index.html" "$PUBLIC_HTML/index.php"

cp -a "$TMP"/. "$PUBLIC_HTML"/

if [[ ! -f "$PUBLIC_HTML/index.html" ]]; then
  echo "ERROR: index.html missing after extract" >&2
  exit 1
fi
if [[ ! -f "$PUBLIC_HTML/.htaccess" ]]; then
  echo "WARN: .htaccess missing — SPA deep links may 404" >&2
fi

echo "Deployed frontend to $PUBLIC_HTML"
echo "Previous index backed up under $BACKUP (if any)"
echo "Open https://afroclovers.com.ng"
