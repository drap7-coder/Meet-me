import { executeKoiSearch } from "@/lib/koiSearchExecute";
import { ParseSearchError } from "@/lib/providers/parserProvider";
import {
  countKoiSearchResult,
  executeInSearchTelemetry,
  finalizeSearchTelemetry
} from "@/lib/searchTelemetry.server";
import { logApiError } from "@/lib/serverLog";
import { NextResponse } from "next/server";

const ENDPOINT = "/api/koi-search";

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

    const { result, collector } = await executeInSearchTelemetry(() => executeKoiSearch(body));
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
