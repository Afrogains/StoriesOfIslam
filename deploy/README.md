# HostAfrica deploy packages

- `storiesofislam-web-frontend.zip` — production Expo web build for `public_html` (afroclovers.com.ng)
  - API target: `https://storiesoflislam.afroclovers.com.ng`
  - Environment: `production` (bundled catalog; API overlay when published feed is richer)
  - Rebuild: `bash scripts/package-web-frontend.sh`
  - On-server extract: `bash scripts/hostafrica-deploy-frontend-on-server.sh`
  - See `docs/operations/hostafrica-frontend-deploy.md`
