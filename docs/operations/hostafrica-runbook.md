# HostAfrica platform runbook

## Scope

The HostAfrica VPS hosts PostgreSQL (Keycloak only), Keycloak, MinIO, and Nginx.
Application data lives on HostAfrica MySQL (`afroclov_StoriesOfIslam`). The Node
API and worker run on a separate managed host and reach MySQL plus the VPS
through restricted endpoints. Staging and production must use separate
databases, VPS instances, and credentials.

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
7. Copy `infra/hostafrica`, create `.env` from `.env.example`, and generate every
   password with at least 32 random characters.
8. Replace the example Keycloak web origins and redirect URIs with the exact
   staging hostnames before importing the realm.
9. Run `docker compose config` and review the rendered configuration before
   `docker compose up -d`.
10. Create the confidential `stories-admin` Keycloak service account after
    import. Grant only `realm-management.manage-users`; store its rotated secret
    on the API host.

Never expose the MinIO console publicly. Restrict it at both the HostAfrica
firewall and a VPN/reverse-proxy allowlist.

## Application database roles

Application CRUD uses HostAfrica MySQL. Prefer a migration-capable user for
`npm run db:migrate:prod` and a narrower runtime user for the API/worker once
schema is applied. See `infra/hostafrica/mysql/hostafrica-grants.sql`.

HostAfrica PostgreSQL remains for Keycloak. Clients never receive database
credentials and never connect to MySQL or PostgreSQL directly.

## MinIO policy

`stories-public` permits anonymous GET only and contains immutable, approved
assets. `stories-private` denies anonymous access and contains drafts.
`minio/bootstrap-minio.sh` creates the API service user and least-privilege
policy. Rotate root and API credentials independently.

Publication copies a reviewed object from private storage to an immutable
public key; it does not make the draft bucket public.

## Backups and restore

Install `age`, `rclone`, MySQL client tools (for HostAfrica), PostgreSQL client
tools (for Keycloak), and MinIO `mc` on the backup runner. Schedule `backup.sh`
daily using systemd. Offsite destinations must be in another provider/account;
a second volume on the same VPS is not a backup.

- HostAfrica MySQL: encrypted daily dumps of `afroclov_StoriesOfIslam`, 35-day
  minimum retention.
- HostAfrica PostgreSQL: encrypted daily dumps for Keycloak, 35-day minimum
  retention.
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
- HostAfrica MySQL connection saturation and backup failures;
- HostAfrica PostgreSQL (Keycloak) connection saturation and backup failures;
- Keycloak login error and latency spikes;
- MinIO unavailable disks, healing, object count, and failed replication;
- certificate expiry below 21 days;
- container restarts and OOM kills;
- missed backups and failed restore drills.

Install Prometheus rule files from `infra/hostafrica/monitoring/alerts.yml` and
`infra/monitoring/api-alerts.yml`. Run `scripts/health-check.sh` through the
systemd timer installed by `scripts/install-systemd.sh`.

The Node `/health/ready` endpoint verifies MySQL and MinIO. Independently
monitor Keycloak discovery and the public media hostname.

## Local validation drill

Cloud agents and operators can prove the Compose stack without a public VPS:

```bash
npm run platform:local
```

This generates local TLS material, starts PostgreSQL (Keycloak)/Keycloak/MinIO/
Nginx, and runs `scripts/validate-stack.sh` (OIDC discovery, bucket anonymity,
draft isolation). Use `infra/hostafrica/mysql/docker-compose.yml` for local app MySQL.
Production still requires HostAfrica MySQL, a separate HostAfrica VPS, ACME
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
