#!/usr/bin/env bash
# Deploy production SPA to the standalone storiesofislam.app HostAfrica docroot.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
: "${HOSTAFRICA_FTP_USER:?Set HOSTAFRICA_FTP_USER}"
: "${HOSTAFRICA_FTP_PASSWORD:?Set HOSTAFRICA_FTP_PASSWORD}"
export HOSTAFRICA_FTP_HOST="${HOSTAFRICA_FTP_HOST:-storiesofislam.app}"
# Shared account IP fallback when DNS has not propagated yet
if ! dig +short "$HOSTAFRICA_FTP_HOST" A | grep -q .; then
  export HOSTAFRICA_FTP_HOST="${HOSTAFRICA_FTP_IP:-102.68.98.148}"
  echo "DNS not ready — FTPing via IP $HOSTAFRICA_FTP_HOST (HostAfrica shared IP)"
fi
export HOSTAFRICA_FTP_REMOTE_DIR="${HOSTAFRICA_FTP_REMOTE_DIR:-/public_html}"
export HOSTAFRICA_FTP_SECURE="${HOSTAFRICA_FTP_SECURE:-false}"
bash "$ROOT/scripts/package-web-frontend.sh"
bash "$ROOT/scripts/hostafrica-ftp-deploy-frontend.sh"
echo "Verify: curl -sI https://storiesofislam.app | head"
