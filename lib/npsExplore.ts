import {
  haversineMeters,
  npsActivityIdFromSubcategory,
  resolveAmenityForSubcategory,
  stateCodeFromAddress
} from "@/lib/npsExploreCatalog";
import { logExploreRoutingDecision } from "@/lib/exploreRouting";
import { applyExploreTravelModeRanking, getExploreModeRadiusMultiplier } from "@/lib/exploreModeRanking";
import type { NormalizedExploreIntent } from "@/lib/exploreIntent";
import {
  npsProvider,
  type NpsAlert,
  type NpsPark,
  type NpsParkPlace
} from "@/lib/providers/npsProvider";
import type { LatLng, ScoredVenue, SearchHalfwayResponse, VenueNotice } from "@/lib/types";

const DEFAULT_RADIUS_METERS = 120_000;
const MAX_ALERTS_PER_VENUE = 2;

type DiscoverOptions = {
  limit?: number;
  radiusMeters?: number;
  stateCode?: string | null;
  formattedAddress?: string | null;
};

function isNationalParksIntent(intent: NormalizedExploreIntent): boolean {
  return intent.mode === "explore" && intent.providers.includes("national_parks");
}

function alertSeverity(category: string): VenueNotice["severity"] {
  const value = category.toLowerCase();
  if (value.includes("closure") || value.includes("closed")) return "closure";
  if (value.includes("caution") || value.includes("danger") || value.includes("warning")) return "caution";
  return "info";
}

function noticeFromAlert(alert: NpsAlert): VenueNotice {
  const message = alert.description || alert.title;
  return {
    title: alert.title,
    message,
    severity: alertSeverity(alert.category),
    url: alert.url
  };
}

function parkToScoredVenue(
  park: NpsPark,
  intent: NormalizedExploreIntent,
  origin: LatLng,
  distanceMeters: number
): ScoredVenue {
  const travelLeg = {
    distanceMeters: Math.round(distanceMeters),
    durationMinutes: null,
    status: "OK"
  };
  const distancePenalty = Math.min(distanceMeters / 4000, 18);
  return {
    id: `nps:park:${park.parkCode}`,
    name: park.fullName,
    category: intent.venueCategory,
    address: park.states ? `${park.states}` : "Outdoor destination",
    location: { lat: park.lat, lng: park.lng },
    rating: null,
    reviewCount: 0,
    openNow: null,
    googleMapsUri: park.url,
    websiteUri: park.url,
    types: ["outdoor_park", "national_park_unit", park.parkCode],
    travelFromA: travelLeg,
    travelFromB: travelLeg,
    fairnessScore: Math.round(88 - distancePenalty),
    preferenceScore: 0,
    preferenceMatches: [],
    timeDifferenceMinutes: 0,
    totalTravelMinutes: null
  };
}

function placeToScoredVenue(
  place: NpsParkPlace,
  intent: NormalizedExploreIntent,
  origin: LatLng,
  distanceMeters: number
): ScoredVenue | null {
  if (place.lat == null || place.lng == null) return null;
  const travelLeg = {
    distanceMeters: Math.round(distanceMeters),
    durationMinutes: null,
    status: "OK"
  };
  const distancePenalty = Math.min(distanceMeters / 4000, 18);
  return {
    id: `nps:place:${place.id}`,
    name: place.title,
    category: intent.venueCategory,
    address: place.parkName ? `${place.parkName}` : "Outdoor destination",
    location: { lat: place.lat, lng: place.lng },
    rating: null,
    reviewCount: 0,
    openNow: null,
    googleMapsUri: place.url ?? `https://www.nps.gov/${place.parkCode}/`,
    websiteUri: place.url,
    types: [
      "outdoor_place",
      place.amenityName?.toLowerCase().replace(/\s+/g, "_") ?? "outdoor_place",
      place.parkCode
    ],
    travelFromA: travelLeg,
    travelFromB: travelLeg,
    fairnessScore: Math.round(84 - distancePenalty),
    preferenceScore: 0,
    preferenceMatches: [],
    timeDifferenceMinutes: 0,
    totalTravelMinutes: null
  };
}

function withinRadius(origin: LatLng, lat: number, lng: number, radiusMeters: number) {
  return haversineMeters(origin, { lat, lng }) <= radiusMeters;
}

