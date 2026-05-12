#!/usr/bin/env bash
# Post-deploy validation. Run this after `ecloud compute app deploy` succeeds.
# Assumes BASE_URL is the deployed app URL.

set -euo pipefail

BASE_URL="${BASE_URL:-}"
if [ -z "$BASE_URL" ]; then
  echo "Usage: BASE_URL=https://<your-app>.eigencompute.xyz $0"
  echo "Try: ecloud compute app info sealed   # to find the URL"
  exit 2
fi

echo "==> Validating live deployment at: $BASE_URL"
echo

echo "==> 1. /healthz"
curl -sf "$BASE_URL/healthz" | python3 -m json.tool

echo
echo "==> 2. Wait for classifier ready (up to 5 min)"
for i in $(seq 1 60); do
  state=$(curl -sf "$BASE_URL/healthz" | python3 -c 'import sys,json;print(json.load(sys.stdin)["classifier"]["state"])' 2>/dev/null || echo "unreachable")
  echo "  [$i/60] classifier state: $state"
  if [ "$state" = "ready" ]; then break; fi
  if [ "$state" = "error" ]; then echo "classifier errored — check /healthz"; exit 1; fi
  sleep 5
done
[ "$state" = "ready" ] || { echo "classifier never became ready"; exit 1; }

echo
echo "==> 3. /verify"
curl -sf "$BASE_URL/verify" | python3 -m json.tool

echo
echo "==> 4. End-to-end smoke test"
BASE_URL="$BASE_URL" bash "$(dirname "$0")/smoke-test.sh"

echo
echo "==> 5. Pre-seed a demo circle (so demo doesn't start from cold)"
DEMO_CIRCLE=$(curl -sf -X POST "$BASE_URL/api/circles" \
  -H "content-type: application/json" \
  -d '{"scope":{"company":"Anthropic","role":"SWE","level":"L4","city":"SF"},"target_n":3}' \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')
echo "  Demo circle ID: $DEMO_CIRCLE"
echo "  Pre-share this with audience before the demo:"
echo "  ${BASE_URL} → enter circle ID: ${DEMO_CIRCLE}"
echo

echo "==> Validation complete. Site is live."
