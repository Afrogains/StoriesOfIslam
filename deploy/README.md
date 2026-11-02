# HostAfrica deploy packages

- `storiesofislam-web-frontend.zip` — production Expo web build for the **Stories of Islam** host
  - Canonical URL: `https://storiesoflislam.afroclovers.com.ng`
  - API target: `https://storiesoflislam.afroclovers.com.ng`
  - Environment: `production` (bundled catalog; API overlay when published feed is richer)
  - Rebuild: `bash scripts/package-web-frontend.sh`
  - FTP deploy: `bash scripts/hostafrica-ftp-deploy-frontend.sh`
  - On-server extract: `PUBLIC_HTML=$HOME/public_html/storiesoflislam bash scripts/hostafrica-deploy-frontend-on-server.sh`
- `afroclovers-apex-redirect/` (+ zip from packaging) — `https://afroclovers.com.ng` → canonical Stories of Islam URL
- See `docs/operations/hostafrica-frontend-deploy.md`
