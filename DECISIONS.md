# Decisions

This file records current architecture decisions and the intended direction for the next hardening batches.

## 0001: Keep Paid API Keys Server-side

Status: Accepted

Koi routes all paid provider calls through server-side code. Google Maps Platform, TMDB, Ollama/Gemini, and Redis/KV credentials must not be exposed to the browser.

Consequences:

- Browser code calls Koi API routes.
- Provider errors can be normalized before reaching UI.
- Rate limits can be applied in middleware.
- New paid APIs need env/deploy documentation before use.

## 0002: Preview Results Must Be Labeled as Preview

Status: Accepted

Koi may return preview cards for future integrations such as Ticketmaster, SeatGeek, Watchmode, ESPN, and SportsDataIO. Preview cards are useful product scaffolding but must not imply real inventory.

Consequences:

- UI copy should distinguish preview suggestions from live provider results.
- Farmers market/festival/street fair results from Google Places should still tell users to confirm dates and hours.

## 0003: One Primary Answer First

Status: Accepted

The product should optimize for one best answer first, with secondary options available underneath.

Consequences:

- Ranking and result rendering should preserve one Koi Pick.
- New intent types should return a primary recommendation shape or adapt to one.

## 0004: Add Provider Interfaces Before Adding More Providers

Status: Accepted

Provider calls now go through thin adapters in `lib/providers/`. Before adding Ticketmaster, SeatGeek, Watchmode, or other paid APIs, Koi should keep using those provider boundaries and add tests around them.

Consequences:

- New providers become swappable.
- Tests can run without paid network calls.
- Timeout and error behavior can be standardized.
- Existing app behavior remains in the original modules until wrappers are covered by tests.
