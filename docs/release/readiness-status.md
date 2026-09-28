# Production readiness status

## Done in this branch (automated)

- HostAfrica MySQL app DB (`mysql2`, migrations, seed) — CI + local verified
- Platform renamed to `infra/hostafrica/` (no WhoGoHost leftovers)
- Go-live tooling: `scripts/go-live.sh`, preflight, MySQL backup/restore drills
- Local staging drill achieved in agent:
  - MySQL `afroclov_StoriesOfIslam` migrated/seeded (4 categories, 43 figures, 33 stories)
  - Keycloak realm discovery via Nginx TLS (`https://auth.local.test`)
  - API `/health/ready` green (database, queue, storage, keycloak, ffmpeg, providers)
  - Catalog/figures endpoints serving from MySQL; favorites require auth
- Unit/typecheck/build gates green

## Still requires your HostAfrica / store credentials

These cannot be completed without secrets and accounts you control:

1. **HostAfrica cPanel MySQL** — real `DB_*` (not local test password)
2. **HostAfrica VPS** — public DNS, ACME TLS, real MinIO (quay.io MinIO pulls are blocked in some agent networks; VPS should pull fine)
3. **Provider keys** — production OpenAI / ElevenLabs (not placeholders)
4. **Content publish** — seed stories remain `draft` until scholarly review + real audio
5. **Legal contacts** — replace `*@storiesofislam.example` with monitored mailboxes
6. **EAS / Apple / Google** — `EXPO_TOKEN` + store credentials for signed betas
7. **Product-owner sign-off** on `docs/release/launch-checklist.md`

## Exact next command for you

```bash
# After filling /etc/stories/api.env from infra/api-host/.env.example:
./scripts/go-live.sh preflight /etc/stories/api.env
./scripts/go-live.sh migrate
./scripts/go-live.sh seed
# Then provision infra/hostafrica on the VPS and deploy infra/api-host
```

See `docs/release/go-live-runbook.md`.
