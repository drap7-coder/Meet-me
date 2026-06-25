import { haversineMiles } from "@/lib/geo";
import type { EvEnrichmentContext, EvEnrichmentProvider } from "@/lib/providers/evEnrichment";
import { fetchNearbyChargers, getOpenChargeMapApiKey, type OpenChargeMapPoi } from "@/lib/providers/openChargeMap";
import { logApiError } from "@/lib/serverLog";
import type { ScoredVenue } from "@/lib/types";

const METERS_PER_MILE = 1609.34;
/** Chargers within this radius of a venue count as "at this venue". */
const VENUE_CHARGER_RADIUS_METERS = 1000;
/** Area around the search origin to pull chargers for (one API call per search). */
const SEARCH_RADIUS_KM = 25;
const MAX_CHARGERS = 100;

/**
 * Open Charge Map implementation of the EV enrichment extension point.
 *
 * Self-gating: returns results unchanged when OPENCHARGEMAP_API_KEY is not set,
 * the user is not in EV mode (handled upstream by applyEvEnrichment), there is no
 * origin, or the API call fails. One Open Charge Map call per search; each venue
 * is annotated with nearby charging context computed locally (no per-venue calls).
 */
export const openChargeMapEnrichmentProvider: EvEnrichmentProvider = {
  id: "open-charge-map",
  async enrich(venues: ScoredVenue[], context: EvEnrichmentContext): Promise<ScoredVenue[]> {
    if (!getOpenChargeMapApiKey()) return venues;
    if (!context.origin || venues.length === 0) return venues;

    let chargers: OpenChargeMapPoi[] = [];
    try {
      chargers = await fetchNearbyChargers({
        origin: context.origin,
        radiusKm: SEARCH_RADIUS_KM,
        maxResults: MAX_CHARGERS
      });
    } catch (error) {
      // Graceful degradation: enrichment failures must never break search.
      logApiError("ev-enrichment-open-charge-map", error);
      return venues;
    }

    if (!chargers.length) return venues;

    return venues.map((venue) => annotateVenue(venue, chargers));
  }
};

function annotateVenue(venue: ScoredVenue, chargers: OpenChargeMapPoi[]): ScoredVenue {
  let nearestDistanceMeters: number | null = null;
  let nearestName: string | undefined;
  let nearbyCount = 0;
  let fastChargingAvailable = false;

  for (const charger of chargers) {
    const meters = haversineMiles(venue.location, charger.location) * METERS_PER_MILE;
    if (meters <= VENUE_CHARGER_RADIUS_METERS) {
      nearbyCount += 1;
      if (charger.isFastCharger) fastChargingAvailable = true;
    }
    if (nearestDistanceMeters == null || meters < nearestDistanceMeters) {
      nearestDistanceMeters = meters;
      nearestName = charger.title;
    }
  }

  return {
    ...venue,
    evCharging: {
      nearbyCount,
      nearestDistanceMeters: nearestDistanceMeters == null ? null : Math.round(nearestDistanceMeters),
      nearestName,
      fastChargingAvailable
    }
  };
}
