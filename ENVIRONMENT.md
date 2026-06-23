# Environment Variables

Use `.env.example` as the source template for local development and Vercel configuration. Do not commit `.env.local` or real secrets.

## Server-only Variables

| Variable | Required | Used by | Notes |
|---|---:|---|---|
| `GOOGLE_MAPS_API_KEY` | Yes for live place search | Google Geocoding, Places, Routes | Server-only. Enable Geocoding API, Places API, and Routes API. |
| `TMDB_API_KEY` | Optional | TMDB watch picks | Set this or `TMDB_READ_ACCESS_TOKEN`. Server-only. |
| `TMDB_READ_ACCESS_TOKEN` | Optional | TMDB watch picks | Alternative to `TMDB_API_KEY`. Server-only. |
| `NLP_PROVIDER` | Optional | `/api/parse-search` | Use `ollama` for local/server Ollama. Use `gemini` only when Gemini key is configured. Empty falls back where possible. |
| `OLLAMA_BASE_URL` | Optional locally | Ollama parser | `http://localhost:11434` is local only. Production needs a server-reachable endpoint. |
| `OLLAMA_MODEL` | Optional | Ollama parser | Defaults to `qwen3:8b`. |
| `OLLAMA_TIMEOUT_MS` | Optional | Ollama parser | Defaults to `30000`. |
| `GEMINI_API_KEY` | Optional | Gemini parser | Prefer this for Gemini. Server-only. |
| `GOOGLE_API_KEY` | Optional | Gemini parser | Supported by current code as a Gemini key alternative. Server-only. |
| `GEMINI_MODEL` | Optional | Gemini parser | Defaults to `gemini-2.5-flash`. |
| `KV_REST_API_URL` | Production recommended | Redis REST | Used for Vercel KV/Upstash-compatible REST. |
| `KV_REST_API_TOKEN` | Production recommended | Redis REST | Token for `KV_REST_API_URL`. |
| `UPSTASH_REDIS_REST_URL` | Production alternative | Redis REST | Alias supported by `lib/redisRest.ts`. |
| `UPSTASH_REDIS_REST_TOKEN` | Production alternative | Redis REST | Alias supported by `lib/redisRest.ts`. |

## Public Variables

| Variable | Required | Used by | Notes |
|---|---:|---|---|
| `NEXT_PUBLIC_APP_URL` | Recommended | Share links | Public origin only. It must not contain secrets. |

`NEXT_PUBLIC_APP_URL` is safe because it is only an origin such as `https://example.com`. Do not add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_TMDB_API_KEY`, or any other paid provider key.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

For local parser development with Ollama:

```bash
NLP_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:8b
```

For Vercel-hosted parser behavior, use Gemini only when a dedicated key is configured:

```bash
NLP_PROVIDER=gemini
GEMINI_API_KEY=...
```

## Production Safety

- Configure Redis/KV in production for durable share links and rate limiting.
- Restrict Google API key usage in Google Cloud where possible.
- Keep all paid keys server-side.
- Do not rely on in-memory share storage or rate limiting for production scale.
- Do not rotate secrets as part of normal docs-only or refactor work.

## `.env.example` Completeness Check

`.env.example` should include every env var referenced by the current code:

- `GOOGLE_MAPS_API_KEY`
- `TMDB_API_KEY`
- `TMDB_READ_ACCESS_TOKEN`
- `NLP_PROVIDER`
- `OLLAMA_BASE_URL`
- `OLLAMA_MODEL`
- `OLLAMA_TIMEOUT_MS`
- `GOOGLE_API_KEY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `NEXT_PUBLIC_APP_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
