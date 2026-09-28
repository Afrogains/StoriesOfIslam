#!/usr/bin/env bash
# Application roles now live on HostAfrica MySQL.
# See infra/mysql/hostafrica-grants.sql and apply grants via HostAfrica/cPanel
# or the mysql client against the HostAfrica host.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cat <<EOF
Application database roles are managed on HostAfrica MySQL.

1. Create database afroclov_StoriesOfIslam (utf8mb4).
2. Create the API user in cPanel / MySQL.
3. Apply grants from:
   ${ROOT}/infra/mysql/hostafrica-grants.sql
4. Set DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD on the API host.
5. Run: npm run db:migrate:prod && npm run db:seed:prod

WhoGoHost PostgreSQL is for Keycloak only; this script no longer creates
PostgreSQL application roles.
EOF
