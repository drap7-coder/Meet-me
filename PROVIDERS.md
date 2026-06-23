# Provider Responsibilities

This document describes the providers Koi uses today and the Batch 2 provider boundary. The adapters currently wrap existing working logic so behavior remains unchanged.

## Provider Boundary Files

- `lib/providers/types.ts`: shared provider interfaces and result types.
- `lib/providers/googlePlacesProvider.ts`: wraps existing Google geocode, autocomplete, place search, route matrix, and scoring entry points.
- `lib/providers/watchProvider.ts`: wraps existing watch/movie/TV search logic.
- `lib/providers/eventsProvider.ts`: wraps existing local events and live venue-style event search logic.
- `lib/providers/weatherProvider.ts`: wraps Open-Meteo weather fetching.
- `lib/providers/parserProvider.ts`: owns the existing Ask Koi parsing flow that previously lived directly in `/api/parse-search`.
- `lib/providers/storageProvider.ts`: wraps share storage and share payload conversion.
- `lib/providers/fetchWithTimeout.ts`: shared timeout helper currently used by server-side parser provider calls.
- `lib/providers/mockProviders.ts`: minimal mock factory examples for future tests.

## Active Providers

| Provider | Used for | Current code | Key required | Client-side key exposure |
|---|---|---|---|---|
| Google Geocoding API | Location text/place ID to coordinates; reverse geocoding. | `lib/google.ts` | `GOOGLE_MAPS_API_KEY` | No |
| Google Places API | Place autocomplete and text search. | `lib/google.ts` | `GOOGLE_MAPS_API_KEY` | No |
| Google Routes API | Route Matrix drive-time comparison. | `lib/google.ts` | `GOOGLE_MAPS_API_KEY` | No |
| TMDB | Movie/TV metadata and live watch picks. | `lib/tmdb.ts`, `lib/watchMovies.ts` | `TMDB_API_KEY` or `TMDB_READ_ACCESS_TOKEN` | No |
| Ollama | Local/server-reachable natural-language parsing. | `/api/parse-search` | `OLLAMA_BASE_URL` when enabled | No |
| Gemini | Hosted natural-language parsing fallback/production option. | `/api/parse-search` | `GEMINI_API_KEY` or `GOOGLE_API_KEY` | No |
| Vercel KV / Upstash Redis REST | Durable share links and rate limiting. | `lib/redisRest.ts`, `lib/shareStore.ts`, `lib/rateLimit.ts` | KV or Upstash REST URL/token | No |
| Open-Meteo | Weather context card. | `app/components/WeatherCard.tsx` | None | No paid key |
| Vercel Analytics | Product analytics. | `lib/analytics.ts` | Vercel project config | Public analytics client only |

## Preview Providers

These provider names appear in the UI as future or preview data sources. They are not active paid integrations:

- Ticketmaster
- SeatGeek
- ESPN
- SportsDataIO
- Watchmode
- Streaming Availability API

Do not represent preview cards as live inventory. The UI copy should continue to say when schedules, tickets, or streaming availability still need confirmation.

## Safety Rules

- Paid provider keys must remain server-only.
- No `NEXT_PUBLIC_*` paid API keys should be introduced.
- Browser calls should go through `/api/*` when a paid key or secret is involved.
- Provider errors should return friendly messages and preserve fallback UI.
- Rate-limited routes should remain behind `middleware.ts`.
- New paid APIs require explicit review before adding env vars or SDKs.

## Batch 2 Target Interfaces

Batch 2 introduced small interfaces without changing product behavior:

- `GeocodingProvider`
- `PlaceSearchProvider`
- `RouteMatrixProvider`
- `WatchProvider`
- `EventsProvider`
- `WeatherProvider`
- `ParserProvider`
- `ShareStore`
- `RateLimiter`

Each provider should define:

- Input and output types.
- Timeout behavior.
- Error shape.
- Mock implementation for tests.
- Whether results are live or preview.

The current implementation groups geocoding/place/routes into `GooglePlacesProvider` for a surgical first pass. A later pass can split that interface if tests or alternate providers need finer seams.

## Timeout Policy

`fetchWithTimeout` exists for paid/server-side provider calls. It is currently applied to Ollama and Gemini parser calls. Google and TMDB calls still use the existing fetch behavior to avoid changing route latency semantics in this batch. Extending the helper to Google/TMDB should happen after provider tests are in place.
