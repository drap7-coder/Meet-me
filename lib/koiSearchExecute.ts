import { effectiveTravelModeForQuery } from "@/lib/evSearchIntent";
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
import {
  detectLocalHappeningsSubcategory,
  resolveLocalHappeningsPlacesSearch
} from "@/lib/localHappenings";
import { classifyLocalEventProfile, isPureEventQuery, isTeamSpecificSportsQuery } from "@/lib/localEventIntent";
import { logApiError } from "@/lib/serverLog";
import { isStreamingServiceId } from "@/lib/streamingServices";
import type { CurrentLocationContext } from "@/lib/currentLocation";
import type { GeocodedLocation, SearchHalfwayRequest, SearchHalfwayResponse, WatchSubcategory } from "@/lib/types";
import { hasStreamingWatchContext, isMovieTheaterEventsQuery } from "@/lib/watchEvents";
import { resolveWatchPlaceSearchForm } from "@/lib/watchPlaceSearch";
import type { KoiSearchApiResponse } from "@/lib/searchIntent";
import { discoverOpenTripMapExploreVenues, supplementExploreWithOpenTripMap } from "@/lib/exploreSearch";
import {
  exploreIntentFromPayload,
  shouldRouteExploreToTicketmaster,
  shouldSupplementWithOpenTripMap,
  shouldUseTimeAwareExplorePath,
  shouldUseOpenTripMapExplorePath
} from "@/lib/exploreRouting";
import type { ExploreIntentPayload, NormalizedExploreIntent } from "@/lib/exploreIntent";
import {
  enoughTimeAwareCoverage,
  rankTemporalVenues,
  withTemporalExploreResults
} from "@/lib/timeAwareExplore";

export class EventLocationRequiredError extends Error {
  constructor(message = "Add your location to search nearby.") {
    super(message);
    this.name = "EventLocationRequiredError";
  }
}

function isLocationResolutionFailure(error: unknown): boolean {
  if (error instanceof EventLocationRequiredError) return true;
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("geocod") ||
    message.includes("location") ||
    message.includes("address") ||
    message.includes("enter a location")
  );
}

function needsLocationResponse(botMode: "places" | "events" = "events", error?: string): KoiSearchApiResponse {
  return {
    kind: "needs_location",
    botMode,
    error: error ?? "Add your location to search nearby."
  };
}

type ExecuteInput = {
  query: string;
  context?: unknown;
  form?: unknown;
  watchSubcategory?: WatchSubcategory;
  streamingServiceIds?: string[];
  exploreIntent?: ExploreIntentPayload;
};

export type { ExecuteInput };

async function withExploreEnrichment(
  response: SearchHalfwayResponse,
  intent: NormalizedExploreIntent
): Promise<SearchHalfwayResponse> {
  if (!shouldSupplementWithOpenTripMap(intent)) return response;
  return supplementExploreWithOpenTripMap(response, intent, response.originA.location);
}

async function executeOpenTripMapExploreSearch(
  query: string,
  exploreIntent: NormalizedExploreIntent,
  locationContext: SearchHalfwayRequest,
  parseContext: CurrentLocationContext | undefined,
  travelMode: SearchHalfwayRequest["travelMode"]
): Promise<KoiSearchApiResponse | null> {
  const localSubcategory = exploreIntent.subcategoryId === "farmers_markets" ? "farmers_markets" : null;
  const localPlacesSearch = localSubcategory
    ? resolveLocalHappeningsPlacesSearch(localSubcategory)
    : null;

  let searchForm: SearchHalfwayRequest = {
    ...locationContext,
    travelMode,
    category: normalizeCategory(localPlacesSearch?.category ?? exploreIntent.venueCategory),
    customQuery: localPlacesSearch?.customQuery ?? query,
    searchMode: locationContext.searchMode ?? "single"
  };

  try {
    const parsed = await parserProvider.parseSearch({
      query,
      context: parseContext,
      form: locationContext
    });
    if (parsed.botMode !== "watch" && "form" in parsed && parsed.form) {
      searchForm = {
        ...parsed.form,
        travelMode,
        category: normalizeCategory(exploreIntent.venueCategory),
        customQuery: query,
        searchMode: parsed.form.searchMode ?? searchForm.searchMode
      };
    }
  } catch {
    // Parser optional — fall back to location context + inferred category.
  }

  const resolvedForm = resolveCurrentLocationInForm(searchForm, parseContext);
  if (needsCurrentLocationResolution(resolvedForm)) {
    return {
      kind: "needs_location",
      botMode: "places",
      form: resolvedForm,
      error: "Add your city, ZIP code, or address to search nearby."
    };
  }

  const placesResponse = await googlePlacesProvider.searchHalfway({
    ...resolvedForm,
    travelMode,
    insightQuery: query,
    category: normalizeCategory(exploreIntent.venueCategory)
  });

  return {
    kind: "places",
    data: await withExploreEnrichment(
      await enrichPlacesResponseWithEvents(placesResponse, query, resolvedForm),
      exploreIntent
    )
  };
}

async function executeTimeAwareExploreSearch(
  query: string,
  exploreIntent: NormalizedExploreIntent,
  locationContext: SearchHalfwayRequest,
  parseContext: CurrentLocationContext | undefined,
  travelMode: SearchHalfwayRequest["travelMode"]
): Promise<KoiSearchApiResponse | null> {
  const eventForm = resolveEventSearchForm(query, locationContext, parseContext);
  if (!eventSearchLocationReady(eventForm)) {
    return needsLocationResponse("events");
  }

  let origin: GeocodedLocation;
  try {
    origin = await resolveEventOrigin(eventForm);
  } catch (error) {
    logApiError("time-aware-origin-resolve", error);
    throw error instanceof EventLocationRequiredError
      ? error
      : new EventLocationRequiredError("Add your location to search nearby.");
  }

  const profile = classifyLocalEventProfile(query);
  let events: Awaited<ReturnType<typeof searchLocalEvents>> = [];
  try {
    events = await searchLocalEvents({
      query,
      latitude: origin.location.lat,
      longitude: origin.location.lng,
      profile,
      resultCap: 12
    });
  } catch (error) {
    logApiError("time-aware-events-search", error);
    events = [];
  }

  const otmVenues = await discoverOpenTripMapExploreVenues(exploreIntent, origin.location, travelMode, {
    limit: 12,
    radiusMeters: 12_000
  });

  let fallbackResponse: SearchHalfwayResponse | null = null;
  if (!enoughTimeAwareCoverage(events, otmVenues)) {
    const fallbackForm: SearchHalfwayRequest = {
      ...eventForm,
      travelMode,
      category: normalizeCategory(exploreIntent.venueCategory),
      customQuery: query,
      searchMode: eventForm.searchMode ?? "single"
    };
    try {
      fallbackResponse = await googlePlacesProvider.searchHalfway({
        ...fallbackForm,
        insightQuery: query
      });
    } catch (error) {
      logApiError("time-aware-places-fallback", error);
    }
  }

  const fallbackVenues = fallbackResponse?.venues ?? [];
  const venues = rankTemporalVenues([
    ...otmVenues.map((venue) => ({ venue, source: "opentripmap" as const })),
    ...fallbackVenues.map((venue) => ({ venue, source: "google_places" as const }))
  ]);

  const response: SearchHalfwayResponse = fallbackResponse ?? {
    originA: origin,
    originB: origin,
    midpoint: origin.location,
    category: normalizeCategory(exploreIntent.venueCategory),
    searchMode: "single",
    meetupMode: "single",
    preferences: eventForm.preferences ?? [],
    travelMode,
    query,
    venues: [],
    eventProfile: profile
  };

  return {
    kind: "places",
    data: withTemporalExploreResults({ ...response, eventProfile: profile }, events, venues)
  };
}

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
  // "Getting Around" context — applied to every Places form so ranking + EV
  // enrichment stay consistent regardless of which path resolves the search.
  const exploreIntent = exploreIntentFromPayload(query, input.exploreIntent);
  const baseTravelMode = locationContext.travelMode ?? parseContext?.travelMode ?? "auto";
  const travelMode = effectiveTravelModeForQuery(baseTravelMode, query);

  if (hasStreamingWatchContext(query)) {
    return {
      kind: "watch",
      data: await watchProvider.search(query, subcategory, streamingServiceIds)
    };
  }

  // Chip picks like "Concerts near me" must hit Ticketmaster directly — before the
  // parser or watch-place heuristics can send them through Google Places.
  if (isPureEventQuery(query) || shouldRouteExploreToTicketmaster(exploreIntent)) {
    const teamNationwide = isTeamSpecificSportsQuery(query);
    const eventForm = resolveEventSearchForm(query, locationContext, parseContext);

    if (!teamNationwide && !eventSearchLocationReady(eventForm)) {
      return needsLocationResponse("events");
    }

    try {
      return {
        kind: "places",
        data: await buildEventsOnlyResponse(query, eventForm, teamNationwide)
      };
    } catch (error) {
      if (isLocationResolutionFailure(error)) {
        return needsLocationResponse("events", error instanceof Error ? error.message : undefined);
      }
      throw error;
    }
  }

  if (shouldUseTimeAwareExplorePath(exploreIntent)) {
    try {
      const temporalResponse = await executeTimeAwareExploreSearch(
        query,
        exploreIntent,
        locationContext,
        parseContext,
        travelMode
      );
      if (temporalResponse) return temporalResponse;
    } catch (error) {
      if (isLocationResolutionFailure(error)) {
        return needsLocationResponse("events", error instanceof Error ? error.message : undefined);
      }
      throw error;
    }
  }

  if (shouldUseOpenTripMapExplorePath(exploreIntent)) {
    try {
      const otmResponse = await executeOpenTripMapExploreSearch(
        query,
        exploreIntent,
        locationContext,
        parseContext,
        travelMode
      );
      if (otmResponse) return otmResponse;
    } catch (error) {
      if (isLocationResolutionFailure(error)) {
        return needsLocationResponse("places", error instanceof Error ? error.message : undefined);
      }
      logApiError("opentripmap-explore-search", error);
    }
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

    const placeResponse = await googlePlacesProvider.searchHalfway({
      ...resolvedPlaceForm,
      travelMode,
      customQuery: exploreIntent.category ? query : resolvedPlaceForm.customQuery,
      insightQuery: query,
      category: normalizeCategory(
        exploreIntent.category ? exploreIntent.venueCategory : resolvedPlaceForm.category
      )
    });
    return {
      kind: "places",
      data: await withExploreEnrichment(
        await enrichPlacesResponseWithEvents(placeResponse, query, resolvedPlaceForm),
        exploreIntent
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
      return needsLocationResponse("events");
    }

    const localSubcategory = detectLocalHappeningsSubcategory(query);
    const localPlacesSearch = localSubcategory
      ? resolveLocalHappeningsPlacesSearch(localSubcategory)
      : null;
    const blendedForm: SearchHalfwayRequest = {
      ...eventForm,
      travelMode,
      category: localPlacesSearch?.category ?? "activities",
      customQuery: localPlacesSearch?.customQuery ?? query,
      searchMode: eventForm.searchMode ?? "single"
    };

    try {
      return {
        kind: "places",
        data: await enrichPlacesResponseWithEvents(
          await googlePlacesProvider.searchHalfway({
            ...blendedForm,
            category: normalizeCategory(blendedForm.category)
          }),
          query,
          blendedForm
        )
      };
    } catch (error) {
      if (isLocationResolutionFailure(error)) {
        return needsLocationResponse("events", error instanceof Error ? error.message : undefined);
      }
      throw error;
    }
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

  const placesResponse = await googlePlacesProvider.searchHalfway({
    ...resolvedForm,
    travelMode,
    customQuery: exploreIntent.category ? query : resolvedForm.customQuery,
    insightQuery: query,
    category: normalizeCategory(exploreIntent.category ? exploreIntent.venueCategory : resolvedForm.category)
  });

  return {
    kind: "places",
    data: await withExploreEnrichment(
      await enrichPlacesResponseWithEvents(placesResponse, query, resolvedForm),
      exploreIntent
    )
  };
}

/**
 * Build an event-only response without calling Google Places or Google Routes.
 * Exported for search-halfway fast-path when chip queries still hit that route.
 */
export async function searchEventsOnly(query: string, form: SearchHalfwayRequest): Promise<SearchHalfwayResponse> {
  return buildEventsOnlyResponse(query, form, isTeamSpecificSportsQuery(query));
}

async function buildEventsOnlyResponse(
  query: string,
  form: SearchHalfwayRequest,
  allowGenericOriginFallback = false
): Promise<SearchHalfwayResponse> {
  const profile = classifyLocalEventProfile(query);
  let origin: GeocodedLocation;

  try {
    origin = await resolveEventOrigin(form, allowGenericOriginFallback);
  } catch (error) {
    logApiError("events-origin-resolve", error);
    throw error instanceof EventLocationRequiredError
      ? error
      : new EventLocationRequiredError("Add your location to search nearby.");
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
    travelMode: form.travelMode ?? "auto",
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

async function resolveEventOrigin(
  form: SearchHalfwayRequest,
  allowGenericOriginFallback = false
): Promise<GeocodedLocation> {
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

  // Nationwide team/event searches don't need a real origin for Ticketmaster.
  if (allowGenericOriginFallback) {
    return {
      input: "United States",
      formattedAddress: "United States",
      location: { lat: 39.8283, lng: -98.5795 }
    };
  }

  throw new EventLocationRequiredError();
}

function parseSubcategory(value: unknown): WatchSubcategory | undefined {
  if (value === "movies" || value === "tv_shows" || value === "trending") return value;
  return undefined;
}

function parseStreamingServiceIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is string => typeof id === "string" && isStreamingServiceId(id));
}
