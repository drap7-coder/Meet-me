# Koi

Find the best place to meet.

Koi is a mobile-first Next.js MVP for an intelligent local meeting assistant. Ask Koi where everyone is coming from, what kind of spot you want, and what matters most; the app handles geocoding, midpoint calculation, Google Places search, route comparison, venue ranking, weather context, and watch/events previews.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Google Maps Platform
- TMDB for live watch picks when configured
- Vercel KV or Upstash Redis REST for production share links and API rate limiting

## Documentation

- `ARCHITECTURE.md`: current app structure, route map, server/client boundaries, and known risks.
- `PROVIDERS.md`: current provider responsibilities, preview/live behavior, and Batch 2 provider-interface targets.
- `ENVIRONMENT.md`: env var reference, local setup, Vercel safety rules, and `.env.example` completeness.
- `DEPLOY.md`: Vercel setup, required Google APIs, validation commands, and deploy risks.
- `TESTING.md`: current validation commands and Batch 5 test gaps.
- `DECISIONS.md`: architecture decisions and proposed provider-boundary ADR.
- `ROADMAP.md`: Batch 1-5 hardening roadmap.
- `CONTRIBUTING.md`: setup, validation, safety, and documentation expectations.

## Google APIs To Enable

Enable these APIs in the Google Cloud project that owns your API key:

- Geocoding API
- Places API
- Routes API

The app uses the Routes API Compute Route Matrix endpoint to compare travel times from both people to each candidate venue. Places API handles venue search and autocomplete. Geocoding API turns user-entered locations into coordinates.

## Setup

```bash
npm install
cp .env.example .env.local
```

Fill `.env.local` using `ENVIRONMENT.md`.

Minimum local live place search:

```bash
GOOGLE_MAPS_API_KEY=your_google_maps_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Optional local parser with Ollama:

```bash
NLP_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:8b
OLLAMA_TIMEOUT_MS=30000
```

Then run:

```bash
npm run dev
```

Open `http://localhost:3000`.

## API Routes

- `POST /api/geocode`
- `POST /api/parse-search`
- `POST /api/place-autocomplete`
- `POST /api/search-halfway`
- `POST /api/watch-search`
- `POST /api/watch-events`
- `POST /api/share`
- `GET /api/share/[id]`
- `GET /api/calendar/ics`

All `/api/*` routes are rate-limited per IP. Redis-backed rate limiting is required for production reliability.

## Key Safety Rule

Paid provider keys are server-only. Do not add `NEXT_PUBLIC_*` paid keys. Browser code calls Koi API routes for Google, TMDB, parser, share storage, and rate-limited work. The current weather card calls Open-Meteo directly because it is a no-key API.

## Preview vs Live Results

Live results currently come from:

- Google Places and Routes for place/venue search.
- TMDB for movie/TV picks when configured.
- Open-Meteo for weather context.

Preview results are local Koi suggestions for future integrations. Ticketmaster, SeatGeek, Watchmode, Streaming Availability API, ESPN, and SportsDataIO are not active paid integrations yet.

## Local Validation

Run:

```bash
npm run typecheck
npm run lint
npm run build
npm run test:routing
```

`npm run test` does not exist yet. Batch 5 should add the real test harness.

## Scoring

The scoring utility lives in `lib/scoring.ts`.

It rewards:

- small travel-time differences
- lower total travel time
- higher rating
- more reviews
- venues that are open now

It penalizes:

- large time imbalance
- missing route data
- closed venues

The MVP formula:

```ts
100
- abs(timeA - timeB) * 2
- totalTravelMinutes * 0.25
+ rating * 8
+ min(reviewCount / 50, 10)
+ openNowBonus
```

## Notes

- No paid auth is required for the MVP.
- The map panel uses returned coordinates and local rendering so the browser does not need a public Google Maps key.
- Shareable URL parameters are supported for locations, category, and custom query.
- Optional preferences can be shared with `preferences=downtown,walkable,easy_parking`; existing links without preferences still work.
