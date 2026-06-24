import { normalizeCategory } from "@/lib/categories";
import { needsCurrentLocationResolution } from "@/lib/currentLocation";
import { isPureEventQuery, isTeamSpecificSportsQuery } from "@/lib/localEventIntent";
import { searchEventsOnly } from "@/lib/koiSearchExecute";
import { enrichPlacesResponseWithEvents } from "@/lib/placesWithEvents";
import { googlePlacesProvider } from "@/lib/providers/googlePlacesProvider";
import {
  countPlacesResults,
  executeInSearchTelemetry,
  finalizeSearchTelemetry
} from "@/lib/searchTelemetry.server";
import { logApiError } from "@/lib/serverLog";
import type { SearchHalfwayRequest } from "@/lib/types";
import { NextResponse } from "next/server";

const ENDPOINT = "/api/search-halfway";

export async function POST(request: Request) {
  const startedAt = Date.now();
  let categoryHint = "";

  try {
    const body = (await request.json()) as SearchHalfwayRequest;
    categoryHint = typeof body.category === "string" ? body.category : "";
    const searchMode = body.searchMode ?? "midpoint";
    const queryHint = body.customQuery?.trim() || categoryHint;
    if (!body.locationA?.trim()) {
      finalizeSearchTelemetry({
        endpoint: ENDPOINT,
        searchKind: "places",
        categoryHint,
        status: 400,
        resultCount: null,
        startedAt,
        errorMessage: "missing_location"
      });
      return NextResponse.json(
        { error: searchMode === "single" ? "Enter a location." : "Enter both locations." },
        { status: 400 }
      );
    }
    if (searchMode === "midpoint" && !body.locationB?.trim()) {
      finalizeSearchTelemetry({
        endpoint: ENDPOINT,
        searchKind: "places",
        categoryHint,
        status: 400,
        resultCount: null,
        startedAt,
        errorMessage: "missing_location_b"
      });
      return NextResponse.json({ error: "Enter both locations." }, { status: 400 });
    }
    if (body.category === "custom" && !body.customQuery?.trim()) {
      finalizeSearchTelemetry({
        endpoint: ENDPOINT,
        searchKind: "places",
        categoryHint,
        status: 400,
        resultCount: null,
        startedAt,
        errorMessage: "missing_custom_query"
      });
      return NextResponse.json({ error: "Enter a custom search term." }, { status: 400 });
    }

    const searchForm = { ...body, searchMode: body.searchMode ?? "midpoint" };
    const teamNationwide = isTeamSpecificSportsQuery(queryHint);

    // Pure event/sports chip queries should never spin up Google Places first.
    if (isPureEventQuery(queryHint) && (teamNationwide || !needsCurrentLocationResolution(searchForm))) {
      const { result, collector } = await executeInSearchTelemetry(() => searchEventsOnly(queryHint, searchForm));
      finalizeSearchTelemetry(
        {
          endpoint: ENDPOINT,
          searchKind: "places",
          resolvedKind: "events",
          categoryHint,
          query: queryHint,
          status: 200,
          resultCount: result.events?.length ?? 0,
          startedAt,
          topPickPresent: (result.events?.length ?? 0) > 0,
          eventsReturned: result.events?.length ?? 0
        },
        collector
      );
      return NextResponse.json(result);
    }

    const { result, collector } = await executeInSearchTelemetry(async () =>
      enrichPlacesResponseWithEvents(
        await googlePlacesProvider.searchHalfway({ ...body, category: normalizeCategory(body.category) }),
        queryHint,
        body
      )
    );
    finalizeSearchTelemetry(
      {
        endpoint: ENDPOINT,
        searchKind: "places",
        categoryHint,
        status: 200,
        resultCount: (countPlacesResults(result) ?? 0) + (result.events?.length ?? 0),
        startedAt
      },
      collector
    );
    return NextResponse.json(result);
  } catch (error) {
    logApiError(ENDPOINT, error);
    finalizeSearchTelemetry({
      endpoint: ENDPOINT,
      searchKind: "places",
      categoryHint,
      status: 500,
      resultCount: null,
      startedAt,
      errorMessage: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Koi search failed." },
      { status: 500 }
    );
  }
}
