#!/usr/bin/env bash
# Local HostAfrica bring-up used for cloud-agent validation and developer drills.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../infra/hostafrica" && pwd)"
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

printf 'Local HostAfrica stack is up (Keycloak/MinIO/Nginx; Postgres is for Keycloak only).\n'
printf 'Start local MySQL for the app (or point DB_* at HostAfrica):\n'
printf '  docker compose -f infra/hostafrica/mysql/docker-compose.yml up -d\n'
printf 'API MySQL env:\n'
printf '  DB_HOST=127.0.0.1\n'
printf '  DB_PORT=3306\n'
printf '  DB_NAME=afroclov_StoriesOfIslam\n'
printf '  DB_USER=stories_app\n'
printf '  DB_PASSWORD=local-only-mysql-password-32chars\n'
printf '  KEYCLOAK_ISSUER=https://auth.local.test/realms/stories-of-islam\n'
printf '  S3_ENDPOINT=http://127.0.0.1:9000\n'
