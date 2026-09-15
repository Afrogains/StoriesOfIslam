# Stories of Islam

Production-oriented Islamic learning platform with an Expo client, a Node.js API,
and a background podcast-generation worker.

## Architecture

- `mobile/`: Expo Web, iOS, and Android client.
- `src/index.ts`: public HTTP API.
- `src/worker.ts`: durable PostgreSQL-backed AI/audio worker.
- `migrations/`: application-owned PostgreSQL migrations.
- `infra/whogohost/`: Docker Compose stack for a WhoGoHost VPS:
  PostgreSQL, Keycloak, MinIO, and Nginx.
- Approved media is stored in the public MinIO bucket. Draft media remains
  private and is only accessible through short-lived signed URLs.

Clients authenticate with Keycloak using Authorization Code + PKCE. The API
validates Keycloak JWTs and is the only application component allowed to access
PostgreSQL. Provider keys and database credentials must never be placed in an
Expo `EXPO_PUBLIC_*` variable.

## Prerequisites

- Node.js 20 or newer
- npm
- Docker with Compose (for the local production stack)
- FFmpeg (included in the production worker image)
- Expo/EAS account for native releases

## Local setup

```bash
cp .env.example .env
cp mobile/.env.example mobile/.env
npm install
npm --prefix mobile install
docker compose -f infra/whogohost/docker-compose.yml up -d
npm run db:migrate
npm run db:seed
npm run dev
```

Run the worker separately:

```bash
npm run dev:worker
```

Run Expo:

```bash
npm --prefix mobile start
```

## Validation

```bash
npm run check
```

This type-checks, tests, and builds the API and mobile application. CI runs the
same gate and also validates the Expo web export and container build.

## Environment model

Use separate WhoGoHost VPS instances, Keycloak realms, databases, buckets, and
secrets for staging and production. See `.env.example`,
`mobile/.env.example`, and `docs/operations/whogohost-runbook.md`.

The recommended hostnames are:

- `auth.example.com`: Keycloak
- `media.example.com`: public MinIO media
- `storage-admin.example.com`: MinIO console (VPN or IP allowlist only)
- `api.example.com`: separately hosted Node API
- `app.example.com`: static Expo web build

## Publication safeguards

AI-created scripts and synthesized audio are always drafts. Publication requires:

1. a structured source citation;
2. a qualified reviewer identity and review timestamp;
3. an approved transcript;
4. verified audio MIME type, duration, checksum, and timeline; and
5. an explicit transition to `published`.

Fallback AI text, estimated timelines, empty audio, and unlicensed voice clones
must never be published.

## Deployment

1. Provision staging using `infra/whogohost/` (`scripts/harden-host.sh`,
   `scripts/provision.sh`, `scripts/install-systemd.sh`).
2. Validate with `scripts/validate-stack.sh` and record a restore drill.
3. Deploy the API and worker with `infra/api-host/docker-compose.yml`.
4. Run migrations as a one-off release job.
5. Deploy Expo Web from `mobile/dist`.
6. Build signed preview binaries with EAS (`scripts/eas-beta.sh` or the Release
   workflow).
7. Complete the release checklist in `docs/release/launch-checklist.md`.

Local cloud-agent drill (host networking when Docker bridge is unavailable):

```bash
npm run platform:local
```

Production promotion is a manual, reviewed CI action. Database and object
storage restore tests are mandatory before launch.
