# Sealed: TEE-hosted salary disclosure platform
# Must target linux/amd64 and run as root (EigenCompute requirement)
FROM --platform=linux/amd64 node:22-bookworm AS build

WORKDIR /app

# Build tools for node-llama-cpp native bindings
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential cmake python3 git ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

# Install deps
COPY package.json ./
RUN npm install --no-audit --no-fund

# Source
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc

# ---------- Runtime stage ----------
FROM --platform=linux/amd64 node:22-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

# Model gets baked in (see scripts/download-model.mjs)
# Run download-model.mjs before docker build to pre-fetch into ./models
COPY models ./models

# Static web UI
COPY web ./web

# Build metadata baked at image build time
ARG COMMIT_SHA=dev
ARG IMAGE_TAG=dev
ENV COMMIT_SHA_PUBLIC=${COMMIT_SHA}
ENV IMAGE_TAG_PUBLIC=${IMAGE_TAG}
ENV MODEL_PATH=/app/models/qwen2.5-3b-instruct-q4_k_m.gguf
ENV NODE_ENV=production
ENV APP_PORT=3000

EXPOSE 3000

# EigenCompute requires root
USER root

CMD ["node", "dist/index.js"]
