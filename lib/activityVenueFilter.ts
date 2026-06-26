import { classifyExploreQuery, type ExploreCategory } from "@/lib/exploreIntent";
import type { VenueCandidate } from "@/lib/types";

export const GENERIC_CIVIC_RECREATION =
  /\b(?:community center|community centre|recreation center|recreation centre|rec center|rec centre|sports activity center|sports activities center|sports complex|athletic center|athletic complex|activity center|youth center|senior center|multipurpose center|multipurpose facility|municipal building|township building|borough hall|city hall|civic center|civic centre)\b/i;

export const GENERIC_CIVIC_RECREATION_TYPES =
  /\b(?:community_center|recreation_center|sports_complex|local_government_office)\b/i;

const SPECIFIC_ACTIVITY_SUBCATEGORIES = new Set([
  "mini_golf",
  "bowling",
  "arcades",
  "escape_rooms",
  "axe_throwing",
  "golf",
  "driving_range",
  "pickleball",
  "batting_cages"
]);

const SPECIFIC_ACTIVITY_QUERY =
  /\b(?:mini golf|miniature golf|putt[- ]?putt|bowling|bowling alley|arcade|escape room|axe throwing|batting cage|pickleball|driving range|golf course)\b/i;

export type ActivityVenueFilterContext = {
  category?: ExploreCategory | null;
  subcategoryId?: string | null;
};

export function venueHaystack(venue: Pick<VenueCandidate, "name" | "category" | "address" | "types">): string {
  return `${venue.name} ${venue.category} ${venue.address ?? ""} ${(venue.types ?? []).join(" ")}`;
}

export function isGenericCivicRecreationVenue(
  venue: Pick<VenueCandidate, "name" | "category" | "address" | "types">
): boolean {
  const haystack = venueHaystack(venue);
  return GENERIC_CIVIC_RECREATION.test(haystack) || GENERIC_CIVIC_RECREATION_TYPES.test(haystack);
}

export function shouldFilterGenericCivicRecreationVenues(
  query: string,
  intent?: ActivityVenueFilterContext | null
): boolean {
  if (intent?.subcategoryId && SPECIFIC_ACTIVITY_SUBCATEGORIES.has(intent.subcategoryId)) return true;

  const classified = classifyExploreQuery(query);
  if (classified?.subcategoryId && SPECIFIC_ACTIVITY_SUBCATEGORIES.has(classified.subcategoryId)) {
    return true;
  }

  return SPECIFIC_ACTIVITY_QUERY.test(query.trim());
}

export function filterGenericCivicRecreationVenues<T extends Pick<VenueCandidate, "name" | "category" | "address" | "types">>(
  venues: T[]
): T[] {
  return venues.filter((venue) => !isGenericCivicRecreationVenue(venue));
}

export function filterActivitySearchVenues<T extends Pick<VenueCandidate, "name" | "category" | "address" | "types">>(
  query: string,
  intent: ActivityVenueFilterContext | null | undefined,
  venues: T[]
): T[] {
  if (!shouldFilterGenericCivicRecreationVenues(query, intent)) return venues;
  return filterGenericCivicRecreationVenues(venues);
}
