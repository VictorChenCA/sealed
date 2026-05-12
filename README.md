# Sealed

Salary disclosure circles, sealed to an Intel TDX enclave.

A small group of people in similar roles each submits their compensation
privately into a TEE. A classifier (Qwen 2.5 3B Instruct, running locally
inside the enclave) judges each submission against a published rubric.
Once N validated submissions accumulate, all reveal simultaneously.

The operator — including the developer who shipped this — cannot read any
submission before the threshold is met. The CPU enforces it.

## Stack

- **Runtime:** EigenCompute (Intel TDX, Enterprise 1: 4 vCPU, 16 GB RAM)
- **Server:** Node 22 + Express
- **Classifier:** Qwen 2.5 3B Instruct Q4_K_M (GGUF) via `node-llama-cpp`
- **Signing:** Wallet derived from MNEMONIC sealed by EigenCompute KMS
- **Frontend:** Static HTML/JS served from same container

## Local development

```bash
# 1. Install deps
npm install

# 2. Download the model (~2 GB, one-time)
node scripts/download-model.mjs

# 3. Copy env
cp .env.example .env
# For local runs, set MNEMONIC to any 12-word test mnemonic (NEVER a real one).
# Inside EigenCompute, MNEMONIC is auto-injected by KMS — do not set it.

# 4. Run dev server
npm run dev
```

Visit http://localhost:3000.

## Building the container

```bash
# Pre-fetch the model so it gets baked into the image
node scripts/download-model.mjs

# Build for linux/amd64 (EigenCompute requirement)
docker build --platform linux/amd64 \
  --build-arg COMMIT_SHA=$(git rev-parse HEAD) \
  -t sealed:latest .
```

## Deploying to EigenCompute (verifiable build mode)

This project is deployed with `--verifiable` mode, which means EigenCompute's
own infrastructure builds the Docker image directly from this public GitHub
repo at a specific commit. The on-chain record commits to (commit SHA,
image digest), so anyone can re-clone, rebuild, and verify the digest matches.

```bash
ecloud compute app deploy \
  --force \
  --name sealed \
  --env-file .env.deploy \
  --skip-profile \
  --instance-type g1-standard-4t \
  --environment sepolia \
  --log-visibility public \
  --resource-usage-monitoring enable \
  --verifiable \
  --repo https://github.com/VictorChenCA/sealed \
  --commit $(git rev-parse HEAD) \
  --build-dockerfile Dockerfile

# Watch logs
ecloud compute app logs -w
```

The container takes ~30-60 seconds to load the model on cold start.
`/healthz` returns 200 immediately; the classifier state is exposed
separately and the UI shows a loading pill until ready.

## Verifying a deployment

Anyone can check that the running deployment matches the public source.

```bash
# 1. Hit the verify endpoint
curl https://<your-app>.eigencompute.xyz/verify

# 2. Check the commit SHA matches a published commit in this repo
# 3. Check the model sha256 matches the published Qwen weights
# 4. Reproduce the docker build locally and confirm the image digest matches
```

## Architecture

```
EigenCompute (Intel TDX enclave)
└── Sealed app (Docker, linux/amd64)
    ├── /healthz                  — liveness + classifier state
    ├── /verify                   — attestation surface (image digest, model hash, enclave pubkey)
    ├── /api/circles POST         — create a circle
    ├── /api/circles GET          — list circles
    ├── /api/circles/:id GET      — circle status
    ├── /api/circles/:id/submit   — classify + seal a disclosure
    └── /api/circles/:id/reveal   — return signed reveal once threshold met
```

## Trust model

**What's enforced by hardware:**
- Submissions are unreadable to the operator before reveal
- The running code is what's published in this repo at the attested commit
- The classifier judges every submission against the same published rubric
- Reveals are signed by a key that exists only inside this enclave

**What's not solved:**
- Sybil resistance (one person submitting via multiple wallets) — mitigated by optional offer-letter verification, optional USDC bond
- Classifier correctness — Qwen's judgment is good but not perfect; the rubric is public so the bar is auditable
- Trust in Intel — the whole chain bottoms at Intel TDX's attestation key

## License

MIT
