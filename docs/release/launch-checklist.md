# Production launch checklist

Release owner must attach evidence for every item. Repository automation can
prepare and validate artifacts, but store submission, credentials, legal
contacts, scholarly sign-off, VPS restore evidence, and device acceptance
require authorized humans.

## Staging acceptance

Automation helpers:

- `npm run platform:local` — local WhoGoHost Compose drill
- `npm run platform:validate` — OIDC, Postgres, MinIO policy probes
- `npm run acceptance:staging` — deployed staging HTTP probes
- `bash scripts/beta-matrix.sh` — legal/page probes + manual device matrix
- `infra/whogohost/scripts/backup-postgres-age.sh` + `restore-drill.sh`

- [ ] Fresh staging migration and deterministic seed complete.
- [ ] Keycloak sign-up, verification, PKCE login, refresh rotation, logout, and
      account deletion pass on web, iOS, and Android.
- [ ] Cross-user favorites/progress and private draft access tests are denied.
- [ ] MinIO anonymous access succeeds only for `stories-public`.
- [ ] Worker restart preserves queued jobs; an idempotent replay creates no
      duplicate job or asset.
- [ ] Empty/estimated audio fails; valid FFmpeg audio checksum, duration, MIME,
      and timeline are recorded.
- [ ] Two-person scholarly approval/publication flow passes.
- [ ] Encrypted PostgreSQL and MinIO restore drill evidence is attached.

## Beta matrix

Test current and previous major iOS/Android versions plus Chrome, Safari,
Firefox, and Edge. Include phone, tablet, small viewport, and large-text modes.

- [ ] Home, Explore, Podcast, Library, and Kids journeys.
- [ ] Arabic shaping, diacritics, RTL alignment, and screen-reader labels.
- [ ] Slow network, offline catalog cache, interrupted download, expired/changed
      media URL, airplane mode, and recovery.
- [ ] Playback seek/rate/resume, silent-mode iOS, Android interruption,
      background audio, lock screen, headphones, and incoming call.
- [ ] Bookmark optimistic rollback and cross-device sync.
- [ ] Deep links and protected account actions.
- [ ] No screen loads mock/example media in a production build.
- [ ] Kids Mode content/link/family-safety review.

## Store and legal

- [ ] Replace every `*.example` hostname/address.
- [ ] Host Privacy, Terms, Support, and Account Deletion pages over HTTPS.
- [ ] Obtain jurisdiction-specific privacy/terms review.
- [ ] Complete Apple App Privacy and Google Play Data Safety declarations.
- [ ] Complete content rating, encryption, export-compliance, and permissions
      declarations.
- [ ] Upload app icon, adaptive icon, splash, localized screenshots,
      descriptions, keywords, release notes, reviewer notes, and test account.
- [ ] Confirm “general audience with family-friendly Kids Mode”; do not select a
      child-directed/Kids store category without a separate compliance review.
- [ ] Confirm all artwork, source, translation, and voice licenses.

## Production readiness

- [ ] Staging and production use isolated WhoGoHost VPSs, Keycloak realms,
      PostgreSQL databases, MinIO buckets, API services, and secrets.
- [ ] DNS, TLS renewal, firewall, SSH, OS updates, least privilege, and console
      allowlist are verified.
- [ ] Uptime, error, crash, disk/capacity, backup, certificate, provider cost,
      and worker queue alerts reach the on-call contact.
- [ ] Rollback to the previous immutable API/web/mobile artifact is rehearsed.
- [ ] No critical security, privacy, scholarly, crash, or playback defects.
- [ ] Every published item has citations, reviewer identity/time, valid public
      media, and no unapproved AI output.
- [ ] Product owner authorizes production promotion.

## Post-release

- [ ] Smoke test production sign-in, catalog, bookmark, playback, and deletion.
- [ ] Monitor crashes, HTTP errors/latency, playback failure, jobs, storage,
      disk, backup, and provider spend continuously during rollout.
- [ ] Stage mobile rollout and pause automatically on the agreed error budget.
- [ ] Record release identifiers, migration version, image digest, store build
      numbers, sign-offs, incidents, and follow-up actions.
