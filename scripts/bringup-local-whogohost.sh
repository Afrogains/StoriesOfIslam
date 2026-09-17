#!/usr/bin/env bash
# Local WhoGoHost bring-up used for cloud-agent validation and developer drills.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../infra/whogohost" && pwd)"
cd "$ROOT"

cp -f .env.local.example .env
./scripts/generate-tls.sh "$ROOT/tls"

# Map local hostnames for curl/browser drills on this machine.
for host in auth.local.test media.local.test storage-admin.local.test; do
  if ! grep -q "$host" /etc/hosts; then
    echo "127.0.0.1 $host" | sudo tee -a /etc/hosts >/dev/null
  fi
done

./scripts/provision.sh host
CURL_INSECURE=1 ./scripts/validate-stack.sh

printf 'Local WhoGoHost stack is up. API can use:\n'
printf '  DATABASE_URL=postgresql://stories_app:local-only-postgres-password-32chars@127.0.0.1:5432/stories_of_islam\n'
printf '  KEYCLOAK_ISSUER=https://auth.local.test/realms/stories-of-islam\n'
printf '  S3_ENDPOINT=http://127.0.0.1:9000\n'
