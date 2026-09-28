# Production readiness status (cloud agent)

## WhoGoHost

Validated locally with `docker-compose.yml` + `docker-compose.host.yml`:

- HostAfrica-compatible MySQL schema via `migrations/` (`afroclov_StoriesOfIslam`)
- WhoGoHost PostgreSQL retained for Keycloak only
- Keycloak 26 imports `stories-of-islam` realm; HTTPS issuer advertised behind
  Nginx TLS (`https://auth.local.test/realms/stories-of-islam`)
- MinIO public download / private isolation policies verified
- Keycloak PostgreSQL backup/restore drill path remains under
  `infra/whogohost/scripts/`

Production still requires a customer WhoGoHost VPS, ACME certificates, off-site
rclone/MinIO replication, and operator SSH/firewall hardening via
`scripts/harden-host.sh`.

## Delivery

- CI validates code, migrations, container build, Compose configs, and secrets
- Release workflow packages API image, Expo web export, deploy webhook, optional
  EAS native builds
- Monitoring alert rules and observability runbook committed
- `scripts/eas-beta.sh` is ready; signed betas are blocked only on `EXPO_TOKEN`
  and store credentials (see `/opt/cursor/artifacts/eas-beta-status.txt`)

## Launch

- Staging acceptance, beta matrix, rollback, and evidence templates are in
  `docs/release/` and `scripts/`
- Store metadata draft and legal HTML pages are present
- Remaining human gates: live VPS credentials, EAS/Apple/Google accounts,
  scholarly sign-off, and store form submission
