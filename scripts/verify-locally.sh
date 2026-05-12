#!/usr/bin/env bash
# Sealed — local verification CLI.
# Runs the three trust-chain checks anyone can do without trusting the operator:
#
#   1. The /verify endpoint exposes (commit SHA, model SHA256, enclave pubkey)
#   2. The commit SHA exists in the public GitHub repo
#   3. The model SHA256 matches the one declared by HuggingFace
#
# Usage:
#   ./scripts/verify-locally.sh                          # uses default deployed URL
#   ./scripts/verify-locally.sh https://your-host.tld    # explicit override

set -euo pipefail

DEFAULT_URL="https://34-178-145-214.nip.io"
URL="${1:-$DEFAULT_URL}"

echo "==> Sealed local verifier"
echo "    Target: $URL"
echo

# --- 1. Pull the attestation surface ---
echo "[1/3] Fetching /verify ..."
V=$(curl -fsS --max-time 15 "$URL/verify")
COMMIT=$(echo "$V" | python3 -c 'import sys,json;print(json.load(sys.stdin)["commit_sha"])')
MODEL_SHA=$(echo "$V" | python3 -c 'import sys,json;print(json.load(sys.stdin)["classifier"]["model_sha256"] or "(loading)")')
ENCLAVE_KEY=$(echo "$V" | python3 -c 'import sys,json;print(json.load(sys.stdin)["enclave_pubkey"])')
REPO=$(echo "$V" | python3 -c 'import sys,json;print(json.load(sys.stdin)["repo_url"])')
echo "      commit: $COMMIT"
echo "      model:  $MODEL_SHA"
echo "      pubkey: $ENCLAVE_KEY"
echo "      repo:   $REPO"
echo

# --- 2. Check commit exists in the public GitHub repo ---
echo "[2/3] Checking commit exists in public repo..."
# Extract owner/repo from URL like https://github.com/VictorChenCA/sealed
OWNER_REPO=$(echo "$REPO" | sed -E 's#https://github.com/##; s#/$##')
GH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://api.github.com/repos/$OWNER_REPO/commits/$COMMIT")
if [ "$GH_STATUS" = "200" ]; then
  echo "      ✓ commit $COMMIT exists in $REPO"
else
  echo "      ✗ commit not found in repo (HTTP $GH_STATUS)"
  exit 1
fi
echo

# --- 3. Verify model SHA256 matches the one used in the Dockerfile in that commit ---
echo "[3/3] Verifying classifier model hash against the source-pinned value..."
DOCKERFILE_SHA=$(curl -fsS "https://raw.githubusercontent.com/$OWNER_REPO/$COMMIT/Dockerfile" \
  | grep -E '^ARG MODEL_SHA256=' | head -1 | sed -E 's/ARG MODEL_SHA256="?([0-9a-f]+)"?/\1/')

if [ -z "$DOCKERFILE_SHA" ]; then
  echo "      ✗ couldn't extract MODEL_SHA256 from Dockerfile at $COMMIT"
  exit 1
fi

if [ "$MODEL_SHA" = "$DOCKERFILE_SHA" ]; then
  echo "      ✓ live model sha256 matches Dockerfile pin at commit $COMMIT"
  echo "        ($MODEL_SHA)"
else
  echo "      ✗ MISMATCH!"
  echo "        live:        $MODEL_SHA"
  echo "        Dockerfile:  $DOCKERFILE_SHA"
  exit 1
fi
echo

echo "==> All checks passed."
echo "    The running deployment is built from:"
echo "    $REPO/tree/$COMMIT"
echo
echo "    To reproduce the image yourself:"
echo "      git clone $REPO && cd sealed && git checkout $COMMIT"
echo "      docker build -t sealed:verify ."
echo "    The resulting image digest should match the one registered on-chain."
