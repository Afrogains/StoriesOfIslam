#!/usr/bin/env bash
# Generate a signed beta build request checklist and invoke EAS when EXPO_TOKEN
# is present. Never prints secret values.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../mobile" && pwd)"
PROFILE="${1:-preview}"

cd "$ROOT"

printf 'EAS beta profile=%s\n' "$PROFILE"
if [[ ! -f eas.json ]]; then
  printf 'missing mobile/eas.json\n' >&2
  exit 1
fi

node -e 'const eas=require("./eas.json"); if(!eas.build.preview||!eas.build.production) process.exit(1); console.log("eas profiles ok")'

if [[ -z "${EXPO_TOKEN:-}" ]]; then
  cat <<'EOF'
EXPO_TOKEN is not configured in this environment.
Signed TestFlight / Play internal builds require:
  1. Expo account access and an EXPO_TOKEN secret
  2. EAS project linked for mobile/
  3. Apple/Google credentials configured in EAS
  4. GitHub environment vars for EXPO_PUBLIC_* API/Keycloak URLs
Then re-run: bash scripts/eas-beta.sh preview
Or trigger the Release workflow with native_builds=true.
EOF
  exit 0
fi

npx eas-cli@latest whoami
npx eas-cli@latest build --non-interactive --no-wait --platform all --profile "$PROFILE"
