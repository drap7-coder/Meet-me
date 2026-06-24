import { normalizeCategory } from "@/lib/categories";
import { readRequestLocationContext, readRequestSearchForm } from "@/lib/apiLocationContext";
import {
  eventSearchLocationReady,
  isCurrentLocationReference,
  looksLikeCurrentLocationQuery,
  needsCurrentLocationResolution,
  resolveCurrentLocationInForm
} from "@/lib/currentLocation";
import { enrichPlacesResponseWithEvents } from "@/lib/placesWithEvents";
import { ParseSearchError, parserProvider } from "@/lib/providers/parserProvider";
import { googlePlacesProvider } from "@/lib/providers/googlePlacesProvider";
import { watchProvider } from "@/lib/providers/watchProvider";
import { searchLocalEvents } from "@/lib/eventDiscovery";
import { classifyLocalEventProfile, isPureEventQuery, isTeamSpecificSportsQuery } from "@/lib/localEventIntent";
import { logApiError } from "@/lib/serverLog";
import { isStreamingServiceId } from "@/lib/streamingServices";
import type { CurrentLocationContext } from "@/lib/currentLocation";
import type { GeocodedLocation, SearchHalfwayRequest, SearchHalfwayResponse, WatchSubcategory } from "@/lib/types";
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

export type { ExecuteInput };

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

  // Chip picks like "Concerts near me" must hit Ticketmaster directly — before the
  // parser or watch-place heuristics can send them through Google Places.
  if (isPureEventQuery(query)) {
    const teamNationwide = isTeamSpecificSportsQuery(query);
    const eventForm = resolveEventSearchForm(query, locationContext, parseContext);

    if (!teamNationwide && !eventSearchLocationReady(eventForm)) {
      return {
        kind: "needs_location",
        botMode: "events",
        error: "Add your location to search nearby."
      };
    }

    return {
      kind: "places",
      data: await buildEventsOnlyResponse(query, eventForm)
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
      data: await enrichPlacesResponseWithEvents(
        await googlePlacesProvider.searchHalfway({
          ...resolvedPlaceForm,
          category: normalizeCategory(resolvedPlaceForm.category)
        }),
        query,
        resolvedPlaceForm
      )
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
    const teamNationwide = isTeamSpecificSportsQuery(query);
    const eventForm = resolveEventSearchForm(query, locationContext, parseContext);

    // Named-team picks ("Yankees games") are nationwide — never block on location.
    if (!teamNationwide && !eventSearchLocationReady(eventForm)) {
      return {
        kind: "needs_location",
        botMode: "events",
        error: "Add your location to search nearby."
      };
    }

    const blendedForm: SearchHalfwayRequest = {
      ...eventForm,
      category: "activities",
      customQuery: query,
      searchMode: eventForm.searchMode ?? "single"
    };

    return {
      kind: "places",
      data: await enrichPlacesResponseWithEvents(
        await googlePlacesProvider.searchHalfway({
          ...blendedForm,
          category: normalizeCategory("activities")
        }),
        query,
        blendedForm
      )
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
    data: await enrichPlacesResponseWithEvents(
      await googlePlacesProvider.searchHalfway({
        ...resolvedForm,
        category: normalizeCategory(resolvedForm.category)
      }),
      query,
      resolvedForm
    )
  };
}

/**
 * Build an event-only response without calling Google Places or Google Routes.
 * Exported for search-halfway fast-path when chip queries still hit that route.
 */
export async function searchEventsOnly(query: string, form: SearchHalfwayRequest): Promise<SearchHalfwayResponse> {
  return buildEventsOnlyResponse(query, form);
}

/**
 * Build an event-only response without calling Google Places or Google Routes.
 * Origin coordinates are taken from known/saved coordinates when available, and
 * otherwise resolved with a single (cheap) geocode call as a fallback.
 */
async function buildEventsOnlyResponse(
  query: string,
  form: SearchHalfwayRequest
): Promise<SearchHalfwayResponse> {
  const profile = classifyLocalEventProfile(query);
  let origin: GeocodedLocation;

  try {
    origin = await resolveEventOrigin(form);
  } catch (error) {
    logApiError("events-origin-resolve", error);
    const label = form.locationA.trim() || "Current location";
    const unresolved = { input: label, formattedAddress: label, location: { lat: 0, lng: 0 } };
    return {
      originA: unresolved,
      originB: unresolved,
      midpoint: { lat: 0, lng: 0 },
      category: "events",
      searchMode: "single",
      meetupMode: "single",
      preferences: form.preferences ?? [],
      query,
      venues: [],
      eventProfile: profile
    };
  }

  let events: Awaited<ReturnType<typeof searchLocalEvents>> = [];
  try {
    events = await searchLocalEvents({
      query,
      latitude: origin.location.lat,
      longitude: origin.location.lng,
      profile
    });
  } catch (error) {
    // Graceful degradation: event provider failures should not break the search.
    logApiError("events-only-search", error);
    events = [];
  }

  return {
    originA: origin,
    originB: origin,
    midpoint: origin.location,
    category: "events",
    searchMode: "single",
    meetupMode: "single",
    preferences: form.preferences ?? [],
    query,
    venues: [],
    ...(events.length ? { events, eventProfile: profile } : { eventProfile: profile })
  };
}

/**
 * Merge saved/current location into the search form. For "near me" asks, set locationA
 * to "me" first so resolveCurrentLocationInForm can attach browser coordinates.
 */
export function resolveEventSearchForm(
  query: string,
  locationContext: SearchHalfwayRequest,
  parseContext?: CurrentLocationContext
): SearchHalfwayRequest {
  let eventForm = { ...locationContext };

  if (looksLikeCurrentLocationQuery(query)) {
    if (parseContext?.locationACoordinates) {
      eventForm = { ...eventForm, locationA: "me", searchMode: "single" };
    } else {
      const savedCity =
        (typeof parseContext?.locationA === "string" ? parseContext.locationA.trim() : "") ||
        eventForm.locationA.trim();
      if (savedCity && !isCurrentLocationReference(savedCity)) {
        eventForm = {
          ...eventForm,
          locationA: savedCity,
          locationAPlaceId: eventForm.locationAPlaceId ?? parseContext?.locationAPlaceId,
          searchMode: "single"
        };
      } else {
        eventForm = { ...eventForm, locationA: "me", searchMode: "single" };
      }
    }
  } else if (!eventForm.locationACoordinates && parseContext?.locationACoordinates) {
    const contextLabel = typeof parseContext.locationA === "string" ? parseContext.locationA.trim() : "";
    eventForm = {
      ...eventForm,
      locationA: eventForm.locationA.trim() || contextLabel || "Current location",
      locationAPlaceId: eventForm.locationAPlaceId ?? parseContext.locationAPlaceId,
      locationACoordinates: parseContext.locationACoordinates,
      searchMode: eventForm.searchMode ?? "single"
    };
  }

  return resolveCurrentLocationInForm(eventForm, parseContext);
}

async function resolveEventOrigin(form: SearchHalfwayRequest): Promise<GeocodedLocation> {
  // Cheapest path first: use coordinates we already have (current location / saved origin).
  if (form.locationACoordinates) {
    const label = form.locationA.trim() || "Current location";
    return {
      input: label,
      formattedAddress: label,
      location: form.locationACoordinates,
      placeId: form.locationAPlaceId
    };
  }

  const address = form.locationA.trim();
  if (address && !isCurrentLocationReference(address)) {
    // Fallback: a single geocode call (no Places, no Routes).
    return googlePlacesProvider.geocodeAddress(address, form.locationAPlaceId);
  }

  // Nationwide team/event searches don't need a real origin for Ticketmaster. Use a
  // neutral US centroid so distance math still works when venue coords are present.
  return {
    input: "United States",
    formattedAddress: "United States",
    location: { lat: 39.8283, lng: -98.5795 }
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
