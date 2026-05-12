# Sealed: TEE-hosted salary disclosure platform
# Must target linux/amd64 and run as root (EigenCompute requirement)

# ---------- Build stage: compile TypeScript and native node-llama-cpp bindings ----------
FROM node:22-bookworm AS build

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential cmake python3 git ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY tsconfig.json ./
COPY src ./src
RUN npx tsc


# ---------- Model fetch stage: download Qwen 2.5 3B Q4_K_M and verify sha256 ----------
FROM debian:bookworm-slim AS model

ARG MODEL_URL="https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/7dabda4d13d513e3e842b20f0d435c732f172cbe/qwen2.5-3b-instruct-q4_k_m.gguf"
ARG MODEL_SHA256="626b4a6678b86442240e33df819e00132d3ba7dddfe1cdc4fbb18e0a9615c62d"

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /model && \
    echo "Downloading model from: $MODEL_URL" && \
    curl -fL --retry 3 --retry-delay 5 "$MODEL_URL" -o /model/qwen2.5-3b-instruct-q4_k_m.gguf && \
    echo "$MODEL_SHA256  /model/qwen2.5-3b-instruct-q4_k_m.gguf" | sha256sum -c - && \
    echo "Model verified: $MODEL_SHA256"


# ---------- Runtime stage ----------
FROM node:22-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
COPY web ./web

# Bring in the verified model
COPY --from=model /model/qwen2.5-3b-instruct-q4_k_m.gguf /app/models/qwen2.5-3b-instruct-q4_k_m.gguf

# Build metadata baked at image build time
ARG COMMIT_SHA=dev
ARG IMAGE_TAG=dev
ENV COMMIT_SHA_PUBLIC=${COMMIT_SHA}
ENV IMAGE_TAG_PUBLIC=${IMAGE_TAG}
ENV MODEL_PATH=/app/models/qwen2.5-3b-instruct-q4_k_m.gguf
ENV MODEL_SHA256_PUBLIC=626b4a6678b86442240e33df819e00132d3ba7dddfe1cdc4fbb18e0a9615c62d
ENV NODE_ENV=production
ENV APP_PORT=3000

EXPOSE 3000

# EigenCompute requires root
USER root

CMD ["node", "dist/index.js"]
