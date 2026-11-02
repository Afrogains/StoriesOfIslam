# Deploy Expo web frontend to HostAfrica (cPanel)

## Canonical URLs

| Surface | URL |
| --- | --- |
| **Web app (canonical)** | `https://storiesofislam.app` |
| API (same host) | `https://storiesofislam.app` |
| Legacy apex (optional) | `https://afroclovers.com.ng` → `https://storiesofislam.app` |

The public product URL is **storiesofislam.app alone** — not a subdomain of afroclovers.com.ng.

In HostAfrica cPanel, add `storiesofislam.app` as an **Addon Domain** (or primary domain) and point its document root at a dedicated folder (typical: `~/storiesofislam.app` or `public_html` for that domain). DNS A record should target the HostAfrica account IP (`102.68.98.148` for the current Afroclovers account, or whichever IP HostAfrica assigns).

## Build package (local / CI / agent)

```bash
bash scripts/package-web-frontend.sh
```

This writes:

- `deploy/storiesofislam-web-frontend.zip` — Expo SPA + legal pages + SPA `.htaccess`
  - `EXPO_PUBLIC_WEB_ORIGIN=https://storiesofislam.app`
  - `EXPO_PUBLIC_API_URL=https://storiesofislam.app`
  - `EXPO_PUBLIC_ENVIRONMENT=production`
- `deploy/afroclovers-apex-redirect.zip` — optional redirect from the old Afroclovers apex

## Preferred deploy: FTP from this agent

Once `HOSTAFRICA_FTP_USER` / `HOSTAFRICA_FTP_PASSWORD` are available:

```bash
# SPA → storiesofislam.app document root
HOSTAFRICA_FTP_HOST=storiesofislam.app \
HOSTAFRICA_FTP_REMOTE_DIR=/public_html \
  bash scripts/hostafrica-ftp-deploy-frontend.sh

# Optional: legacy Afroclovers apex redirect
ZIP=deploy/afroclovers-apex-redirect.zip \
HOSTAFRICA_FTP_HOST=afroclovers.com.ng \
HOSTAFRICA_FTP_REMOTE_DIR=/public_html \
  bash scripts/hostafrica-ftp-deploy-frontend.sh
```

Adjust `HOSTAFRICA_FTP_REMOTE_DIR` to match the addon-domain folder shown in cPanel → Domains.

## Deploy on HostAfrica (cPanel Terminal)

```bash
cd ~/StoriesOfIslam
git pull origin cursor/cloud-agent-1789504843135-ly7pe
PUBLIC_HTML="$HOME/storiesofislam.app" bash scripts/hostafrica-deploy-frontend-on-server.sh
# path may be $HOME/public_html depending on how the addon domain was created
```

## Upload via cPanel File Manager

1. Register / attach **storiesofislam.app** in HostAfrica (Addon Domain).
2. Point DNS A (and www CNAME/A) at the hosting IP; wait for propagation.
3. File Manager → open the `storiesofislam.app` docroot → remove parking `index.html`.
4. Upload + extract `storiesofislam-web-frontend.zip` so `index.html` is at the docroot.
5. Visit `https://storiesofislam.app`.

## Quick check

- `https://storiesofislam.app` loads Stories of Islam (not “Website coming soon”).
- No `afroclovers.com.ng` appears in the address bar or in API calls.
- Legal pages: `/privacy.html`, `/terms.html`, `/support.html`, `/account-deletion.html`.
