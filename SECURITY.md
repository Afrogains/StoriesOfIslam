# Security policy

Report vulnerabilities privately to security@storiesofislam.example. Do not
include credentials or personal data in a public issue.

Production controls:

- Keycloak Authorization Code + PKCE for public clients; no Expo client secret.
- Short-lived access tokens with rotating refresh tokens.
- JWT issuer, audience, signature, algorithm, and expiry validation at the API.
- HostAfrica MySQL and private MinIO buckets reachable only by server identities.
- Explicit role and ownership checks for user, generation, review, and
  publication operations.
- Request size/rate limits, allowlisted CORS, security headers, parameterized
  SQL, immutable public media, and structured redacted logs.
- Separate staging/production credentials and encrypted off-site backups.

CI scans dependencies and committed content for secrets. Production releases
require a successful restore drill and security/privacy checklist.

Replace the example-domain address with a monitored mailbox before release.
