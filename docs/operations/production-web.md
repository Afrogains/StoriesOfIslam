# Production website

## Intended public origin

| Surface | URL | Status |
| --- | --- | --- |
| Website (canonical) | https://storiesofislam.app | Standalone domain; SPA zip ready |
| Legal | https://storiesofislam.app/privacy.html (and `/terms.html`, `/support.html`, `/account-deletion.html`) | In the SPA zip |
| API | https://storiesofislam.app | Same host once the Node.js App / reverse proxy is attached |
| Legacy | https://afroclovers.com.ng | Optional redirect package → storiesofislam.app |

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
