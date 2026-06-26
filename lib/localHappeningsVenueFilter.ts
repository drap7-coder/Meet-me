import { isFarmersMarketVenue } from "@/lib/farmersMarketDiscovery";
import {
  detectLocalHappeningsSubcategory,
  type LocalHappeningsSubcategory
} from "@/lib/localHappenings";
import type { VenueCandidate } from "@/lib/types";

type LocalHappeningVenue = Pick<VenueCandidate, "name" | "category" | "types">;

const GENERIC_NON_EVENT_VENUE =
  /\b(?:grocery|grocer|supermarket|convenience store|corner store|bodega|deli|pharmacy|mall|shopping center|restaurant|cafe|coffee shop|bar|bank|office|gym|fitness|store)\b/i;
const GENERIC_NON_EVENT_TYPE =
  /\b(?:grocery_or_supermarket|grocery_store|supermarket|convenience_store|pharmacy|store|shopping_mall|restaurant|cafe|bar|gym|bank)\b/i;

const LOCAL_HAPPENING_PATTERNS: Record<Exclude<LocalHappeningsSubcategory, "farmers_markets">, RegExp> = {
  street_fairs: /\b(?:street fair|street festival|block party|community fair|open streets?|avenue fair|neighborhood fair)\b/i,
  festivals: /\b(?:festival|festa|feast|fair|carnival|cultural celebration|italian festival|greek festival|irish festival)\b/i,
  art_walks: /\b(?:art walk|gallery walk|first friday|open studios?|street art|public art|murals?|mural arts?)\b/i,
  flea_markets: /\b(?:flea market|punk rock flea market|swap meet|antique market|vintage market|makers? market)\b/i,
  pop_ups: /\b(?:pop[-\s]?up|temporary market|maker market|craft market|artisan market)\b/i,
  food_drink_events: /\b(?:food festival|food truck|tasting|beer festival|wine festival|brew fest|restaurant week|italian festival)\b/i,
  seasonal_markets: /\b(?:holiday market|christmas market|winter market|summer market|night market|seasonal market)\b/i
};

export function localHappeningsSubcategoryForVenueFilter(
  query: string,
  explicitSubcategory?: string | null
): LocalHappeningsSubcategory | null {
  if (isLocalHappeningsSubcategory(explicitSubcategory)) return explicitSubcategory;
  return detectLocalHappeningsSubcategory(query);
}

export function isLocalHappeningVenue(
  subcategory: LocalHappeningsSubcategory,
  venue: LocalHappeningVenue
): boolean {
  if (subcategory === "farmers_markets") return isFarmersMarketVenue(venue);

  const pattern = LOCAL_HAPPENING_PATTERNS[subcategory];
  const haystack = `${venue.name} ${venue.category} ${(venue.types ?? []).join(" ")}`;

  if (pattern.test(venue.name)) return true;
  if (GENERIC_NON_EVENT_VENUE.test(venue.name) || GENERIC_NON_EVENT_TYPE.test(haystack)) return false;
  return pattern.test(haystack);
}

export function filterLocalHappeningVenues<T extends LocalHappeningVenue>(
  subcategory: LocalHappeningsSubcategory | null,
  venues: T[]
): T[] {
  if (!subcategory) return venues;
  return venues.filter((venue) => isLocalHappeningVenue(subcategory, venue));
}

function isLocalHappeningsSubcategory(value: unknown): value is LocalHappeningsSubcategory {
  return (
    value === "street_fairs" ||
    value === "festivals" ||
    value === "farmers_markets" ||
    value === "art_walks" ||
    value === "flea_markets" ||
    value === "pop_ups" ||
    value === "food_drink_events" ||
    value === "seasonal_markets"
  );
}
