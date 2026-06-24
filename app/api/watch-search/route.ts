import { logApiError } from "@/lib/serverLog";
import { watchProvider } from "@/lib/providers/watchProvider";
import {
  countWatchEventsResults,
  executeInSearchTelemetry,
  finalizeSearchTelemetry
} from "@/lib/searchTelemetry.server";
import { isStreamingServiceId } from "@/lib/streamingServices";
import type { WatchSubcategory } from "@/lib/types";
import { NextResponse } from "next/server";

const ENDPOINT = "/api/watch-search";

export async function POST(request: Request) {
  const startedAt = Date.now();
  let query = "";

  try {
    const body = await request.json();
    query = typeof body.query === "string" ? body.query.trim() : "";
    if (!query) {
      finalizeSearchTelemetry({
        endpoint: ENDPOINT,
        searchKind: "watch",
        query,
        status: 400,
        resultCount: null,
        startedAt,
        errorMessage: "missing_query"
      });
      return NextResponse.json({ error: "Tell Koi what you want to watch." }, { status: 400 });
    }

    const subcategory = parseSubcategory(body.subcategory);
    const streamingServiceIds = parseStreamingServiceIds(body.streamingServiceIds);
    const excludeKeys = parseExcludeKeys(body.excludeKeys);

    const { result, collector } = await executeInSearchTelemetry(async () => {
      if (excludeKeys.length) {
        return watchProvider.more(query, excludeKeys, subcategory, streamingServiceIds);
      }
      return watchProvider.search(query, subcategory, streamingServiceIds);
    });

    finalizeSearchTelemetry(
      {
        endpoint: ENDPOINT,
        searchKind: "watch",
        query,
        status: 200,
        resultCount: countWatchEventsResults(result),
        startedAt
      },
      collector
    );
    return NextResponse.json(result);
  } catch (error) {
    logApiError(ENDPOINT, error);
    finalizeSearchTelemetry({
      endpoint: ENDPOINT,
      searchKind: "watch",
      query,
      status: 400,
      resultCount: null,
      startedAt,
      errorMessage: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ error: "Watch search failed." }, { status: 400 });
  }
}

function parseSubcategory(value: unknown): WatchSubcategory | undefined {
  if (value === "movies" || value === "tv_shows" || value === "trending") {
    return value;
  }
  return undefined;
}

function parseExcludeKeys(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((key): key is string => typeof key === "string" && /^[a-z]+:\d+$/i.test(key));
}

function parseStreamingServiceIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is string => typeof id === "string" && isStreamingServiceId(id));
}
