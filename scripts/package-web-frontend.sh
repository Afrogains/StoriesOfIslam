#!/usr/bin/env bash
# Build Expo web for HostAfrica public_html and zip for cPanel upload.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE="$ROOT/mobile"
OUT_DIR="$ROOT/deploy"
ZIP_NAME="storiesofislam-web-frontend.zip"

API_URL="${EXPO_PUBLIC_API_URL:-https://storiesoflislam.afroclovers.com.ng}"
ENVIRONMENT="${EXPO_PUBLIC_ENVIRONMENT:-preview}"
KEYCLOAK_ISSUER="${EXPO_PUBLIC_KEYCLOAK_ISSUER:-https://storiesoflislam.afroclovers.com.ng/auth/realms/stories-of-islam}"
KEYCLOAK_WEB_CLIENT_ID="${EXPO_PUBLIC_KEYCLOAK_WEB_CLIENT_ID:-stories-web}"

cd "$MOBILE"

# Expo 57 loads EXPO_PUBLIC_* from .env (shell-only vars are not always inlined).
cat > .env <<EOF
EXPO_PUBLIC_API_URL=${API_URL}
EXPO_PUBLIC_ENVIRONMENT=${ENVIRONMENT}
EXPO_PUBLIC_KEYCLOAK_ISSUER=${KEYCLOAK_ISSUER}
EXPO_PUBLIC_KEYCLOAK_WEB_CLIENT_ID=${KEYCLOAK_WEB_CLIENT_ID}
EOF

rm -rf dist
npx expo export --platform web --output-dir dist --clear

# Sanity: API host must appear in the bundle
if ! grep -Rql 'storiesoflislam.afroclovers.com.ng' dist/_expo/static/js/web/*.js; then
  echo "ERROR: API URL was not inlined into the web bundle" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"
rm -f "$OUT_DIR/$ZIP_NAME"
(
  cd dist
  zip -qr "$OUT_DIR/$ZIP_NAME" .
)

cp -f "$OUT_DIR/$ZIP_NAME" /opt/cursor/artifacts/"$ZIP_NAME" 2>/dev/null || true

echo "Packed $OUT_DIR/$ZIP_NAME ($(wc -c < "$OUT_DIR/$ZIP_NAME") bytes)"
echo "API: $API_URL  environment: $ENVIRONMENT"
