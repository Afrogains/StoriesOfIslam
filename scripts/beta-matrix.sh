#!/usr/bin/env bash
# Device/browser beta matrix tracker. Marks automated probes and lists human
# device checks that must be attached as release evidence.
set -euo pipefail

: "${API_BASE_URL:?set API_BASE_URL}"
: "${WEB_BASE_URL:?set WEB_BASE_URL}"
CURL_INSECURE="${CURL_INSECURE:-0}"
CURL_OPTS=(-fsS --max-time 20)
if [[ "$CURL_INSECURE" == "1" ]]; then
  CURL_OPTS+=(-k)
fi

printf '== Automated probes ==\n'
curl "${CURL_OPTS[@]}" "$API_BASE_URL/health/ready" | jq -e '.status=="ready"' >/dev/null && echo PASS api-ready
curl "${CURL_OPTS[@]}" "$WEB_BASE_URL/" >/dev/null && echo PASS web-home
for path in privacy.html terms.html support.html account-deletion.html; do
  curl "${CURL_OPTS[@]}" "$WEB_BASE_URL/$path" >/dev/null && echo "PASS legal-$path"
done

cat <<'EOF'

== Manual beta matrix (attach evidence) ==
[ ] iOS current major: Home/Explore/Podcast/Library/Kids + background audio
[ ] iOS previous major: resume position + interruption
[ ] Android current major: lock screen controls + headphones
[ ] Android previous major: offline download recovery
[ ] Web Chrome/Safari/Firefox/Edge: OAuth PKCE + playback fallback
[ ] RTL Arabic shaping and large text mode
[ ] Network loss / airplane mode recovery
[ ] Account deletion completes and tokens are revoked
EOF
