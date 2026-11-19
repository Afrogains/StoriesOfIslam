#!/usr/bin/env bash
# HostAfrica go-live orchestrator.
# Usage:
#   ./scripts/go-live.sh preflight [/path/to/api.env]
#   ./scripts/go-live.sh migrate
#   ./scripts/go-live.sh seed
#   ./scripts/go-live.sh accept   # requires API_BASE_URL, KEYCLOAK_ISSUER, MEDIA_BASE_URL
#   ./scripts/go-live.sh local-db # local MySQL migrate+seed+verify (dev/agent)
#   ./scripts/go-live.sh all-local
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
cmd="${1:-}"

case "$cmd" in
  preflight)
    bash "$ROOT/scripts/go-live-preflight.sh" "${2:-.env}"
    ;;
  migrate)
    npm run db:migrate:prod 2>/dev/null || npm run db:migrate
    ;;
  seed)
    npm run db:seed:prod 2>/dev/null || npm run db:seed
    ;;
  accept)
    bash "$ROOT/scripts/staging-acceptance.sh"
    bash "$ROOT/scripts/beta-matrix.sh"
    ;;
  local-db)
    : "${DB_HOST:=127.0.0.1}"
    : "${DB_PORT:=3306}"
    : "${DB_NAME:=afroclov_StoriesOfIslam}"
    : "${DB_USER:=stories_app}"
    : "${DB_PASSWORD:=test-only-password}"
    : "${DATABASE_SSL:=false}"
    export DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD DATABASE_SSL
    npm run db:migrate
    npm run db:seed
    npm run db:migrate
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
      SELECT 'categories' t, COUNT(*) n FROM categories
      UNION ALL SELECT 'figures', COUNT(*) FROM figures
      UNION ALL SELECT 'stories', COUNT(*) FROM stories;
    "
    printf 'Local HostAfrica MySQL migrate/seed verified\n'
    ;;
  all-local)
    bash "$ROOT/scripts/go-live.sh" local-db
    npm run typecheck
    npm test
    npm run build
    printf 'Local go-live gates passed. Remaining: live HostAfrica secrets, VPS, store accounts.\n'
    ;;
  *)
    cat <<'EOF'
HostAfrica go-live orchestrator

  preflight [envfile]  Validate secrets are not placeholders
  migrate              Apply MySQL migrations
  seed                 Seed catalog
  accept               Staging HTTP + beta matrix probes
  local-db             Local MySQL migrate/seed/verify
  all-local            local-db + typecheck/tests/build

After secrets exist:
  1) ./scripts/go-live.sh preflight /etc/stories/api.env
  2) ./scripts/go-live.sh migrate && ./scripts/go-live.sh seed
  3) Deploy infra/hostafrica + infra/api-host
  4) API_BASE_URL=... KEYCLOAK_ISSUER=... MEDIA_BASE_URL=... WEB_BASE_URL=... ./scripts/go-live.sh accept
EOF
    exit 1
    ;;
esac
