# Koi Architecture

Koi is a mobile-first Next.js App Router application for finding one strong local plan from a natural-language ask. The current architecture is sound for an MVP, but several boundaries are implicit. This document captures the architecture before the Batch 2 provider abstraction work.

## Product Thesis

- One primary input: the user asks Koi in natural language.
- Koi interprets the intent as places, streaming/watch, or events.
- Koi shows one best answer first.
- Secondary options exist, but they do not become the primary UI.
- Meet-halfway results explain drive-time fairness.
- Location fallback must stay graceful when browser geolocation fails.

## App Structure

- `app/page.tsx` is the main client-side product shell. It owns search state, location fallback state, result rendering, sharing, analytics events, and recent-search handling.
- `app/components/` contains UI pieces for the Ask Koi box, location fallback form, results map, venue cards, watch/events cards, weather, loading states, and empty states.
- `app/api/*` contains server routes. Paid API keys stay behind these routes.
- `lib/` contains domain logic for geocoding, Google Places/Routes, scoring, intent routing, events/watch parsing, TMDB, weather-adjacent UI logic, Redis-backed storage, rate limits, and analytics wrappers.
- `lib/providers/` contains the Batch 2 provider interfaces and adapters. The adapters wrap existing logic and preserve current route response shapes.
- `src/config/` contains branding, design, and SEO configuration.

## API Route Map

| Route | Method | Responsibility | Client receives paid keys? |
|---|---|---|---|
| `/api/parse-search` | `POST` | Classifies the Ask Koi query into places, watch, or events; returns a form for place searches. | No |
| `/api/search-halfway` | `POST` | Validates place search input, geocodes locations, searches Google Places, computes route matrix, scores venues. | No |
| `/api/watch-search` | `POST` | Builds streaming/movie/TV recommendations from TMDB when configured, otherwise preview recommendations. | No |
| `/api/watch-events` | `POST` | Builds event/local-happening results. Uses Google Places for live venue-style picks when location is available; otherwise preview mode. | No |
| `/api/geocode` | `POST` | Reverse-geocodes browser/manual location coordinates through Google. | No |
| `/api/place-autocomplete` | `POST` | Returns Google Places autocomplete suggestions. | No |
| `/api/share` | `POST` | Stores share payloads in Redis/KV when configured. | No |
| `/api/share/[id]` | `GET` | Reads a stored share payload. | No |
| `/api/calendar/ics` | `GET` | Generates calendar invite content. | No |

All `/api/*` routes pass through `middleware.ts`, which applies per-IP rate limits from `lib/rateLimit.ts`.

## Server and Client Boundaries

Server-only responsibilities:

- Google Maps Platform calls: Geocoding, Places, Routes.
- TMDB calls.
- Ollama/Gemini parsing calls.
- Redis/KV share storage and rate limiting.
- Share URL construction when route origin is needed.
- Provider adapters for Google, watch, events, parser, and storage.

Client responsibilities:

- Natural-language input and local UI state.
- Browser geolocation request.
- Manual ZIP/city fallback UI.
- Results display, map rendering, cards, and sharing UI.
- Open-Meteo weather fetch. Open-Meteo is no-key and currently called from `WeatherCard`.
- Weather provider adapter for the Open-Meteo call.
- Vercel Analytics event calls through `lib/analytics.ts`.

Current risk: `app/page.tsx` owns many orchestration concerns. Batch 4 should extract this into dedicated hooks without changing the user-facing flow.

## Provider Boundary

API routes now call providers rather than importing the underlying implementation modules directly:

- `/api/parse-search` calls `parserProvider`.
- `/api/search-halfway`, `/api/geocode`, and `/api/place-autocomplete` call `googlePlacesProvider`.
- `/api/watch-search` calls `watchProvider`.
- `/api/watch-events` calls `eventsProvider`.
- `/api/share`, `/api/share/[id]`, and `/s/[id]` call `storageProvider`.
- `WeatherCard` calls `openMeteoWeatherProvider`.

This boundary is intentionally thin. The existing modules still contain the proven behavior; providers are wrappers that make Batch 3 and Batch 5 safer.

## Current Search Flows

### Places / Meet Halfway

1. `AiSearchBox` posts the user query to `/api/parse-search`.
2. `/api/parse-search` returns a `SearchHalfwayRequest`.
3. The client resolves any `"me"` reference from saved/browser/manual location context.
4. `/api/search-halfway` calls `searchHalfway` in `lib/google.ts`.
5. Google Geocoding resolves locations.
6. Google Places searches near the midpoint or single location.
7. Google Routes Compute Route Matrix compares travel time from each origin.
8. `lib/scoring.ts` ranks venues.
9. The UI renders one Koi Pick first, then other good options.

### Watch

1. `/api/parse-search` routes streaming/movie/TV asks to `watch`.
2. `/api/watch-search` calls `lib/watchSearch.ts`.
3. If TMDB is configured, live movie/TV metadata is used.
4. If TMDB is not configured or the ask is unsupported, Koi returns preview-style recommendations.

### Events and Local Happenings

1. `/api/parse-search` routes event/festival/farmers market/street fair asks to `events`.
2. `/api/watch-events` builds results through `lib/eventsSearch.ts`.
3. If enough location context exists and Google is configured, `lib/eventsPlaces.ts` reuses the place search/ranking pipeline to return live venue picks.
4. Otherwise Koi returns preview cards and prompts for location when needed.

## Preview vs Live Behavior

Live results are based on configured external data:

- Google Places for venues and place-style local happenings.
- Google Routes for drive-time comparison.
- TMDB for movie/TV metadata.
- Open-Meteo for no-key weather context.

Preview results are generated from Koi's local rules and copy:

- Events without true event inventory are preview cards.
- Farmers markets, festivals, street fairs, and flea markets may use Google Places for venue-style matches, but schedules still need confirmation.
- Ticketmaster, SeatGeek, ESPN, SportsDataIO, Watchmode, and streaming availability APIs are listed as future providers, not active integrations.

## Known Architecture Risks

- Provider calls are now interface-backed adapters, but some interfaces are still broad wrappers around existing modules.
- Intent routing is split across route code and `lib/watchEvents.ts`.
- Paid API fetches mostly lack shared timeout handling. Batch 2 added `fetchWithTimeout` and applied it to parser provider calls only.
- `app/page.tsx` is large and mixes UI rendering with orchestration.
- Tests are script-based rather than a complete unit/route/UI test suite.
- Event inventory is not yet a true event provider integration.

See `ROADMAP.md` for the Batch 2-5 hardening path.
