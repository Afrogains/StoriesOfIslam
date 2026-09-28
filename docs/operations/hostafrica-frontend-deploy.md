# Deploy Expo web frontend to HostAfrica (cPanel)

## URLs

| Surface | URL |
| --- | --- |
| Frontend | `https://afroclovers.com.ng` |
| API (Node.js App) | `https://storiesoflislam.afroclovers.com.ng` |

## Build package (local / CI / agent)

```bash
bash scripts/package-web-frontend.sh
```

This writes `deploy/storiesofislam-web-frontend.zip` with:

- `EXPO_PUBLIC_API_URL=https://storiesoflislam.afroclovers.com.ng`
- `EXPO_PUBLIC_ENVIRONMENT=preview`
- SPA `.htaccess` and legal HTML from `mobile/public/`

Expo 57 inlines `EXPO_PUBLIC_*` from a `.env` file (the packaging script creates one). Shell-only exports are not enough.

## Deploy on HostAfrica (cPanel Terminal)

From the cloned repo on the account (same place you ran the MySQL import):

```bash
cd ~/StoriesOfIslam   # or your clone path
git fetch origin
git checkout cursor/cloud-agent-1789504843135-ly7pe
git pull origin cursor/cloud-agent-1789504843135-ly7pe
bash scripts/hostafrica-deploy-frontend-on-server.sh
```

Or download the zip from the public branch and extract:

```bash
cd ~
curl -L -o storiesofislam-web-frontend.zip \
  "https://raw.githubusercontent.com/Afrogains/StoriesOfIslam/cursor/cloud-agent-1789504843135-ly7pe/deploy/storiesofislam-web-frontend.zip"
# File Manager: upload/extract into public_html, or:
PUBLIC_HTML="$HOME/public_html" bash -c '
  unzip -qo ~/storiesofislam-web-frontend.zip -d "$PUBLIC_HTML"
'
```

## Upload via cPanel File Manager

1. Download `deploy/storiesofislam-web-frontend.zip` from GitHub (or the agent artifact).
2. cPanel → **File Manager** → open `public_html` for `afroclovers.com.ng`.
3. Delete or rename the HostAfrica default parking `index.html`.
4. **Upload** the zip → **Extract** into `public_html` (so `index.html` is directly in `public_html`).
5. Confirm `.htaccess` is present (SPA routing).
6. Visit `https://afroclovers.com.ng`.

## Quick check

- Frontend loads (not the green “Domain Successfully Registered” page).
- Browser network tab: API calls go to `https://storiesoflislam.afroclovers.com.ng`.
- `https://storiesoflislam.afroclovers.com.ng/health/live` returns JSON ok.
- DNS: the `storiesoflislam` subdomain must resolve (cPanel subdomain / A record) before the API URL works.

Login/auth needs Keycloak later; catalog may use preview fixtures until the API catalog returns published stories.
