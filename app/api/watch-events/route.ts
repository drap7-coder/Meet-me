import { readRequestSearchForm } from "@/lib/apiLocationContext";
import { buildEventsResult } from "@/lib/eventsSearch";
import { logApiError } from "@/lib/serverLog";
import { isMovieTheaterEventsQuery } from "@/lib/watchEvents";
import { resolveWatchPlaceSearchForm } from "@/lib/watchPlaceSearch";
import type { SearchHalfwayRequest, WatchEventsPlacesRedirect } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = typeof body.query === "string" ? body.query.trim() : "";
    if (!query) {
      return NextResponse.json({ error: "Tell Koi what events you want to find." }, { status: 400 });
    }

    const locationContext = readRequestSearchForm(body);
    const placeForm = resolveWatchPlaceSearchForm(query, locationContext);
    if (placeForm && !isMovieTheaterEventsQuery(query)) {
      const locationA = placeForm.locationA.trim();
      const searchMode = placeForm.searchMode ?? "midpoint";
      if (!locationA || (searchMode === "midpoint" && !placeForm.locationB.trim())) {
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
      return NextResponse.json(response);
    }

    return NextResponse.json(await buildEventsResult(query, locationContext));
  } catch (error) {
    logApiError("/api/watch-events", error);
    return NextResponse.json({ error: "Events search failed." }, { status: 400 });
  }
}
