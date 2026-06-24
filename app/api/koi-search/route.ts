import { executeKoiSearch } from "@/lib/koiSearchExecute";
import { ParseSearchError } from "@/lib/providers/parserProvider";
import { buildKoiSearchCacheKey, withSearchResponseCache } from "@/lib/searchResponseCache";
import {
  countKoiSearchResult,
  executeInSearchTelemetry,
  finalizeSearchTelemetry
} from "@/lib/searchTelemetry.server";
import { logApiError } from "@/lib/serverLog";
import { NextResponse } from "next/server";

const ENDPOINT = "/api/koi-search";

// Only cache fully-resolved result kinds — never location prompts or errors.
const CACHEABLE_KINDS = new Set(["places", "watch", "events"]);
const FRESH_TTL_SECONDS = 60 * 5;
const STALE_TTL_SECONDS = 60 * 30;

export async function POST(request: Request) {
  const startedAt = Date.now();
  let query = "";

  try {
    const body = await request.json();
    query = typeof body.query === "string" ? body.query.trim() : "";
    if (!query) {
      finalizeSearchTelemetry({
        endpoint: ENDPOINT,
        searchKind: "freeform",
        query,
        status: 400,
        resultCount: null,
        startedAt,
        errorMessage: "missing_query"
      });
      return NextResponse.json({ error: "Tell Koi what you are looking for." }, { status: 400 });
    }

    const cacheKey = buildKoiSearchCacheKey(body);
    const { result, collector } = await executeInSearchTelemetry(async () => {
      const cached = await withSearchResponseCache({
        key: cacheKey,
        freshTtlSeconds: FRESH_TTL_SECONDS,
        staleTtlSeconds: STALE_TTL_SECONDS,
        loader: () => executeKoiSearch(body),
        shouldCache: (value) => CACHEABLE_KINDS.has(value.kind)
      });
      return cached.value;
    });
    const status = result.kind === "needs_location" ? 422 : 200;
    finalizeSearchTelemetry(
      {
        endpoint: ENDPOINT,
        searchKind: "freeform",
        resolvedKind: result.kind,
        query,
        status,
        resultCount: countKoiSearchResult(result),
        startedAt
      },
      collector
    );

    return NextResponse.json(result, { status });
  } catch (error) {
    logApiError(ENDPOINT, error);
    const status =
      error instanceof ParseSearchError ? error.status : error instanceof Error && error.message.includes("Ollama") ? 500 : 400;
    finalizeSearchTelemetry({
      endpoint: ENDPOINT,
      searchKind: "freeform",
      query,
      status,
      resultCount: null,
      startedAt,
      errorMessage: error instanceof Error ? error.message : String(error)
    });

    if (error instanceof ParseSearchError) {
      return NextResponse.json(
        {
          error: error.message,
          ...error.details
        },
        { status: error.status }
      );
    }

    const message = error instanceof Error ? error.message : "Search failed.";
    return NextResponse.json({ error: message }, { status });
  }
}
