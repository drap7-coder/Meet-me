# Deployment

Koi is currently designed for Vercel deployment with server-side API routes. This document covers deploy readiness only; do not deploy to production without explicit approval.

## Vercel Project Setup

1. Connect the repository to Vercel.
2. Set the framework preset to Next.js.
3. Use Node.js 22 or the Vercel default compatible with Next 15.
4. Add the environment variables listed in `ENVIRONMENT.md`.
5. Enable Vercel KV or configure Upstash Redis REST credentials for production.
6. Run the validation commands before promoting a deployment.

## Required Google APIs

Enable these APIs for the project that owns `GOOGLE_MAPS_API_KEY`:

- Geocoding API
- Places API
- Routes API

The app uses Geocoding for address resolution, Places for venue search/autocomplete, and Routes Compute Route Matrix for drive-time scoring.

## Environment Variables on Vercel

Required for live place search:

```bash
GOOGLE_MAPS_API_KEY=...
NEXT_PUBLIC_APP_URL=https://your-production-domain
```

Recommended for production share/rate-limit safety:

```bash
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
```

or:

```bash
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Optional live watch/parser features:

```bash
TMDB_API_KEY=...
TMDB_READ_ACCESS_TOKEN=...
NLP_PROVIDER=gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
```

## No Client-side Paid Keys

Do not add paid API keys with `NEXT_PUBLIC_` prefixes. Current paid provider calls are server-side. The browser may call Open-Meteo directly because it is a no-key API.

## Validation Before Deploy

Run:

```bash
npm install
npm run typecheck
npm run lint
npm run build
npm run test:routing
```

`npm run test` is not available yet. Batch 5 should add it.

## Known Deploy Risks

- Redis/KV is required for production-grade share links and rate limiting. Without it, fallback storage/rate limiting is per-instance memory only.
- Google/TMDB/Gemini fetches should get shared timeout handling in Batch 2.
- Event inventory is not yet backed by Ticketmaster, SeatGeek, or similar APIs.
- Lint warnings should be resolved before heavy UI expansion.
- Dependency audit currently needs review before forced upgrades.

## Explicit Non-actions

- Do not deploy to production during Batch 1.
- Do not rotate secrets during Batch 1.
- Do not add new paid APIs during Batch 1.
- Do not change app behavior during Batch 1.
