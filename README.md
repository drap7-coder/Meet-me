# Koi

Find the best place to meet.

Koi is a mobile-first Next.js MVP for an intelligent local meeting assistant. Ask Koi where everyone is coming from, what kind of spot you want, and what matters most; the app still handles geocoding, midpoint calculation, Google Places search, and venue ranking itself.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Google Maps Platform
- Optional Supabase environment variables for future saved searches

## Google APIs To Enable

Enable these APIs in the Google Cloud project that owns your API key:

- Geocoding API
- Places API
- Routes API

The app uses the Routes API Compute Route Matrix endpoint to compare travel times from both people to each candidate venue. Places API handles venue search. Geocoding API turns user-entered locations into coordinates.

## Setup

```bash
npm install
cp .env.example .env.local
```

Set:

```bash
GOOGLE_MAPS_API_KEY=your_google_maps_key
NLP_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:8b
OLLAMA_TIMEOUT_MS=30000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`GOOGLE_MAPS_API_KEY` is used only by the server-side Google Maps, Places, Geocoding, and Routes calls. `NLP_PROVIDER`, `OLLAMA_BASE_URL`, and `OLLAMA_MODEL` are used only by the server-side natural-language parser. The browser never receives the model endpoint.

For production hosting, `OLLAMA_BASE_URL` must point to an Ollama endpoint reachable from the server. `http://localhost:11434` works for local development only.

For production on Vercel, set `NLP_PROVIDER=gemini` and add `GOOGLE_API_KEY` or `GEMINI_API_KEY` if you want full cloud parsing. Without either parser provider, Koi falls back to a limited deterministic parser for common "between A and B" prompts.

Then run:

```bash
npm run dev
```

Open `http://localhost:3000`.

## API Routes

- `POST /api/geocode`
- `POST /api/places`
- `POST /api/parse-search`
- `POST /api/route-matrix`
- `POST /api/search-halfway`

The browser calls `/api/search-halfway`; the server handles Google API calls so the Google Maps API key is not exposed to client code.

The browser can also call `/api/parse-search` with `{ "query": "Find a coffee shop between Hoboken and Edison with easy parking" }`. That route calls Ollama/Qwen server-side to parse user intent into structured JSON only:

```json
{
  "location_a": "Hoboken, NJ",
  "location_b": "Edison, NJ",
  "category": "coffee"
}
```

Qwen does not geocode, calculate midpoints, search Places, or rank venues. After parsing, the app fills the existing `SearchHalfwayRequest` form and sends it through `/api/search-halfway`, so Koi's own Google Maps and scoring logic remains the source of truth.

## Local Test Checklist

Run type checking:

```bash
npm run typecheck
```

Run the app:

```bash
npm run dev
```

Test the parser route:

```bash
curl -s http://localhost:3000/api/parse-search \
  -H 'Content-Type: application/json' \
  -d '{"query":"Find a coffee shop between Hoboken and Edison with easy parking"}'
```

Expected response shape:

```json
{
  "parsed": {
    "location_a": "Hoboken, NJ",
    "location_b": "Edison, NJ",
    "category": "coffee"
  },
  "form": {
    "locationA": "Hoboken, NJ",
    "locationB": "Edison, NJ",
    "category": "coffee",
    "searchMode": "midpoint",
    "meetupMode": "single",
    "customQuery": ""
  }
}
```

In the UI, enter the same sentence in the Ask Koi box. It should populate the classic form underneath and then run the existing search.

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
- Supabase is not wired yet; environment variables are included for future saved searches.
- The map panel uses returned coordinates and local rendering so the browser does not need a public Google Maps key.
- Shareable URL parameters are supported for locations, category, and custom query.
- Optional preferences can be shared with `preferences=downtown,walkable,easy_parking`; existing links without preferences still work.
