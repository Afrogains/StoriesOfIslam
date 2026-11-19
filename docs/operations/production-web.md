# Production website

## Intended public origin

| Surface | URL | Status |
| --- | --- | --- |
| Website (canonical) | https://storiesofislam.app | Hosted on HostAfrica (`/domains/storiesofislam.app/public_html`); **domain must be registered** at a registrar (currently NXDOMAIN) |
| Interim public site | https://afroclovers.com.ng | Live SPA for everyone until `.app` DNS delegates |
| Legal | `/privacy.html`, `/terms.html`, `/support.html`, `/account-deletion.html` on either host | Deployed |
| API | https://storiesofislam.app | Same host once the Node.js App / reverse proxy is attached |

### DNS (HostAfrica zone already correct)

DirectAdmin zone for `storiesofislam.app` already has:

- `NS` → `dan1.host-ww.net`, `dan2.host-ww.net`
- `A` `@` → `102.68.98.148`
- `A` `www` → `102.68.98.148`

Adding the domain in DirectAdmin does **not** register it. Until `storiesofislam.app` is purchased and those nameservers (or A records) are set at the registrar, public resolvers return NXDOMAIN.

## Package

```bash
bash scripts/package-web-frontend.sh
```

Artifacts:

- `deploy/storiesofislam-web-frontend.zip` (`EXPO_PUBLIC_ENVIRONMENT=production`, origin = `https://storiesofislam.app`)
- `deploy/afroclovers-apex-redirect.zip` (legacy apex → canonical)

## Go live on HostAfrica

1. Attach **storiesofislam.app** as an addon/primary domain on the HostAfrica account.
2. FTP deploy (when secrets exist):

```bash
HOSTAFRICA_FTP_HOST=storiesofislam.app \
HOSTAFRICA_FTP_REMOTE_DIR=/public_html \
  bash scripts/hostafrica-ftp-deploy-frontend.sh
```

See [hostafrica-frontend-deploy.md](hostafrica-frontend-deploy.md).
