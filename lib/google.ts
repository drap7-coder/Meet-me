import { filterGenericCivicRecreationVenues } from "@/lib/activityVenueFilter";
import { finalizeSearchVenues } from "@/lib/strictIntentFilters";
import { DEFAULT_MEETUP_MODE, DEFAULT_SEARCH_MODE, getCategorySearchTerm, getCategorySearchTerms } from "@/lib/categories";
import {
  geocodeCacheKeyForAddress,
  geocodeCacheKeyForLatLng,
  withGeocodeCache
} from "@/lib/geocodeCache";
import { calculateMidpoint, estimateSearchRadiusMeters } from "@/lib/geo";
import { effectiveTravelModeForQuery, placesSearchQuery, sortVenuesForEvIntent } from "@/lib/evSearchIntent";
import { isGenericNearTarget } from "@/lib/nearFeatureQuery";
import {
  applyExploreTravelModeRanking,
  getExploreModeQueryHints,
  getExploreModeRadiusMultiplier
} from "@/lib/exploreModeRanking";
import { applyPlaceInsight } from "@/lib/placeInsight";
import { applyEvEnrichment, setEvEnrichmentProvider } from "@/lib/providers/evEnrichment";
import { openChargeMapEnrichmentProvider } from "@/lib/providers/openChargeMapEnrichment";
import { scoreVenue } from "@/lib/scoring";
import { recordProviderCall } from "@/lib/searchTelemetryRuntime";
import type {
  GeocodedLocation,
  LatLng,
  RouteLeg,
  SearchHalfwayRequest,
  SearchHalfwayResponse,
  VenueCandidate,
  PlaceSuggestion
} from "@/lib/types";

const GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const PLACES_AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";
const PLACES_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const ROUTE_MATRIX_URL = "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix";
const MAX_PLACES_RADIUS_METERS = 50_000;

// Activate Open Charge Map enrichment for EV travel mode. The provider self-gates
// on OPENCHARGEMAP_API_KEY, so this stays a no-op until the key is configured.
setEvEnrichmentProvider(openChargeMapEnrichmentProvider);

function getGoogleMapsKey() {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    throw new Error("GOOGLE_MAPS_API_KEY is not configured.");
  }
  return key;
}

export async function geocodeAddress(input: string, placeId?: string): Promise<GeocodedLocation> {
  const trimmed = input.trim();
  if (!trimmed && !placeId?.trim()) throw new Error("Location is required.");

  const cacheKey = geocodeCacheKeyForAddress(trimmed || placeId || "", placeId);
  return withGeocodeCache(cacheKey, async () => {
    const url = new URL(GEOCODING_URL);
    if (placeId) {
      url.searchParams.set("place_id", placeId);
    } else {
      url.searchParams.set("address", trimmed);
    }
    url.searchParams.set("key", getGoogleMapsKey());

    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Geocoding failed with ${response.status}.`);

    const data = await response.json();
    if (data.status !== "OK" || !data.results?.[0]) {
      const detail = typeof data.error_message === "string" ? ` ${data.error_message}` : "";
      throw new Error(`Could not geocode "${trimmed || placeId}".${detail}`);
    }

    const result = data.results[0];
    return {
      input: trimmed || result.formatted_address,
      formattedAddress: result.formatted_address,
      location: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng
      },
      placeId: result.place_id
    };
  });
}

export async function reverseGeocodeLocation(location: LatLng, input = "Current location"): Promise<GeocodedLocation> {
  const cacheKey = geocodeCacheKeyForLatLng(location);
  return withGeocodeCache(cacheKey, async () => {
    const url = new URL(GEOCODING_URL);
    url.searchParams.set("latlng", `${location.lat},${location.lng}`);
    url.searchParams.set("key", getGoogleMapsKey());

    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Reverse geocoding failed with ${response.status}.`);

    const data = await response.json();
    if (data.status !== "OK" || !data.results?.[0]) {
      const detail = typeof data.error_message === "string" ? ` ${data.error_message}` : "";
      throw new Error(`Could not reverse geocode current location.${detail}`);
    }

    const result = data.results[0];
    return {
      input,
      formattedAddress: result.formatted_address,
      location,
      placeId: result.place_id
    };
  });
}

function resolveRequestLocation(input: string, placeId: string | undefined, coordinates: LatLng | undefined) {
  if (coordinates) return reverseGeocodeLocation(coordinates, input.trim() || "Current location");
  const trimmed = input.trim();
  if (isGenericNearTarget(trimmed)) {
    throw new Error("Add your location to search near that kind of place.");
  }
  return geocodeAddress(input, placeId);
}

export async function autocompleteLocations(input: string): Promise<PlaceSuggestion[]> {
  const trimmed = input.trim();
  if (trimmed.length < 2) return [];

  const response = await fetch(PLACES_AUTOCOMPLETE_URL, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": getGoogleMapsKey(),
      "X-Goog-FieldMask": [
        "suggestions.placePrediction.placeId",
        "suggestions.placePrediction.text",
        "suggestions.placePrediction.structuredFormat"
      ].join(",")
    },
    body: JSON.stringify({
      input: trimmed,
      includedRegionCodes: ["us"],
      includeQueryPredictions: false,
      languageCode: "en"
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Location autocomplete failed with ${response.status}: ${body.slice(0, 180)}`);
  }

  const data = await response.json();
  return (data.suggestions ?? [])
    .map((suggestion: any) => suggestion.placePrediction)
    .filter((prediction: any) => prediction?.placeId && prediction?.text?.text)
    .slice(0, 5)
    .map((prediction: any) => ({
      placeId: prediction.placeId,
      text: prediction.text.text,
      mainText: prediction.structuredFormat?.mainText?.text ?? prediction.text.text,
      secondaryText: prediction.structuredFormat?.secondaryText?.text ?? ""
    }));
}

export async function searchPlacesNearMidpoint(params: {
  midpoint: LatLng;
  category: SearchHalfwayRequest["category"];
  meetupMode?: SearchHalfwayRequest["meetupMode"];
  customQuery?: string;
  radiusMeters: number;
  travelMode?: SearchHalfwayRequest["travelMode"];
}): Promise<VenueCandidate[]> {
  const meetupMode = params.meetupMode ?? DEFAULT_MEETUP_MODE;
  const queries = searchQueriesForTravelMode(params.category, params.customQuery, meetupMode, params.travelMode);
  const includedTypes = getIncludedPlaceTypes(params.category);
  const placesById = new Map<string, VenueCandidate>();

  await Promise.all(
    queries.map(async (query, index) => {
      const places = await searchPlacesForQuery({
        midpoint: params.midpoint,
        query,
        radiusMeters: params.radiusMeters,
        includedType: includedTypes[index] ?? includedTypes[0]
      });

      for (const place of places) {
        if (!placesById.has(place.id)) placesById.set(place.id, place);
      }
    })
  );

  return Array.from(placesById.values()).slice(0, 18);
}

function searchQueriesForTravelMode(
  category: SearchHalfwayRequest["category"],
  customQuery: string | undefined,
  meetupMode: SearchHalfwayRequest["meetupMode"],
  travelMode: SearchHalfwayRequest["travelMode"]
) {
  const base = getCategorySearchTerms(category, customQuery, meetupMode);
  if (!travelMode || travelMode === "auto") return base.slice(0, 4);

  const maxQueries = base.slice(0, 4).length;
  const primary = base[0] ?? "places to meet";
  const hinted = getExploreModeQueryHints(travelMode)
    .map((hint) => `${primary} ${hint}`)
    .filter((query) => query.toLowerCase() !== primary.toLowerCase());

  return uniqueQueries([primary, ...hinted, ...base.slice(1)]).slice(0, maxQueries);
}

function uniqueQueries(queries: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const query of queries) {
    const trimmed = query.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

function radiusForTravelMode(radiusMeters: number, travelMode: SearchHalfwayRequest["travelMode"]) {
  return Math.max(1200, Math.round(radiusMeters * getExploreModeRadiusMultiplier(travelMode)));
}

async function searchPlacesForQuery(params: {
  midpoint: LatLng;
  query: string;
  radiusMeters: number;
  includedType?: string;
}): Promise<VenueCandidate[]> {
  const radiusMeters = Math.min(params.radiusMeters, MAX_PLACES_RADIUS_METERS);
  const body = {
    textQuery: params.query,
    maxResultCount: 16,
    locationBias: {
      circle: {
        center: {
          latitude: params.midpoint.lat,
          longitude: params.midpoint.lng
        },
        radius: radiusMeters
      }
    },
    ...(params.includedType ? { includedType: params.includedType } : {})
  };

  recordProviderCall("google", "places_text_search");
  const response = await fetch(PLACES_TEXT_SEARCH_URL, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": getGoogleMapsKey(),
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.location",
        "places.rating",
        "places.userRatingCount",
        "places.priceLevel",
        "places.currentOpeningHours.openNow",
        "places.googleMapsUri",
        "places.websiteUri",
        "places.types"
      ].join(",")
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    if (params.includedType) {
      return searchPlacesForQuery({
        midpoint: params.midpoint,
        query: params.query,
        radiusMeters
      });
    }
    const body = await response.text();
    throw new Error(`Places search failed with ${response.status}: ${body.slice(0, 180)}`);
  }

  const data = await response.json();
  return (data.places ?? [])
    .filter((place: any) => place.location?.latitude && place.location?.longitude)
    .map((place: any) => ({
      id: place.id,
      name: place.displayName?.text ?? "Unnamed place",
      category: humanizeType(place.types?.[0]) || params.query,
      address: place.formattedAddress ?? "Address unavailable",
      location: {
        lat: place.location.latitude,
        lng: place.location.longitude
      },
      rating: typeof place.rating === "number" ? place.rating : null,
      reviewCount: typeof place.userRatingCount === "number" ? place.userRatingCount : 0,
      priceLevel: typeof place.priceLevel === "string" ? place.priceLevel : undefined,
      openNow: typeof place.currentOpeningHours?.openNow === "boolean" ? place.currentOpeningHours.openNow : null,
      googleMapsUri: place.googleMapsUri ?? buildGoogleMapsSearchLink(place.displayName?.text, place.formattedAddress),
      websiteUri: place.websiteUri,
      types: Array.isArray(place.types) ? place.types : []
    }));
}

function getIncludedPlaceTypes(category: SearchHalfwayRequest["category"]) {
  if (
    [
      "universities",
      "colleges",
      "engineering_stem",
      "business_finance",
      "health_pre_med",
      "liberal_arts",
      "urban_campuses",
      "college_towns"
    ].includes(category)
  ) {
    return ["university", "school", "point_of_interest"];
  }
  if (category === "hotels") return ["lodging"];
  if (category === "restaurant" || category === "brunch") return ["restaurant"];
  if (category === "coffee") return ["cafe"];
  if (category === "park") return ["park"];
  if (category === "museums" || category === "childrens_museums") return ["museum"];
  return [];
}

export async function computeRouteMatrix(params: {
  origins: LatLng[];
  destinations: LatLng[];
}): Promise<RouteLeg[][]> {
  // Places-only: restaurants, bars, coffee, Meet Halfway venue cards.
  // Ticketmaster events use straight-line miles (lib/eventDistance.ts) — never Routes.
  if (params.origins.length === 0 || params.destinations.length === 0) return [];

  recordProviderCall("google", "route_matrix");
  const response = await fetch(ROUTE_MATRIX_URL, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": getGoogleMapsKey(),
      "X-Goog-FieldMask": "originIndex,destinationIndex,status,distanceMeters,duration"
    },
    body: JSON.stringify({
      origins: params.origins.map((location) => waypoint(location)),
      destinations: params.destinations.map((location) => waypoint(location)),
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
      units: "IMPERIAL"
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Route Matrix failed with ${response.status}: ${body.slice(0, 180)}`);
  }

  const matrix = Array.from({ length: params.origins.length }, () =>
    Array.from({ length: params.destinations.length }, () => unavailableLeg())
  );

  const rows = await response.json();
  for (const row of rows) {
    const originIndex = row.originIndex;
    const destinationIndex = row.destinationIndex;
    if (typeof originIndex !== "number" || typeof destinationIndex !== "number") continue;
    matrix[originIndex][destinationIndex] = {
      distanceMeters: typeof row.distanceMeters === "number" ? row.distanceMeters : null,
      durationMinutes: parseDurationMinutes(row.duration),
      status: row.status?.message || row.condition || "OK"
    };
  }

  return matrix;
}

export async function searchHalfway(request: SearchHalfwayRequest): Promise<SearchHalfwayResponse> {
  const preferences = request.preferences ?? [];
  const evQuery = request.insightQuery ?? request.customQuery ?? "";
  const travelMode = effectiveTravelModeForQuery(request.travelMode ?? "auto", evQuery);
  const searchMode = request.searchMode ?? DEFAULT_SEARCH_MODE;
  const meetupMode = request.meetupMode ?? DEFAULT_MEETUP_MODE;
  const placesQuery = placesSearchQuery(request.category, request.customQuery);
  const isSingleLocation = searchMode === "single";
  if (isSingleLocation) {
    const originA = await resolveRequestLocation(request.locationA, request.locationAPlaceId, request.locationACoordinates);
    const center = originA.location;
    const venues = await searchPlacesNearMidpoint({
      midpoint: center,
      category: request.category,
      meetupMode: request.meetupMode,
      customQuery: placesQuery,
      radiusMeters: radiusForTravelMode(24_000, travelMode),
      travelMode
    });

    const routeMatrix = await computeRouteMatrix({
      origins: [originA.location],
      destinations: venues.map((venue) => venue.location)
    });

    const scoredVenues = venues
      .map((venue, index) => {
        const travelFromA = routeMatrix[0]?.[index] ?? unavailableLeg();
        return scoreVenue({
          ...venue,
          travelFromA,
          travelFromB: travelFromA
        }, preferences);
      })
      .sort((a, b) => b.fairnessScore - a.fairnessScore);

    const enrichedVenues = sortVenuesForEvIntent(
      await applyEvEnrichment(scoredVenues, {
        travelMode,
        origin: center,
        query: evQuery,
        category: request.category
      }),
      evQuery,
      travelMode
    );
    const rankedVenues = applyExploreTravelModeRanking(enrichedVenues, travelMode, {
      query: evQuery,
      category: request.category
    });
    const intentQuery = evQuery || request.customQuery?.trim() || placesQuery || "";
    const { venues: finalVenues, strictIntentApplied } = finalizeSearchVenues(
      intentQuery,
      filterGenericCivicRecreationVenues(
        await applyPlaceInsight(rankedVenues, {
          query: evQuery
        })
      )
    );

    return {
      originA,
      originB: originA,
      midpoint: center,
      category: request.category,
      searchMode,
      meetupMode,
      preferences,
      travelMode,
      query: getCategorySearchTerm(request.category, request.customQuery, request.meetupMode),
      venues: finalVenues,
      ...(strictIntentApplied ? { strictIntentApplied } : {})
    };
  }

  const [originA, originB] = await Promise.all([
    resolveRequestLocation(request.locationA, request.locationAPlaceId, request.locationACoordinates),
    resolveRequestLocation(request.locationB, request.locationBPlaceId, request.locationBCoordinates)
  ]);

  const midpoint = calculateMidpoint(originA.location, originB.location);
  const radiusMeters = radiusForTravelMode(estimateSearchRadiusMeters(originA.location, originB.location), travelMode);
  const venues = await searchPlacesNearMidpoint({
    midpoint,
    category: request.category,
    meetupMode: request.meetupMode,
    customQuery: placesQuery,
    radiusMeters,
    travelMode
  });

  if (venues.length === 0) {
    return {
      originA,
      originB,
      midpoint,
      category: request.category,
      searchMode,
      meetupMode,
      preferences,
      travelMode,
      query: getCategorySearchTerm(request.category, request.customQuery, request.meetupMode),
      venues: []
    };
  }

  const routeMatrix = await computeRouteMatrix({
    origins: [originA.location, originB.location],
    destinations: venues.map((venue) => venue.location)
  });

  const scoredVenues = venues
    .map((venue, index) =>
      scoreVenue({
        ...venue,
        travelFromA: routeMatrix[0]?.[index] ?? unavailableLeg(),
        travelFromB: routeMatrix[1]?.[index] ?? unavailableLeg()
      }, preferences)
    )
    .sort((a, b) => b.fairnessScore - a.fairnessScore);

  const enrichedVenues = sortVenuesForEvIntent(
    await applyEvEnrichment(scoredVenues, {
      travelMode,
      origin: midpoint,
      query: evQuery,
      category: request.category
    }),
    evQuery,
    travelMode
  );
  const rankedVenues = applyExploreTravelModeRanking(enrichedVenues, travelMode, {
    query: evQuery,
    category: request.category
  });
  const intentQuery = evQuery || request.customQuery?.trim() || placesQuery || "";
  const { venues: finalVenues, strictIntentApplied } = finalizeSearchVenues(
    intentQuery,
    filterGenericCivicRecreationVenues(
      await applyPlaceInsight(rankedVenues, {
        query: evQuery
      })
    )
  );

  return {
    originA,
    originB,
    midpoint,
    category: request.category,
    searchMode,
    meetupMode,
    preferences,
    travelMode,
    query: getCategorySearchTerm(request.category, request.customQuery, request.meetupMode),
    venues: finalVenues,
    ...(strictIntentApplied ? { strictIntentApplied } : {})
  };
}

function waypoint(location: LatLng) {
  return {
    waypoint: {
      location: {
        latLng: {
          latitude: location.lat,
          longitude: location.lng
        }
      }
    }
  };
}

function parseDurationMinutes(duration: string | undefined) {
  if (!duration) return null;
  const seconds = Number(duration.replace("s", ""));
  if (!Number.isFinite(seconds)) return null;
  return Math.max(1, Math.round(seconds / 60));
}

function unavailableLeg(): RouteLeg {
  return {
    distanceMeters: null,
    durationMinutes: null,
    status: "UNAVAILABLE"
  };
}

function humanizeType(type?: string) {
  if (!type) return "";
  return type
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildGoogleMapsSearchLink(name?: string, address?: string) {
  const query = encodeURIComponent([name, address].filter(Boolean).join(" "));
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
