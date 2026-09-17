# Release evidence template
#
# Copy to a private operations store (never commit filled evidence with secrets).
# Attach the completed file to the launch checklist ticket.

Release ID:
Git SHA:
API image digest:
Web artifact SHA256:
iOS build number:
Android versionCode:
Environment: staging | production
Operator:
Date (UTC):

## WhoGoHost
- [ ] Fresh migrations + deterministic seed evidence attached
- [ ] Keycloak login/refresh/logout/account-deletion evidence attached
- [ ] MinIO public/private policy probe output attached
- [ ] Encrypted PostgreSQL dump restore drill duration + row counts
- [ ] MinIO object checksum verification
- [ ] Firewall/SSH hardening checklist signed

## API / worker
- [ ] /health/ready green for PostgreSQL, Keycloak, MinIO, FFmpeg, providers
- [ ] Job restart durability evidence
- [ ] Idempotent generation replay evidence
- [ ] Rollback to previous image rehearsed

## Clients
- [ ] Expo web HTTPS smoke
- [ ] TestFlight install + core journey
- [ ] Play internal testing install + core journey
- [ ] Offline/interruption/RTL matrix complete

## Scholarly / legal
- [ ] Every published item has reviewer identity + timestamp
- [ ] Privacy/Terms/Support/Account Deletion HTTPS URLs live
- [ ] Store privacy forms completed
- [ ] Product owner authorization recorded

Notes / incidents / follow-ups:
