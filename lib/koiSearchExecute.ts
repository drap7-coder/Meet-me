import { normalizeCategory } from "@/lib/categories";
import { readRequestLocationContext, readRequestSearchForm } from "@/lib/apiLocationContext";
import {
  looksLikeCurrentLocationQuery,
  needsCurrentLocationResolution,
  resolveCurrentLocationInForm
} from "@/lib/currentLocation";
import { ParseSearchError, parserProvider } from "@/lib/providers/parserProvider";
import { eventsProvider } from "@/lib/providers/eventsProvider";
import { googlePlacesProvider } from "@/lib/providers/googlePlacesProvider";
import { watchProvider } from "@/lib/providers/watchProvider";
import { isStreamingServiceId } from "@/lib/streamingServices";
import type { SearchHalfwayRequest, WatchSubcategory } from "@/lib/types";
import { hasStreamingWatchContext, isMovieTheaterEventsQuery } from "@/lib/watchEvents";
import { resolveWatchPlaceSearchForm } from "@/lib/watchPlaceSearch";
import type { KoiSearchApiResponse } from "@/lib/searchIntent";

type ExecuteInput = {
  query: string;
  context?: unknown;
  form?: unknown;
  watchSubcategory?: WatchSubcategory;
  streamingServiceIds?: string[];
};

export async function executeKoiSearch(input: ExecuteInput): Promise<KoiSearchApiResponse> {
  const query = input.query.trim();
  if (!query) {
    throw new ParseSearchError("Tell Koi what you are looking for.", 400);
  }

  const locationContext =
    readRequestSearchForm(input) ??
    ({
      locationA: "",
      locationB: "",
      category: "restaurant",
      searchMode: "single",
      meetupMode: "single",
      customQuery: ""
    } satisfies SearchHalfwayRequest);
  const parseContext = readRequestLocationContext(input);
  const subcategory = parseSubcategory(input.watchSubcategory);
  const streamingServiceIds = parseStreamingServiceIds(input.streamingServiceIds);

  if (hasStreamingWatchContext(query)) {
    return {
      kind: "watch",
      data: await watchProvider.search(query, subcategory, streamingServiceIds)
    };
  }

  const placeForm = resolveWatchPlaceSearchForm(query, locationContext);
  if (placeForm && !isMovieTheaterEventsQuery(query)) {
    const resolvedPlaceForm = resolveCurrentLocationInForm(placeForm, parseContext);
    if (needsCurrentLocationResolution(resolvedPlaceForm)) {
      return {
        kind: "needs_location",
        botMode: "places",
        form: resolvedPlaceForm,
        error: "Add your location to search nearby."
      };
    }

    return {
      kind: "places",
      data: await googlePlacesProvider.searchHalfway({
        ...resolvedPlaceForm,
        category: normalizeCategory(resolvedPlaceForm.category)
      })
    };
  }

  const parsed = await parserProvider.parseSearch({
    query,
    context: parseContext,
    form: locationContext
  });

  if (parsed.botMode === "watch") {
    return {
      kind: "watch",
      data: await watchProvider.search(query, subcategory, streamingServiceIds)
    };
  }

  if (parsed.botMode === "events") {
    let eventForm = resolveCurrentLocationInForm(locationContext, parseContext);
    if (looksLikeCurrentLocationQuery(query)) {
      eventForm = { ...eventForm, locationA: "me", searchMode: "single" };
    }

    if (!eventForm.locationA.trim() || needsCurrentLocationResolution(eventForm)) {
      return {
        kind: "needs_location",
        botMode: "events",
        error: "Add your location to search nearby."
      };
    }

    return {
      kind: "events",
      data: await eventsProvider.search(query, eventForm)
    };
  }

  if (!parsed.form) {
    throw new ParseSearchError("I could not understand that search.", 400);
  }

  const resolvedForm = resolveCurrentLocationInForm(parsed.form, parseContext);
  if (needsCurrentLocationResolution(resolvedForm)) {
    return {
      kind: "needs_location",
      botMode: "places",
      form: resolvedForm,
      error: "Add your city, ZIP code, or address to search nearby."
    };
  }

  return {
    kind: "places",
    data: await googlePlacesProvider.searchHalfway({
      ...resolvedForm,
      category: normalizeCategory(resolvedForm.category)
    })
  };
}

function parseSubcategory(value: unknown): WatchSubcategory | undefined {
  if (value === "movies" || value === "tv_shows" || value === "trending") return value;
  return undefined;
}

function parseStreamingServiceIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is string => typeof id === "string" && isStreamingServiceId(id));
}