function dedupeVenues(venues: ScoredVenue[]): ScoredVenue[] {
  const seen = new Set<string>();
  const out: ScoredVenue[] = [];
  for (const venue of venues) {
    const key = `${venue.name.toLowerCase()}|${venue.location.lat.toFixed(3)}|${venue.location.lng.toFixed(3)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(venue);
  }
  return out;
}

async function fetchCandidates(
  intent: NormalizedExploreIntent,
  origin: LatLng,
  options: DiscoverOptions
): Promise<ScoredVenue[]> {
  const radiusMeters = options.radiusMeters ?? DEFAULT_RADIUS_METERS;
  const stateCode = options.stateCode ?? stateCodeFromAddress(options.formattedAddress);
  const activityId = npsActivityIdFromSubcategory(intent.subcategoryId);
  const amenity = await resolveAmenityForSubcategory(intent.subcategoryId, intent.query);

  let parks: NpsPark[] = [];
  let places: NpsParkPlace[] = [];

  if (activityId) {
    parks = await npsProvider.getActivityParks(activityId, { stateCode, limit: 60 });
  } else if (amenity) {
    places = await npsProvider.getAmenityPlaces(amenity.id, { stateCode, limit: 60 });
  } else {
    parks = await npsProvider.getParks({
      stateCode,
      q: intent.query.length > 3 ? intent.query : undefined,
      limit: 60
    });

    if (parks.length < 4) {
      const supplementalPlaces = await npsProvider.getPlaces({
        stateCode,
        q: intent.subcategoryId === "hiking" ? "trail" : intent.subcategoryId === "overlooks" ? "overlook" : undefined,
        limit: 30
      });
      places.push(...supplementalPlaces);
    }
  }

  const parkVenues = parks
    .filter((park) => withinRadius(origin, park.lat, park.lng, radiusMeters))
    .map((park) => parkToScoredVenue(park, intent, origin, haversineMeters(origin, park)))
    .sort((left, right) => right.fairnessScore - left.fairnessScore);

  const placeVenues = places
    .filter((place) => place.lat != null && place.lng != null)
    .filter((place) => withinRadius(origin, place.lat!, place.lng!, radiusMeters))
    .map((place) => placeToScoredVenue(place, intent, origin, haversineMeters(origin, { lat: place.lat!, lng: place.lng! })))
    .filter((venue): venue is ScoredVenue => venue !== null)
    .sort((left, right) => right.fairnessScore - left.fairnessScore);

  return dedupeVenues([...placeVenues, ...parkVenues]);
}

function parkCodesForVenue(venue: ScoredVenue): string[] {
  if (venue.id.startsWith("nps:park:")) {
    return [venue.id.slice("nps:park:".length)];
  }
  return (venue.types ?? []).filter((type) => /^[a-z]{4}$/.test(type));
}

async function attachAlerts(venues: ScoredVenue[], stateCode: string | null): Promise<ScoredVenue[]> {
  if (!venues.length) return venues;

  const parkCodes = [...new Set(venues.flatMap((venue) => parkCodesForVenue(venue)))].slice(0, 12);

  const alerts = parkCodes.length
    ? await npsProvider.getAlerts({ parkCode: parkCodes.join(","), limit: 40 })
    : await npsProvider.getAlerts({ stateCode: stateCode ?? undefined, limit: 40 });

  if (!alerts.length) return venues;

  const alertsByPark = new Map<string, NpsAlert[]>();
  for (const alert of alerts) {
    const list = alertsByPark.get(alert.parkCode) ?? [];
    list.push(alert);
    alertsByPark.set(alert.parkCode, list);
  }

  return venues.map((venue) => {
    const codes = (venue.types ?? []).filter((type) => alertsByPark.has(type));
    const matched = codes.flatMap((code) => alertsByPark.get(code) ?? []).slice(0, MAX_ALERTS_PER_VENUE);
    if (!matched.length) return venue;
    return {
      ...venue,
      notices: matched.map((alert) => noticeFromAlert(alert))
    };
  });
}

export async function discoverNationalParkExploreVenues(
  intent: NormalizedExploreIntent,
  origin: LatLng,
  travelMode: SearchHalfwayResponse["travelMode"],
  options: DiscoverOptions = {}
): Promise<ScoredVenue[]> {
  if (!npsProvider.isConfigured()) return [];
  if (!isNationalParksIntent(intent)) return [];

  const radiusMeters = Math.round(
    (options.radiusMeters ?? DEFAULT_RADIUS_METERS) * getExploreModeRadiusMultiplier(travelMode)
  );
  const stateCode = options.stateCode ?? stateCodeFromAddress(options.formattedAddress);

  const candidates = await fetchCandidates(intent, origin, {
    ...options,
    radiusMeters,
    stateCode
  });

  const enriched = await attachAlerts(candidates.slice(0, options.limit ?? 12), stateCode);
  return enriched;
}

export async function supplementExploreWithNationalParks(
  response: SearchHalfwayResponse,
  intent: NormalizedExploreIntent,
  origin: LatLng,
  options: DiscoverOptions = {}
): Promise<SearchHalfwayResponse> {
  if (!npsProvider.isConfigured()) return response;
  if (!isNationalParksIntent(intent)) return response;

  const supplemental = await discoverNationalParkExploreVenues(intent, origin, response.travelMode, {
    ...options,
    formattedAddress: response.originA.formattedAddress
  });

  if (!supplemental.length) {
    logExploreRoutingDecision(intent, "national_parks_no_results");
    return response;
  }

  const merged = applyExploreTravelModeRanking(
    dedupeVenues([...supplemental, ...response.venues]),
    response.travelMode,
    {
      query: response.query,
      category: response.category
    }
  ).slice(0, 18);

  logExploreRoutingDecision(intent, `national_parks_merged_${supplemental.length}_places`);

  return {
    ...response,
    venues: merged
  };
}

export function isNationalParkVenue(venue: ScoredVenue): boolean {
  return venue.id.startsWith("nps:");
}

export function nationalParkVenueSource(venue: ScoredVenue): "national_parks" | null {
  return isNationalParkVenue(venue) ? "national_parks" : null;
}
