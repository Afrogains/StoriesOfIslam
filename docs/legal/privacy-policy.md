# Privacy policy

Last updated: 15 September 2026

Stories of Islam is a general-audience learning application with an optional,
family-friendly Kids Mode. Accounts are optional for reading public catalog
content. An account enables cross-device bookmarks and listening progress.

## Data we process

- Keycloak account identifiers, verified email address, display name, and roles.
- Bookmarked story identifiers and listening position.
- Security and reliability logs such as request identifier, coarse timestamp,
  status code, and service error. Authorization headers, cookies, provider
  secrets, and message content are redacted from application logs.
- Questions or generation requests submitted to editorial tools by authorized
  operators.

We do not sell personal data, use third-party advertising, or intentionally
collect precise location, contacts, photos, or microphone recordings.

## Providers

Authentication, PostgreSQL data, and media storage run on separate
staging/production services provisioned on WhoGoHost infrastructure using
Keycloak and MinIO. The API/worker hosting provider processes requests and logs.
Authorized content-generation workflows may send reviewed source text to
OpenAI and synthesized script text to ElevenLabs or Google TTS. Public users do
not send story listening activity to those AI/TTS providers.

## Retention and deletion

Bookmarks and progress remain until removed or the account is deleted.
Operational logs are retained for 30 days unless required longer to investigate
a security incident. Failed generation details are retained for 90 days.
Approved editorial revision and citation records are retained as the
publication audit trail and are not linked to a deleted listener account.

Users can delete their account and synchronized data from Library → Account.
The API deletes the Keycloak identity and removes bookmarks/progress. Backups
expire on the normal 35-day encrypted rotation.

## Children

The application is not represented as a child-directed store category. Kids
Mode is a family-friendly presentation within a general-audience product.
Accounts are optional, external links are minimized, and content requires
editorial review. A parent or guardian should supervise a child’s use.

## Security and rights

Data is encrypted in transit. Production credentials use least privilege and
backups are encrypted off-site. Depending on local law, users may request
access, correction, export, restriction, or deletion.

Privacy and data requests: privacy@storiesofislam.example  
Security reports: security@storiesofislam.example

Replace the example-domain contacts with monitored production addresses before
store submission.
