# Production website

## Intended public origin

| Surface | URL | Status |
| --- | --- | --- |
| Website (canonical) | https://storiesoflislam.afroclovers.com.ng | Subdomain must be created in HostAfrica; SPA zip ready |
| Apex | https://afroclovers.com.ng | DNS live; HostAfrica parking until redirect zip is extracted |
| Legal | https://storiesoflislam.afroclovers.com.ng/privacy.html (and `/terms.html`, `/support.html`, `/account-deletion.html`) | In the SPA zip |
| API | https://storiesoflislam.afroclovers.com.ng | Same host once the Node.js App / reverse proxy is attached |

## Package

Rebuild:

```bash
bash scripts/package-web-frontend.sh
```

Artifacts:

- `deploy/storiesofislam-web-frontend.zip` (`EXPO_PUBLIC_ENVIRONMENT=production`, bundled catalog, API URL = canonical host)
- `deploy/afroclovers-apex-redirect.zip` (apex → canonical)

## Go live on HostAfrica

FTP from this agent (preferred when secrets are present):

```bash
HOSTAFRICA_FTP_REMOTE_DIR=/public_html/storiesoflislam \
  bash scripts/hostafrica-ftp-deploy-frontend.sh
ZIP=deploy/afroclovers-apex-redirect.zip HOSTAFRICA_FTP_REMOTE_DIR=/public_html \
  bash scripts/hostafrica-ftp-deploy-frontend.sh
```

Or on the HostAfrica account (cPanel Terminal / SSH):

```bash
cd ~/StoriesOfIslam
git pull origin cursor/cloud-agent-1789504843135-ly7pe
PUBLIC_HTML="$HOME/public_html/storiesoflislam" bash scripts/hostafrica-deploy-frontend-on-server.sh
```

See [hostafrica-frontend-deploy.md](hostafrica-frontend-deploy.md).

## Alternate durable host

[`netlify.toml`](../../netlify.toml) is wired for a claimed Netlify site (anonymous Drop deploys expire and are password-gated). Connect the GitHub repo in Netlify, set the production origin, and replace HostAfrica parking.
