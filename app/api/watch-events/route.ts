import { readRequestSearchForm } from "@/lib/apiLocationContext";
import { eventsProvider } from "@/lib/providers/eventsProvider";
import {
  countWatchEventsResults,
  executeInSearchTelemetry,
  finalizeSearchTelemetry
} from "@/lib/searchTelemetry.server";
import { logApiError } from "@/lib/serverLog";
import { isMovieTheaterEventsQuery } from "@/lib/watchEvents";
import { resolveWatchPlaceSearchForm } from "@/lib/watchPlaceSearch";
import type { SearchHalfwayRequest, WatchEventsPlacesRedirect } from "@/lib/types";
import { NextResponse } from "next/server";

const ENDPOINT = "/api/watch-events";

export async function POST(request: Request) {
  const startedAt = Date.now();
  let query = "";

  try {
    const body = await request.json();
    query = typeof body.query === "string" ? body.query.trim() : "";
    if (!query) {
      finalizeSearchTelemetry({
        endpoint: ENDPOINT,
        searchKind: "events",
        query,
        status: 400,
        resultCount: null,
        startedAt,
        errorMessage: "missing_query"
      });
      return NextResponse.json({ error: "Tell Koi what events you want to find." }, { status: 400 });
    }

    const locationContext = readRequestSearchForm(body);
    const placeForm = resolveWatchPlaceSearchForm(query, locationContext);
    if (placeForm && !isMovieTheaterEventsQuery(query)) {
      const locationA = placeForm.locationA.trim();
      const searchMode = placeForm.searchMode ?? "midpoint";
      if (!locationA || (searchMode === "midpoint" && !placeForm.locationB.trim())) {
        finalizeSearchTelemetry({
          endpoint: ENDPOINT,
          searchKind: "events",
          resolvedKind: "places",
          query,
          status: 422,
          resultCount: 0,
          startedAt,
          errorMessage: "missing_location"
        });
        return NextResponse.json(
          {
            error:
              "Add a location in classic search below, or include a place in your ask — e.g. comedy shows near Philly this weekend."
          },
          { status: 422 }
        );
      }

      const response: WatchEventsPlacesRedirect = {
        botMode: "places",
        form: placeForm
      };
      finalizeSearchTelemetry({
        endpoint: ENDPOINT,
        searchKind: "events",
        resolvedKind: "places",
        query,
        status: 200,
        resultCount: 0,
        startedAt
      });
      return NextResponse.json(response);
    }

    const { result, collector } = await executeInSearchTelemetry(() => eventsProvider.search(query, locationContext));
    finalizeSearchTelemetry(
      {
        endpoint: ENDPOINT,
        searchKind: "events",
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
      searchKind: "events",
      query,
      status: 400,
      resultCount: null,
      startedAt,
      errorMessage: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ error: "Events search failed." }, { status: 400 });
  }
}
