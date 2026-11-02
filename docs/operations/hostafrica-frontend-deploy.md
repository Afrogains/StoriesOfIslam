# Deploy Expo web frontend to HostAfrica (cPanel)

## Canonical URLs

| Surface | URL |
| --- | --- |
| **Web app (canonical)** | `https://storiesoflislam.afroclovers.com.ng` |
| Apex redirect | `https://afroclovers.com.ng` → canonical web app |
| API (same host) | `https://storiesoflislam.afroclovers.com.ng` |

Create the `storiesoflislam` subdomain in HostAfrica cPanel before deploying the SPA.
Point its document root at a dedicated folder (typical: `public_html/storiesoflislam` or
`storiesoflislam.afroclovers.com.ng`). The apex `public_html` should only hold the
redirect package so visitors never see the HostAfrica parking page.

## Build package (local / CI / agent)

```bash
bash scripts/package-web-frontend.sh
```

This writes:

- `deploy/storiesofislam-web-frontend.zip` — Expo SPA + legal pages + SPA `.htaccess`
  - `EXPO_PUBLIC_API_URL=https://storiesoflislam.afroclovers.com.ng`
  - `EXPO_PUBLIC_ENVIRONMENT=production`
- `deploy/afroclovers-apex-redirect.zip` — instant redirect from the apex to the canonical URL

Expo 57 inlines `EXPO_PUBLIC_*` from a `.env` file (the packaging script creates one). Shell-only exports are not enough.

## Preferred deploy: FTP from this agent

Once `HOSTAFRICA_FTP_USER` / `HOSTAFRICA_FTP_PASSWORD` are available:

```bash
# 1) SPA → subdomain docroot
HOSTAFRICA_FTP_REMOTE_DIR=/public_html/storiesoflislam \
  bash scripts/hostafrica-ftp-deploy-frontend.sh

# 2) Apex redirect → public_html
ZIP=deploy/afroclovers-apex-redirect.zip \
HOSTAFRICA_FTP_REMOTE_DIR=/public_html \
  bash scripts/hostafrica-ftp-deploy-frontend.sh
```

Adjust `HOSTAFRICA_FTP_REMOTE_DIR` to match the subdomain folder shown in cPanel → Domains / Subdomains.

## Deploy on HostAfrica (cPanel Terminal)

```bash
cd ~/StoriesOfIslam   # or your clone path
git fetch origin
git checkout cursor/cloud-agent-1789504843135-ly7pe
git pull origin cursor/cloud-agent-1789504843135-ly7pe
PUBLIC_HTML="$HOME/public_html/storiesoflislam" bash scripts/hostafrica-deploy-frontend-on-server.sh
# Then extract deploy/afroclovers-apex-redirect.zip into $HOME/public_html
```

## Upload via cPanel File Manager

1. cPanel → **Subdomains** → create `storiesoflislam` under `afroclovers.com.ng` (document root e.g. `public_html/storiesoflislam`).
2. Wait for DNS (`dig +short storiesoflislam.afroclovers.com.ng` should return the HostAfrica IP).
3. File Manager → open the subdomain docroot → delete parking `index.html` if present.
4. Upload + extract `storiesofislam-web-frontend.zip` so `index.html` sits in that folder.
5. File Manager → `public_html` (apex) → replace parking page with `afroclovers-apex-redirect.zip`.
6. Visit `https://storiesoflislam.afroclovers.com.ng` and `https://afroclovers.com.ng` (should jump to the app).

## Quick check

- Canonical URL loads Stories of Islam (not “Website coming soon”).
- Apex redirects to the canonical URL.
- Browser network tab: API calls target `https://storiesoflislam.afroclovers.com.ng`.
- `https://storiesoflislam.afroclovers.com.ng/health/live` returns JSON when the Node API is attached; until then the SPA still serves the bundled catalog.

Login/auth needs Keycloak later. The production site serves the in-app catalog even when the API host does not resolve.
