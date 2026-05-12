# Sealed — Frontend

Next.js 15 App Router webapp for [Sealed](https://github.com/VictorChenCA/sealed).
This frontend talks to the EigenCloud-deployed backend (running inside an Intel TDX
enclave) over HTTPS.

## Pages

- `/` — Landing page. Sells the trust property.
- `/app` — Dashboard. Lists circles and lets users create new ones.
- `/app/circle/[id]` — Circle detail. Submit, wait, reveal.
- `/verify/[id]` — Trust-chain page. Four signed checks, each independently verifiable.

## Stack

- Next.js 15 App Router (React 19, Server + Client Components)
- TypeScript strict
- Tailwind CSS v3 + custom dark theme
- `@privy-io/react-auth` for multi-method auth (email, Google, Apple, GitHub,
  Discord, wallet, Farcaster) — configure in `app/providers.tsx`
- SWR for data fetching (revalidates every few seconds)

## Local development

```bash
cp .env.example .env.local
# Fill in NEXT_PUBLIC_PRIVY_APP_ID (free at https://dashboard.privy.io)

npm install
npm run dev
# http://localhost:3000
```

In development, requests to `/api/*`, `/verify`, and `/healthz` are proxied
to `NEXT_PUBLIC_API_BASE_URL` via `next.config.ts` rewrites. No CORS needed.

## Deploy to Vercel

```bash
vercel --prod
```

Set the env vars on Vercel (Project Settings → Environment Variables):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_PRIVY_APP_ID` | from privy.io dashboard |
| `NEXT_PUBLIC_API_BASE_URL` | `https://34-178-145-214.nip.io` |
| `NEXT_PUBLIC_APP_ID` | `0x01B009899E66b52CF2295b8F79C3fc4E624c0A64` |
| `NEXT_PUBLIC_SOURCE_REPO` | `https://github.com/VictorChenCA/sealed` |
| `NEXT_PUBLIC_VERIFIER_DASHBOARD` | the ecloud verifier link |

Note: the production frontend on Vercel needs the backend to allow
cross-origin requests. Add an `Access-Control-Allow-Origin` header on
the Express server, or proxy frontend-side via Next.js rewrites
(already configured — set `NEXT_PUBLIC_API_BASE_URL` and rewrites kick in).

## What's stubbed vs. polished

The skeleton is complete and functional: layout, providers, routing,
types, API client, every page, and the trust-chain UI. The visual style
is intentionally minimal-but-real (dark theme, Linear/Vercel-inspired)
and can be elaborated by a design pass.

## Auth note

Privy is wired in `app/providers.tsx`. If `NEXT_PUBLIC_PRIVY_APP_ID` is
not set, the app still renders but the sign-in button is hidden and a
warning banner appears. The backend has no per-user authorization yet,
so authenticated identity is currently only used to populate the
`submitter_handle` field on submissions.
