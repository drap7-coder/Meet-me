# Contributing

Koi is currently in hardening mode. Keep changes small, documented, and easy to validate.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill `.env.local` using `ENVIRONMENT.md`. Never commit `.env.local` or real provider secrets.

## Before Opening a PR

Run:

```bash
npm run typecheck
npm run lint
npm run build
npm run test:routing
```

When Batch 5 adds a real test script, also run:

```bash
npm run test
```

## Safety Rules

- Do not expose paid API keys in client code.
- Do not add `NEXT_PUBLIC_*` keys for Google, TMDB, Gemini, Redis, Ticketmaster, SeatGeek, or similar paid/secret providers.
- Do not add new paid APIs without updating `PROVIDERS.md`, `ENVIRONMENT.md`, and `DEPLOY.md`.
- Do not change production deploy configuration without explicit approval.
- Do not rotate secrets unless specifically asked.

## Architecture Rules

- Prefer current patterns until provider interfaces are introduced.
- Keep API routes as the server boundary for paid providers.
- Preserve the one-input, one-best-answer product thesis.
- Keep preview results clearly labeled as preview.
- Keep location fallback graceful.

## Documentation Expectations

Architecture, provider, deploy, env, testing, and roadmap changes should be documented in the matching top-level docs before or alongside implementation.
