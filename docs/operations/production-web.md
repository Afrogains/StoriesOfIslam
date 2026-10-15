# Production website

## Intended public origin

| Surface | URL | Status |
| --- | --- | --- |
| Website | https://afroclovers.com.ng | DNS live; HostAfrica parking page until cPanel extract |
| Legal | https://afroclovers.com.ng/privacy.html (and `/terms.html`, `/support.html`, `/account-deletion.html`) | In the zip |
| API | https://storiesoflislam.afroclovers.com.ng | Does not resolve yet; app uses bundled catalog |

## Package

Rebuild:

```bash
bash scripts/package-web-frontend.sh
```

Artifact: `deploy/storiesofislam-web-frontend.zip` (`EXPO_PUBLIC_ENVIRONMENT=production`, bundled catalog).

## Go live on HostAfrica

SSH/cPanel is not reachable from this agent (port 22 timed out). On the HostAfrica account:

```bash
cd ~/StoriesOfIslam
git pull origin cursor/cloud-agent-1789504843135-ly7pe
bash scripts/hostafrica-deploy-frontend-on-server.sh
```

Or File Manager: extract the zip into `public_html` so `index.html` sits at the docroot (see [hostafrica-frontend-deploy.md](hostafrica-frontend-deploy.md)).

## Alternate durable host

[`netlify.toml`](../../netlify.toml) is wired for a claimed Netlify site (anonymous Drop deploys expire and are password-gated). Connect the GitHub repo in Netlify, set the production origin, and replace HostAfrica parking.
