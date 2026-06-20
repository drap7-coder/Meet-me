import { buildWatchEventsResult } from "@/lib/watchEvents";
import { resolveWatchPlaceSearchForm } from "@/lib/watchPlaceSearch";
import type { SearchHalfwayRequest, WatchEventsPlacesRedirect } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = typeof body.query === "string" ? body.query.trim() : "";
    if (!query) {
      return NextResponse.json({ error: "Tell Koi what you want to watch or find." }, { status: 400 });
    }

    const placeForm = resolveWatchPlaceSearchForm(query, readLocationContext(body));
    if (placeForm) {
      const locationA = placeForm.locationA.trim();
      const searchMode = placeForm.searchMode ?? "midpoint";
      if (!locationA || (searchMode === "midpoint" && !placeForm.locationB.trim())) {
        return NextResponse.json(
          {
            error:
              "Add a location in classic search below, or include a place in your ask — e.g. sports bar between Hoboken and Edison."
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

    return NextResponse.json(buildWatchEventsResult(query));
  } catch {
    return NextResponse.json({ error: "Watch & Events search failed." }, { status: 400 });
  }
}

function readLocationContext(body: Record<string, unknown>): SearchHalfwayRequest | undefined {
  const form = body.form;
  if (!form || typeof form !== "object" || Array.isArray(form)) return undefined;
  const value = form as Partial<SearchHalfwayRequest>;
  if (!value.locationA && !value.locationB) return undefined;
  return {
    locationA: typeof value.locationA === "string" ? value.locationA : "",
    locationB: typeof value.locationB === "string" ? value.locationB : "",
    locationAPlaceId: typeof value.locationAPlaceId === "string" ? value.locationAPlaceId : undefined,
    locationBPlaceId: typeof value.locationBPlaceId === "string" ? value.locationBPlaceId : undefined,
    locationACoordinates: value.locationACoordinates,
    locationBCoordinates: value.locationBCoordinates,
    category: value.category ?? "coffee",
    searchMode: value.searchMode ?? "midpoint",
    meetupMode: value.meetupMode ?? "single",
    customQuery: typeof value.customQuery === "string" ? value.customQuery : ""
  };
}
