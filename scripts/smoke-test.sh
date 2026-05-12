#!/usr/bin/env bash
# Smoke test: exercises the full create -> submit -> reveal flow against a
# running local server. Assumes the server is up on $BASE_URL (default :3000)
# and the classifier has finished loading.
#
# Usage:
#   ./scripts/smoke-test.sh
#   BASE_URL=https://my-app.eigencompute.xyz ./scripts/smoke-test.sh

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
echo "==> Smoke testing against: $BASE_URL"

echo "==> /healthz"
curl -sf "$BASE_URL/healthz" | python3 -m json.tool || { echo "healthz failed"; exit 1; }

echo "==> /verify"
curl -sf "$BASE_URL/verify" | python3 -m json.tool || { echo "verify failed"; exit 1; }

echo "==> Wait for classifier ready"
for i in $(seq 1 60); do
  state=$(curl -sf "$BASE_URL/healthz" | python3 -c 'import sys,json;print(json.load(sys.stdin)["classifier"]["state"])')
  echo "  state=$state ($i/60)"
  if [ "$state" = "ready" ]; then break; fi
  if [ "$state" = "error" ]; then echo "classifier errored"; exit 1; fi
  sleep 5
done

if [ "$state" != "ready" ]; then
  echo "classifier did not become ready in time"
  exit 1
fi

echo "==> Create a circle"
CIRCLE_JSON=$(curl -sf -X POST "$BASE_URL/api/circles" \
  -H "content-type: application/json" \
  -d '{"scope":{"company":"Google","role":"SWE","level":"L4","city":"SF"},"target_n":3}')
echo "$CIRCLE_JSON" | python3 -m json.tool
CIRCLE_ID=$(echo "$CIRCLE_JSON" | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')
echo "Circle ID: $CIRCLE_ID"

submit() {
  local handle="$1" base="$2" equity="$3" notes="$4"
  echo "==> Submit ($handle, base=$base)"
  curl -sf -X POST "$BASE_URL/api/circles/$CIRCLE_ID/submit" \
    -H "content-type: application/json" \
    -d "{
      \"submitter_handle\":\"$handle\",
      \"level\":\"L4\",
      \"city\":\"SF\",
      \"base_salary\":$base,
      \"bonus_target_pct\":15,
      \"signing_bonus\":50000,
      \"equity_grant_usd\":$equity,
      \"vest_years\":4,
      \"notes\":\"$notes\"
    }" | python3 -m json.tool
}

# Three plausible submissions
submit "dragon_jpeg" 195000 480000 "New grad SWE offer"
submit "owl_42"      210000 540000 "Returning intern conversion"
submit "fox_19"      198000 510000 "Standard L4 offer"

echo "==> Reveal"
curl -sf "$BASE_URL/api/circles/$CIRCLE_ID/reveal" | python3 -m json.tool

echo
echo "==> Smoke test complete"
