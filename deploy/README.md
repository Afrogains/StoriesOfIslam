# HostAfrica deploy packages

- `storiesofislam-web-frontend.zip` — production Expo web build for **https://storiesofislam.app**
  - Canonical URL: `https://storiesofislam.app` (standalone — not under afroclovers.com.ng)
  - API target: `https://storiesofislam.app`
  - Environment: `production` (bundled catalog; API overlay when published feed is richer)
  - Rebuild: `bash scripts/package-web-frontend.sh`
  - FTP deploy: `HOSTAFRICA_FTP_HOST=storiesofislam.app bash scripts/hostafrica-ftp-deploy-frontend.sh`
- `afroclovers-apex-redirect/` — optional `https://afroclovers.com.ng` → `https://storiesofislam.app`
- See `docs/operations/hostafrica-frontend-deploy.md`
