# Search Architecture

This document describes how Koi search works today. Follow these patterns when adding providers, ranking layers, or new query types.

---

## Overview

Search is orchestrated on the client by `app/page.tsx` (`executeSearch`) and on the server primarily by `/api/koi-search` → `lib/koiSearchExecute.ts` (`executeKoiSearch`). Classic meet-halfway and direct places searches also use `/api/search-halfway`.

```
User Query
    ↓
Intent Classification
    ↓
Routing
    ↓
Provider Selection
    ↓
Normalization
    ↓
Ranking
    ↓
Composition
    ↓
Result Diversity
    ↓
Response
```

### Stage details

| Stage | Responsibility | Key modules |
|-------|----------------|-------------|
| **Intent Classification** | Decide what the user wants: a place, a live event, streaming content, or a structured explore chip selection. | `lib/providers/parserProvider.ts`, `lib/watchEvents.ts`, `lib/localEventIntent.ts`, `lib/exploreRouting.ts`, `lib/nearFeatureQuery.ts` |
| **Routing** | Pick the execution path (Ticketmaster-only, time-aware explore, OpenTripMap explore, watch, or Google Places). | `lib/koiSearchExecute.ts`, `lib/exploreRouting.ts`, `lib/searchIntent.ts` |
| **Provider Selection** | Choose which external APIs to call based on normalized explore intent and env availability. | `lib/exploreIntent.ts`, `lib/exploreRouting.ts` (`selectProvidersForExplore`, `availableProviders`) |
| **Normalization** | Map provider payloads into internal types (`ScoredVenue`, `EventResult`, `VenueCandidate`). Dedupe, attach distances, apply EV annotations. | `lib/google.ts`, `lib/exploreSearch.ts`, `lib/providers/ticketmasterEventProvider.ts`, `lib/providers/evEnrichment.ts` |
| **Ranking** | Re-sort normalized results by relevance, travel mode, time, and seasonal signals. | `lib/scoring.ts`, `lib/exploreModeRanking.ts`, `lib/eventRanking.ts`, `lib/timeAwareExplore.ts` |
| **Composition** | Shape the final pick list (Koi Pick, trending slots, event overlays). | `lib/topPick.ts`, `lib/trendingComposition.ts`, `lib/placesWithEvents.ts` |
| **Result Diversity** | Spread experience types and providers across the top of broad temporal queries. | `lib/resultDiversityRanking.ts` |
| **Response** | Return typed API responses; client renders loading, results, or inline errors. | `lib/searchIntent.ts` (`KoiSearchApiResponse`), `lib/searchStatus.ts`, `app/page.tsx` |

Geocode and location resolution happen **before** normalization. If location cannot be resolved, the pipeline stops and returns a structured error or location prompt — failed geocodes never enter the result list.

---

## Provider Responsibilities

Providers are selected by intent, not hard-coded per city. Each provider self-gates when its API key is missing.

### Google Places

Primary venue discovery for place-like queries.

- Restaurants, coffee, brunch, bars, breweries
- Shopping and nightlife
- Specific named places and meet-halfway searches
- Geocoding, autocomplete, route matrix (via Google Maps APIs)

**Modules:** `lib/google.ts`, `lib/providers/googlePlacesProvider.ts`  
**Env:** `GOOGLE_MAPS_API_KEY`

### OpenTripMap

Outdoor and cultural POI discovery; supplements Google for explore categories.

- Outdoors (trails, parks, gardens, scenic spots)
- Museums, landmarks, historic sites
- Public art and attractions
- Farmers markets (with Google Places fallback)

**Modules:** `lib/providers/openTripMapProvider.ts`, `lib/exploreSearch.ts`  
**Env:** `OPENTRIPMAP_API_KEY`

### Ticketmaster

Primary live-event inventory.

- Concerts, comedy, theater, festivals
- Sports games and live events
- Weekend / tonight temporal queries routed via explore events chips

**Modules:** `lib/providers/ticketmasterEventProvider.ts`, `lib/eventDiscovery.ts`  
**Env:** `TICKETMASTER_API_KEY`

### Open Charge Map

EV enrichment — not a standalone discovery provider.

- EV charger proximity search when travel mode is `ev`
- Destination enrichment: annotates ranked venues with nearby charging context

**Modules:** `lib/providers/openChargeMap.ts`, `lib/providers/evEnrichment.ts`  
**Env:** `OPENCHARGEMAP_API_KEY`

Triggered by `effectiveTravelModeForQuery` in `lib/evSearchIntent.ts` and near-feature queries like “coffee near an EV charger” (`lib/nearFeatureQuery.ts`).

### Eventbrite

Optional secondary event source.

- Authorized organizers only (configured in `src/config/eventbriteSources.ts`)
- Deprioritized after Ticketmaster in dedupe
- Used for farmers markets and time-aware explore when sources exist

**Modules:** `lib/providers/eventbriteEventProvider.ts`  
**Env:** `Eventbrite_API_KEY` / `EVENTBRITE_API_KEY`

### Future Providers

#### National Park Service

Planned for national-scale outdoor discovery (`ProviderKey: national_parks` exists; routing stub on `main`, implementation on `feature/nps-outdoor-provider`).

- National parks, monuments, historic sites
- Recreation areas and scenic drives
- Park alerts and amenity metadata

#### Wikipedia

Enrichment only — never used for discovery.

- Short summaries attached to the top-ranked venue for curiosity queries
- Applied via `applyPlaceInsight` in `lib/placeInsight.ts`

---

## Ranking Layers

Ranking is applied in order. Later layers adjust ordering; they do not replace earlier relevance signals entirely.

### 1. Base relevance

Fairness scoring for meet-halfway and single-origin searches.

- Travel-time balance between two origins
- Rating, open-now, user preferences, route availability

**Module:** `lib/scoring.ts` (`scoreVenue`)

### 2. Travel mode

Re-ranks and adjusts search radius/query hints for the active travel mode.

- Modes: `auto`, `drive`, `walk`, `bike`, `ev`
- Walk/bike: proximity boosts; EV: charger proximity boosts
- Persisted client-side in `lib/travelMode.ts`

**Module:** `lib/exploreModeRanking.ts` (`applyExploreTravelModeRanking`)

### 3. Time-aware ranking

For broad temporal explore queries (“things to do this weekend”, “concerts tonight”).

- Combines Ticketmaster events, OpenTripMap venues, and Google Places
- Temporal scoring boosts items matching the time window
- Falls back to Google-only when combined coverage is too sparse

**Module:** `lib/timeAwareExplore.ts`

### 4. Seasonal boosts

Soft composition for trending and time-aware feeds.

- In-season sports, live music, comedy, outdoors slots
- Seasonal specials (e.g. World Cup window)
- Does not hard-exclude off-season items

**Module:** `lib/trendingComposition.ts` (`composeTrendingPicks`, `getSeasonalSportsPriorities`)

### 5. Trending composition

Fills trending cards and time-aware top picks with a balanced mix of experience types.

- Used by `lib/weekendTrendingEvents.ts` and `lib/trendingNearYou.ts`
- Relaxed fill when image-qualified candidates are sparse

### 6. Result diversity

Applied on broad temporal explore queries (not narrow asks like “sushi near me”).

- Caps experience types in the top 6 / top 10
- Limits provider concentration in the top 10
- Improves variety among equal-quality results; does not override strong relevance

**Module:** `lib/resultDiversityRanking.ts` (`shouldApplyDiversityRanking`, `diversifyExploreResults`)

---

## Search Modes

The product exposes two top-level builder modes (`ExploreMode` in `lib/exploreIntent.ts`): **Streaming** and **Explore**. Places and Events are execution paths, not separate builder tabs.

### Streaming

What to watch — no location required.

- Movies, TV, genres, streaming service filters
- Detected by `hasStreamingWatchContext` in `lib/watchEvents.ts`
- Executed via `/api/watch-search` → `lib/watchSearch.ts` (TMDB live or preview cards)
- Isolated from explore chips (`validateExploreBuilderIsolation`)

### Explore

What to do nearby — location-aware local discovery.

- Categories: food & drink, nightlife, events, sports, activities, outdoors
- Subcategory chips (trails, museums, concerts, sports bars, etc.)
- Payload: `exploreIntent: { mode, category, subcategoryId }` on koi-search
- Routed by `normalizeExploreIntent` → provider stack + flags:
  - `routeViaTicketmaster` — events/sports chips
  - `preferOpenTripMap` — outdoors/activities
  - `timeAwareExplore` — broad temporal queries

**Explore execution paths:**

| Path | When | Providers |
|------|------|-----------|
| Ticketmaster-only | Events/sports chips, pure event queries | Ticketmaster (+ Google for sports bars) |
| Time-aware explore | “This weekend”, “tonight”, broad temporal asks | Ticketmaster + OpenTripMap + Google (+ Eventbrite) |
| OpenTripMap explore | Structured outdoors/activities chips | OpenTripMap + Google |
| Default parser/places | Freeform place queries | Google Places (+ OpenTripMap supplement) |

### Places (execution path)

Meet-halfway, single-origin, and parser-resolved place searches.

- `/api/search-halfway` or koi-search `kind: "places"`
- Output: ranked `ScoredVenue[]`, optional event overlay via `enrichPlacesResponseWithEvents`

### Events (execution path)

Live events without a primary place intent.

- Pure event/sports/music queries (`isPureEventQuery`)
- koi-search `kind: "events"` or blended places+events when appropriate
- Location required except nationwide named-team sports queries

---

## Guiding Principles

- **Intent before providers.** Classify the query first; then select providers that match the intent.
- **Providers are interchangeable.** New sources plug in via `ProviderKey` and routing helpers without rewriting the client.
- **Composition is a preference, not a hard rule.** Seasonal and trending slots prefer in-season or varied picks but still backfill from available results.
- **Diversity improves equal-quality results** rather than overriding relevance. Narrow queries skip diversity entirely.
- **Keep providers independent.** Each provider module handles its own API, caching, and empty responses.
- **Never hard-code city-specific behavior.** Location comes from geocoding and user context, not query string exceptions.
- **Gracefully degrade when a provider fails.** Missing API keys return empty arrays; other providers still contribute.
- **Keep searches fast.** Response caching (`lib/searchResponseCache.ts`), geocode cache, provider-level TTL caches, and prefetch on search-box focus reduce latency.

---

## Current Feature Inventory

Completed capabilities in the search stack:

| Capability | Module(s) |
|------------|-----------|
| Travel mode ranking | `lib/travelMode.ts`, `lib/exploreModeRanking.ts`, `lib/evSearchIntent.ts` |
| Time-aware Explore | `lib/timeAwareExplore.ts`, `lib/exploreRouting.ts` |
| Result diversity | `lib/resultDiversityRanking.ts` |
| Trending composition | `lib/trendingComposition.ts`, `lib/weekendTrendingEvents.ts`, `lib/trendingNearYou.ts` |
| Near-feature parsing | `lib/nearFeatureQuery.ts` — distinguishes “near a trail” from “near Edison” |
| Search error states | `lib/searchStatus.ts`, `app/components/SearchInlineMessage.tsx` |
| Location onboarding | `lib/currentLocation.ts`, `lib/savedUserLocation.ts`, `lib/homeLocation.ts`, `app/components/home/LocationOnboardingCard.tsx` |
| OpenTripMap integration | `lib/providers/openTripMapProvider.ts`, `lib/exploreSearch.ts` |
| Ticketmaster integration | `lib/providers/ticketmasterEventProvider.ts`, `lib/eventDiscovery.ts` |
| Open Charge Map enrichment | `lib/providers/openChargeMapEnrichment.ts`, `lib/providers/evEnrichment.ts` |

---

## Key entry points

| Concern | File |
|---------|------|
| Client search dispatch | `app/page.tsx` → `executeSearch` |
| Unified server orchestration | `lib/koiSearchExecute.ts` → `executeKoiSearch` |
| Explore intent normalization | `lib/exploreRouting.ts` → `normalizeExploreIntent` |
| NLP / heuristic parse | `lib/providers/parserProvider.ts` → `parseSearch` |
| API contracts | `lib/searchIntent.ts`, `lib/types.ts` |
| Tests | `scripts/test-basic-search-routing.ts`, `scripts/test-explore-routing.ts`, `scripts/test-near-feature-query.ts`, `scripts/test-search-status.ts` |
