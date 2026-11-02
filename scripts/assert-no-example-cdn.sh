#!/usr/bin/env bash
# Fail if non-fixture application code still ships example CDN media hosts.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ALLOW='mobile/src/data/mockHome\.ts|mobile/src/data/mockStory\.ts|db/seed\.json'

hits="$(rg -n 'cdn\.storiesofislam\.example|https?://[^\"'\'' ]+\.example/(audio|artwork)/' \
  -g '!node_modules' -g '!mobile/node_modules' -g '!mobile/dist' -g '!package-lock.json' \
  -g '!docs/**' -g '!*.md' -g '!*.html' -g '!*.example' \
  "$ROOT" | rg -v -e "$ALLOW" || true)"

if [[ -n "$hits" ]]; then
  printf 'Example CDN hosts found outside fixtures:\n%s\n' "$hits" >&2
  exit 1
fi
printf 'PASS no unexpected example CDN hosts in app code\n'
