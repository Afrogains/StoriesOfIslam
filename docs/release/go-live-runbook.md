# HostAfrica go-live runbook

Single path from this branch to production. Automation lives in `scripts/go-live.sh`.

## What this agent already completed

- Application DB converted to HostAfrica MySQL (`mysql2`, migrations, seed)
- Platform folder renamed to `infra/hostafrica/`
- CI green (code, MySQL migrate/seed, compose config, container, secrets scan)
- Local MySQL migrate/seed verified (4/43/33)
- Local Keycloak + Nginx TLS + API `/health/ready` green against HostAfrica-shaped MySQL
- Go-live preflight, MySQL backup/restore drill scripts, staging probes
- Seeded stories intentionally remain **draft** until scholarly publication

## Secrets you must provide (blocking)

Fill `/etc/stories/api.env` from `infra/api-host/.env.example`:

| Variable | Where |
| --- | --- |
| `DB_*` | HostAfrica cPanel MySQL `afroclov_StoriesOfIslam` |
| `KEYCLOAK_*` | HostAfrica VPS Keycloak |
| `S3_*` | HostAfrica MinIO |
| `OPENAI_API_KEY` / `ELEVENLABS_*` | Provider dashboards |
| `METRICS_TOKEN` | Generate ≥16 random chars |
| `EXPO_TOKEN` + Apple/Google | For store betas |

Also set real DNS hostnames (replace every `*.example.com`).

## Operator steps

HostAfrica shared MySQL is `localhost` + UNIX socket `/var/lib/mysql/mysql.sock`.
Apply schema/seed **on that server** (see `docs/operations/hostafrica-mysql-import.md`).

```bash
# On HostAfrica (SSH / cPanel Terminal) — not from a laptop/agent:
export DB_NAME=afroclov_StoriesOfIslam
export DB_USER=afroclov_StoriesOfIslam
export DB_PASSWORD='...'   # never commit
export DB_SOCKET=/var/lib/mysql/mysql.sock
export DB_HOST=localhost
bash scripts/hostafrica-apply-on-server.sh
# Or import hostafrica-bootstrap.sql via phpMyAdmin
```

```bash
# 1) Validate API env (fails on placeholders)
./scripts/go-live.sh preflight /etc/stories/api.env

# 2) Platform (Keycloak/MinIO/Nginx) if using the Compose stack
cd infra/hostafrica
cp .env.example .env   # fill secrets + hostnames
./scripts/harden-host.sh
./scripts/provision.sh
./scripts/install-systemd.sh
./scripts/validate-stack.sh

# 3) API + worker (same HostAfrica host can use DB_SOCKET)
cd infra/api-host
API_IMAGE=ghcr.io/<org>/stories-api:<sha> API_HOSTNAME=api.your.domain ./deploy.sh

# 4) Acceptance
API_BASE_URL=https://api.your.domain \
KEYCLOAK_ISSUER=https://auth.your.domain/realms/stories-of-islam \
MEDIA_BASE_URL=https://media.your.domain \
WEB_BASE_URL=https://app.your.domain \
METRICS_TOKEN=... \
./scripts/go-live.sh accept

# 5) Encrypted MySQL backup drill (on HostAfrica)
BACKUP_AGE_RECIPIENT=age1... BACKUP_OUTPUT_DIR=/var/backups/stories \
  ./infra/hostafrica/scripts/backup-mysql-age.sh
```

## Content / stores (human)

1. Publish only reviewed stories (citations + reviewer + real audio).
2. Host Privacy/Terms/Support/Account Deletion over HTTPS.
3. EAS beta (`scripts/eas-beta.sh`) once `EXPO_TOKEN` exists.
4. Complete `docs/release/launch-checklist.md` and attach evidence.

## Production cutover

Separate prod MySQL DB, Keycloak realm, buckets, and secrets from staging.
Re-run migrate → seed → deploy → accept → product-owner sign-off.
