import { logExploreRoutingDecision } from "@/lib/exploreRouting";
import { applyExploreTravelModeRanking, getExploreModeRadiusMultiplier } from "@/lib/exploreModeRanking";
import type { NormalizedExploreIntent } from "@/lib/exploreIntent";
import { openTripMapProvider, type OpenTripMapCategory } from "@/lib/providers/openTripMapProvider";
import type { LatLng, ScoredVenue, SearchHalfwayResponse, VenueCandidate } from "@/lib/types";

const OTM_CATEGORY_BY_SUBCATEGORY: Partial<Record<string, OpenTripMapCategory[]>> = {
  museums: ["museums", "cultural"],
  landmarks: ["historic", "architecture", "interesting_places"],
  public_art: ["cultural", "architecture", "interesting_places"],
  architecture: ["architecture", "historic", "interesting_places"],
  hiking: ["natural"],
  trails: ["natural", "sport", "interesting_places"],
  parks: ["natural"],
  gardens: ["natural"],
  nature_preserves: ["natural"],
  historic_sites: ["historic", "cultural"],
  arcades: ["amusement"],
  mini_golf: ["sport", "amusement"],
  bowling: ["sport"],
  scenic_drives: ["viewpoints", "natural"],
  overlooks: ["viewpoints"],
  waterfront: ["natural", "interesting_places"],
  farmers_markets: ["interesting_places", "cultural", "natural"]
};

function otmCategoriesForIntent(intent: NormalizedExploreIntent): OpenTripMapCategory[] | undefined {
  if (intent.subcategoryId && OTM_CATEGORY_BY_SUBCATEGORY[intent.subcategoryId]) {
    return OTM_CATEGORY_BY_SUBCATEGORY[intent.subcategoryId];
  }
  if (intent.category === "outdoors") return ["natural", "viewpoints", "interesting_places"];
  if (intent.category === "activities") return ["cultural", "amusement", "museums", "interesting_places"];
  return undefined;
}

function openTripMapPlaceToCandidate(
  place: Awaited<ReturnType<typeof openTripMapProvider.discoverNearby>>[number],
  intent: NormalizedExploreIntent
): VenueCandidate {
  return {
    id: `otm:${place.xid}`,
    name: place.name,
    category: intent.venueCategory,
    address: "OpenTripMap place",
    location: { lat: place.lat, lng: place.lng },
    rating: place.rating,
    reviewCount: 0,
    openNow: null,
    googleMapsUri: place.sourceUrl ?? `https://opentripmap.com/en/card/${place.xid}`,
    types: place.kinds
  };
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

/**
 * Supplement a Google Places response with OpenTripMap POIs when the explore
 * routing layer selected OTM. Degrades gracefully when no API key or no results.
 */
export async function supplementExploreWithOpenTripMap(
  response: SearchHalfwayResponse,
  intent: NormalizedExploreIntent,
  origin: LatLng
): Promise<SearchHalfwayResponse> {
  if (!openTripMapProvider.isConfigured()) return response;
  if (intent.mode !== "explore") return response;
  if (!intent.providers.includes("opentripmap")) return response;

  const categories = otmCategoriesForIntent(intent);
  const places = await openTripMapProvider.discoverNearby({
    origin,
    categories,
    radiusMeters: Math.round(5000 * getExploreModeRadiusMultiplier(response.travelMode)),
    limit: 12
  });

  if (!places.length) {
    logExploreRoutingDecision(intent, "opentripmap_no_results");
    return response;
  }

  const supplemental: ScoredVenue[] = places.map((place) => {
    const candidate = openTripMapPlaceToCandidate(place, intent);
    const travelFromA = response.venues[0]?.travelFromA ?? {
      distanceMeters: place.distanceMeters,
      durationMinutes: null,
      status: "OK"
    };
    return {
      ...candidate,
      travelFromA,
      travelFromB: travelFromA,
      fairnessScore: 0.35 + (place.rating ?? 1) * 0.05,
      preferenceScore: 0,
      preferenceMatches: [],
      timeDifferenceMinutes: 0,
      totalTravelMinutes: travelFromA.durationMinutes
    };
  });

  const merged = applyExploreTravelModeRanking(
    dedupeVenues([...response.venues, ...supplemental]),
    response.travelMode,
    {
      query: response.query,
      category: response.category
    }
  )
    .slice(0, 18);

  logExploreRoutingDecision(intent, `opentripmap_merged_${supplemental.length}_places`);

  return {
    ...response,
    venues: merged
  };
}
