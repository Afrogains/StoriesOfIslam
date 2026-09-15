# Observability

## Signals

- API: `/health/live`, `/health/ready`, token-gated `/metrics`
- WhoGoHost: systemd `stories-health-check.timer`, Keycloak discovery, MinIO
  live, disk usage, container health
- Prometheus rules: `infra/whogohost/monitoring/alerts.yml`,
  `infra/monitoring/api-alerts.yml`
- Blackbox modules: `infra/whogohost/monitoring/blackbox.yml`

## Required alerts

Route to the on-call contact before production promotion:

1. API readiness failure
2. Keycloak discovery failure
3. MinIO media hostname failure
4. Disk above 75%
5. Missed encrypted backup (>36h)
6. TLS certificate <21 days
7. Provider spend spike
8. Generation queue backlog

## Release tagging

Set `RELEASE_SHA` on the API/worker containers to the Git SHA. Upload Expo
source maps for production builds when Sentry is configured via
`EXPO_PUBLIC_SENTRY_DSN` / `SENTRY_DSN`.
