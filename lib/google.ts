import { getCategorySearchTerm } from "@/lib/categories";
import { calculateMidpoint, estimateSearchRadiusMeters } from "@/lib/geo";
import { scoreVenue } from "@/lib/scoring";
import type {
  GeocodedLocation,
  LatLng,
  RouteLeg,
  SearchHalfwayRequest,
  SearchHalfwayResponse,
  VenueCandidate
} from "@/lib/types";

const GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const PLACES_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const ROUTE_MATRIX_URL = "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix";

function getGoogleMapsKey() {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    throw new Error("GOOGLE_MAPS_API_KEY is not configured.");
  }
  return key;
}

export async function geocodeAddress(input: string): Promise<GeocodedLocation> {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Location is required.");

  const url = new URL(GEOCODING_URL);
  url.searchParams.set("address", trimmed);
  url.searchParams.set("key", getGoogleMapsKey());

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Geocoding failed with ${response.status}.`);

  const data = await response.json();
  if (data.status !== "OK" || !data.results?.[0]) {
    throw new Error(`Could not geocode "${trimmed}".`);
  }

  const result = data.results[0];
  return {
    input: trimmed,
    formattedAddress: result.formatted_address,
    location: {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng
    },
    placeId: result.place_id
  };
}

export async function searchPlacesNearMidpoint(params: {
  midpoint: LatLng;
  category: SearchHalfwayRequest["category"];
  customQuery?: string;
  radiusMeters: number;
}): Promise<VenueCandidate[]> {
  const query = getCategorySearchTerm(params.category, params.customQuery);
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
        "places.currentOpeningHours.openNow",
        "places.googleMapsUri",
        "places.websiteUri",
        "places.types"
      ].join(",")
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: 16,
      locationBias: {
        circle: {
          center: {
            latitude: params.midpoint.lat,
            longitude: params.midpoint.lng
          },
          radius: params.radiusMeters
        }
      }
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Places search failed with ${response.status}: ${body.slice(0, 180)}`);
  }

  const data = await response.json();
  return (data.places ?? [])
    .filter((place: any) => place.location?.latitude && place.location?.longitude)
    .map((place: any) => ({
      id: place.id,
      name: place.displayName?.text ?? "Unnamed place",
      category: humanizeType(place.types?.[0]) || getCategorySearchTerm(params.category, params.customQuery),
      address: place.formattedAddress ?? "Address unavailable",
      location: {
        lat: place.location.latitude,
        lng: place.location.longitude
      },
      rating: typeof place.rating === "number" ? place.rating : null,
      reviewCount: typeof place.userRatingCount === "number" ? place.userRatingCount : 0,
      openNow: typeof place.currentOpeningHours?.openNow === "boolean" ? place.currentOpeningHours.openNow : null,
      googleMapsUri: place.googleMapsUri ?? buildGoogleMapsSearchLink(place.displayName?.text, place.formattedAddress),
      websiteUri: place.websiteUri
    }));
}

export async function computeRouteMatrix(params: {
  origins: LatLng[];
  destinations: LatLng[];
}): Promise<RouteLeg[][]> {
  if (params.origins.length === 0 || params.destinations.length === 0) return [];

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
  const [originA, originB] = await Promise.all([
    geocodeAddress(request.locationA),
    geocodeAddress(request.locationB)
  ]);

  const midpoint = calculateMidpoint(originA.location, originB.location);
  const radiusMeters = estimateSearchRadiusMeters(originA.location, originB.location);
  const venues = await searchPlacesNearMidpoint({
    midpoint,
    category: request.category,
    customQuery: request.customQuery,
    radiusMeters
  });

  if (venues.length === 0) {
    return {
      originA,
      originB,
      midpoint,
      category: request.category,
      query: getCategorySearchTerm(request.category, request.customQuery),
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
      })
    )
    .sort((a, b) => b.fairnessScore - a.fairnessScore);

  return {
    originA,
    originB,
    midpoint,
    category: request.category,
    query: getCategorySearchTerm(request.category, request.customQuery),
    venues: scoredVenues
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
