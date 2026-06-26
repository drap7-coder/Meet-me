import type { VenueCandidate } from "@/lib/types";

export const GENERIC_CIVIC_RECREATION =
  /\b(?:community center|community centre|recreation center|recreation centre|rec center|rec centre|sports activity center|sports activities center|sports complex|athletic center|athletic complex|activity center|youth center|senior center|multipurpose center|multipurpose facility|municipal building|township building|borough hall|city hall|civic center|civic centre)\b/i;

export const GENERIC_CIVIC_RECREATION_TYPES =
  /\b(?:community_center|recreation_center|sports_complex|local_government_office)\b/i;

export function venueHaystack(venue: Pick<VenueCandidate, "name" | "category" | "address" | "types">): string {
  return `${venue.name} ${venue.category} ${venue.address ?? ""} ${(venue.types ?? []).join(" ")}`;
}

export function isGenericCivicRecreationVenue(
  venue: Pick<VenueCandidate, "name" | "category" | "address" | "types">
): boolean {
  const haystack = venueHaystack(venue);
  return GENERIC_CIVIC_RECREATION.test(haystack) || GENERIC_CIVIC_RECREATION_TYPES.test(haystack);
}

export function filterGenericCivicRecreationVenues<T extends Pick<VenueCandidate, "name" | "category" | "address" | "types">>(
  venues: T[]
): T[] {
  return venues.filter((venue) => !isGenericCivicRecreationVenue(venue));
}

/** @deprecated Use filterGenericCivicRecreationVenues — query/intent are ignored; filter is global. */
export function filterActivitySearchVenues<T extends Pick<VenueCandidate, "name" | "category" | "address" | "types">>(
  _query: string,
  _intent: unknown,
  venues: T[]
): T[] {
  return filterGenericCivicRecreationVenues(venues);
}
