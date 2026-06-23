# Testing

The current validation surface is useful but incomplete. Batch 1 documents it; Batch 5 should add the missing test harness and coverage.

## Current Commands

```bash
npm run typecheck
npm run lint
npm run build
npm run test:routing
```

Current script notes:

- `npm run typecheck` runs `tsc --noEmit`.
- `npm run lint` runs ESLint.
- `npm run build` runs the Next production build.
- `npm run test:routing` runs `scripts/test-bot-mode-routing.ts` against local pure routing logic.
- `npm run test:parser` exists but expects a running app at `PARSE_SEARCH_URL` or `http://localhost:3000`.
- `npm run test` does not exist yet.

## Gaps to Close in Batch 5

- Unit tests for intent parsing and bot-mode routing.
- Unit tests for category resolution and preferences detection.
- Unit tests for location fallback helpers.
- Full provider mocks for Google, TMDB, parser providers, Redis, and weather. Batch 2 added minimal mock factory examples in `lib/providers/mockProviders.ts`; Batch 5 should turn those into real test fixtures.
- API route tests for `/api/parse-search`, `/api/search-halfway`, `/api/watch-search`, and `/api/watch-events`.
- UI smoke tests for Ask Koi, location fallback, one Koi Pick first, empty states, and loading states.
- CI should run `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## Suggested Test Stack

- Vitest for unit tests.
- React Testing Library for component-level UI tests.
- Playwright for a small set of smoke tests.
- MSW or provider-level mocks for external APIs.

## Provider Mock Starting Point

Batch 2 added `lib/providers/mockProviders.ts` with small factory helpers. Use those when adding tests so default CI does not require Google, TMDB, Gemini, Ollama, Redis, or Open-Meteo network calls.

## Test Data Principles

- Keep example asks realistic and product-specific.
- Cover each supported bot mode: places, watch, events.
- Include location failure cases: blocked browser location, manual ZIP fallback, missing second midpoint location.
- Include preview vs live cases.
- Do not require paid provider calls for default CI.

## Current Validation Result Expectations

The current repo should pass:

```bash
npm run typecheck
npm run build
npm run test:routing
```

`npm run lint` currently passes with warnings. Treat warnings as debt, especially hook dependency warnings and invalid ARIA attributes.
