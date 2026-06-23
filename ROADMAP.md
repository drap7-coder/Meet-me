# Roadmap

This roadmap follows the hardening sequence requested for Koi. Batch 1 is documentation and env safety only.

## Batch 1: Documentation and Env Safety

Status: In progress

- Document current architecture.
- Document API route map.
- Document server/client boundaries.
- Document provider responsibilities.
- Document preview vs live behavior.
- Document env vars and Vercel setup.
- Confirm `.env.example` completeness.
- Link docs from `README.md`.

## Batch 2: Provider Abstraction

Status: Complete

- Add provider interfaces for geocoding, places, routes, watch, events, parser, weather, share storage, and rate limiting.
- Add timeout policy for external API calls.
- Add mock providers for tests.
- Preserve current behavior while moving implementation behind interfaces.

Notes:

- Batch 2 added broad provider wrappers rather than splitting every provider into fine-grained interfaces.
- `fetchWithTimeout` is currently used for parser provider calls. Google/TMDB timeout adoption should wait for provider tests.
- Rate limiting remains in `lib/rateLimit.ts` behind middleware and was not moved in this batch.

## Batch 3: Intent and Search Architecture

- Add an intent registry.
- Model future intents explicitly:
  - meet halfway
  - find dinner
  - find events
  - festivals/street fairs
  - farmers markets
  - weather-aware plans
  - movie/show pairing
- Keep the one-input UI while routing to typed handlers.
- Add fixtures for each intent.

## Batch 4: UX Fallback Polish

- Extract UI orchestration from `app/page.tsx`.
- Keep one Koi Pick first.
- Improve location chip and manual ZIP/city fallback consistency.
- Preserve graceful behavior when browser location fails.
- Tighten empty, loading, and provider-unavailable states.

## Batch 5: Tests and Deploy Validation

- Add `npm run test`.
- Add unit tests for intent parsing and location fallback.
- Add API route tests.
- Add provider mocks.
- Add UI smoke tests.
- Update CI to run the full validation command set.
- Review npm audit findings without forced breaking changes.

## Non-goals

- No production deploy without explicit approval.
- No secret rotation as part of ordinary hardening work.
- No new paid API integrations without provider docs and approval.
- No full redesign unless the architecture forces it.
