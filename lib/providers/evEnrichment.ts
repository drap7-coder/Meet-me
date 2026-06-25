import type { LatLng, ScoredVenue, TravelMode, VenueCategory } from "@/lib/types";
import { effectiveTravelModeForQuery } from "@/lib/evSearchIntent";

/**
 * Context passed to EV enrichment. Mirrors the search context so a future
 * provider (e.g. Open Charge Map) can decide what charging data to attach.
 */
export interface EvEnrichmentContext {
  travelMode: TravelMode;
  origin: LatLng | null;
  query: string;
  category: VenueCategory;
}

/**
 * Pluggable extension point for EV charging enrichment.
 *
 * The default implementation returns results unchanged. The Open Charge Map
 * implementation lives in `openChargeMapEnrichment.ts` and is registered on the
 * server search path; it self-gates on OPENCHARGEMAP_API_KEY, so it stays a
 * no-op until the key is configured — no UI or search-flow changes required.
 */
export interface EvEnrichmentProvider {
  readonly id: string;
  enrich(venues: ScoredVenue[], context: EvEnrichmentContext): Promise<ScoredVenue[]>;
}

export const defaultEvEnrichmentProvider: EvEnrichmentProvider = {
  id: "noop",
  async enrich(venues) {
    // No EV data source wired yet — pass results through untouched.
    return venues;
  }
};

let activeProvider: EvEnrichmentProvider = defaultEvEnrichmentProvider;

export function getEvEnrichmentProvider(): EvEnrichmentProvider {
  return activeProvider;
}

export function setEvEnrichmentProvider(provider: EvEnrichmentProvider) {
  activeProvider = provider;
}

export function resetEvEnrichmentProvider() {
  activeProvider = defaultEvEnrichmentProvider;
}

/**
 * Run EV enrichment when the user is in EV travel mode or explicitly asked for
 * charging in their query (e.g. "restaurant with EV charging").
 */
export async function applyEvEnrichment(
  venues: ScoredVenue[],
  context: EvEnrichmentContext
): Promise<ScoredVenue[]> {
  if (effectiveTravelModeForQuery(context.travelMode, context.query) !== "ev") return venues;
  return getEvEnrichmentProvider().enrich(venues, context);
}
