# Halfway

Find the perfect place for two people to meet.

Halfway is a mobile-first Next.js MVP that helps two people find high-quality meeting places near a balanced travel-time midpoint. It searches restaurants, bars, coffee shops, bookstores, driving ranges, parks, dessert spots, or a custom venue type, then ranks venues by travel-time balance and venue quality.

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
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Then run:

```bash
npm run dev
```

Open `http://localhost:3000`.

## API Routes

- `POST /api/geocode`
- `POST /api/places`
- `POST /api/route-matrix`
- `POST /api/search-halfway`

The browser calls `/api/search-halfway`; the server handles Google API calls so the Google Maps API key is not exposed to client code.

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
