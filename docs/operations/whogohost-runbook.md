# WhoGoHost platform runbook

## Scope

The WhoGoHost VPS hosts PostgreSQL, Keycloak, MinIO, and Nginx only. The Node
API and worker run on a separate managed host and reach the VPS through
restricted TLS endpoints. Staging and production must use separate VPS
instances and credentials.

## Initial provisioning

1. Create a non-root operator with SSH keys and passwordless access only for
   the commands required to manage Docker and the firewall.
2. Disable root/password SSH login. Enable automatic security updates,
   `fail2ban`, audit logging, and a deny-by-default firewall.
3. Permit public inbound traffic only on 80/443. Permit SSH from the operator
   VPN/IP range. PostgreSQL and raw MinIO/Keycloak ports remain private.
4. Install supported Docker Engine and the Compose plugin.
5. Point the auth, media, and restricted storage-console DNS records at the VPS.
6. Issue TLS certificates with ACME. Use DNS validation when wildcard
   certificates are required.
7. Copy `infra/whogohost`, create `.env` from `.env.example`, and generate every
   password with at least 32 random characters.
8. Replace the example Keycloak web origins and redirect URIs with the exact
   staging hostnames before importing the realm.
9. Run `docker compose config` and review the rendered configuration before
   `docker compose up -d`.
10. Create the confidential `stories-admin` Keycloak service account after
    import. Grant only `realm-management.manage-users`; store its rotated secret
    on the API host.

Never expose the MinIO console publicly. Restrict it at both the WhoGoHost
firewall and a VPN/reverse-proxy allowlist.

## Application database roles

Use `stories_app` for migrations and a separate `stories_runtime` role for the
API where operational policy permits. The runtime role needs CRUD only on
application tables and sequence usage; it must not create extensions, roles, or
schemas. The worker can share the runtime role initially, but production should
use a dedicated role with access to generation and media tables.

Clients never receive database credentials and never connect to PostgreSQL.

## MinIO policy

`stories-public` permits anonymous GET only and contains immutable, approved
assets. `stories-private` denies anonymous access and contains drafts.
`minio/bootstrap-minio.sh` creates the API service user and least-privilege
policy. Rotate root and API credentials independently.

Publication copies a reviewed object from private storage to an immutable
public key; it does not make the draft bucket public.

## Backups and restore

Install `age`, `rclone`, PostgreSQL client tools, and MinIO `mc` on the backup
runner. Schedule `backup.sh` daily using systemd. The rclone and MinIO offsite
destinations must be in another provider/account; a second volume on the same
VPS is not a backup.

- PostgreSQL: encrypted daily custom-format dumps, 35-day minimum retention.
- MinIO: versioning plus daily offsite mirror/snapshot.
- Keycloak: captured by the PostgreSQL backup; export realm configuration after
  every administrative change.
- Secrets/TLS: back up through the organization password manager and ACME
  recovery process, never in Git.

Run `restore-drill.sh` into an isolated database monthly and before every major
release. Record duration, row counts, object checksum verification, operator,
and result in the release evidence.

## Health and monitoring

Alert on:

- filesystem above 75% and forecast exhaustion;
- PostgreSQL connection saturation, replication/backup failures, and long
  transactions;
- Keycloak login error and latency spikes;
- MinIO unavailable disks, healing, object count, and failed replication;
- certificate expiry below 21 days;
- container restarts and OOM kills;
- missed backups and failed restore drills.

Install Prometheus rule files from `infra/whogohost/monitoring/alerts.yml` and
`infra/monitoring/api-alerts.yml`. Run `scripts/health-check.sh` through the
systemd timer installed by `scripts/install-systemd.sh`.

The Node `/health/ready` endpoint verifies PostgreSQL and MinIO. Independently
monitor Keycloak discovery and the public media hostname.

## Local validation drill

Cloud agents and operators can prove the Compose stack without a public VPS:

```bash
npm run platform:local
```

This generates local TLS material, starts PostgreSQL/Keycloak/MinIO/Nginx, and
runs `scripts/validate-stack.sh` (OIDC discovery, bucket anonymity, draft
isolation). Production still requires a separate WhoGoHost VPS, ACME
certificates, off-site encrypted backups, and a recorded restore drill.

## Upgrade procedure

1. Review upstream release notes and back up all services.
2. Test image upgrades and database migrations in staging.
3. Complete a staging login, refresh, logout, media read/write, API, worker, and
   restore smoke test.
4. Pin the exact tested image tag in Compose.
5. Upgrade one production service at a time in a maintenance window.
6. Verify metrics and core journeys before proceeding.

Never use `latest` tags in production.

## Incident and rollback

For an API release, roll traffic back to the previous immutable image; database
migrations must be backward compatible. For content incidents, archive the
story and remove its public catalog reference immediately, preserving revision
and review history. For leaked credentials, revoke and rotate the specific
database, MinIO, Keycloak, or provider credential and inspect audit logs.

For data loss, isolate the affected service, preserve disks/logs, restore into a
new environment, verify integrity, then switch traffic. Do not restore over the
only remaining copy.
