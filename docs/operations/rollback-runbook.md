# Rollback runbook

## API / worker

1. Identify the previous immutable image digest from the release record.
2. On the API host set `API_IMAGE` to that digest and run `infra/api-host/rollback.sh`.
3. Confirm `https://$API_HOSTNAME/health/ready` returns ready.
4. Confirm catalog, auth, and a sample playback URL succeed.
5. Database migrations must remain backward compatible; do not restore a database
   dump to roll back an application release unless data corruption occurred.

## Expo Web

1. Redeploy the previous `mobile/dist` artifact from CI.
2. Invalidate CDN/cache if applicable.
3. Confirm legal pages and OAuth callback routes remain reachable.

## Mobile

1. Pause phased release in App Store Connect / Play Console.
2. Keep the previous store build active.
3. Ship a hotfix build only after staging acceptance probes pass.

## Content incident

1. Archive the story in the API (`publication_status=archived`).
2. Remove or replace the public MinIO object only after archival succeeds.
3. Preserve revision history and reviewer metadata.
4. File a scholarly correction note through the documented process.

## Credential incident

1. Rotate the specific secret (database, MinIO, Keycloak client, provider key).
2. Redeploy API/worker with the rotated secret.
3. Revoke active sessions if an identity credential leaked.
4. Inspect audit logs and open a security incident record.
