import type { EventResult } from "@/lib/eventResult";
import type { ScoredVenue, SearchHalfwayResponse } from "@/lib/types";

const TEMPORAL_EVENT_BOOST =
  /\b(?:concert|comedy|theat(?:er|re)|festival|farmers? market|street fair|live music|sports?|game|seasonal|pop[-\s]?up|holiday)\b/i;

const GENERIC_PERMANENT_VENUE =
  /\b(?:community center|recreation center|rec center|gym|fitness|indoor playground|play(?:\s|-)?place|kids play|municipal building|township building|borough hall|city hall)\b/i;

export const TIME_AWARE_MIN_PRIMARY_RESULTS = 6;

export function temporalEventScore(event: EventResult): number {
  let score = 100;
  const haystack = `${event.title} ${event.category} ${event.venue}`;
  if (TEMPORAL_EVENT_BOOST.test(haystack)) score += 45;
  if (event.ticketUrl) score += 6;
  if (event.imageUrl) score += 4;
  if (event.distance != null) score += Math.max(0, 20 - event.distance);
  return score;
}

export function rankTemporalEvents(events: EventResult[]): EventResult[] {
  return [...events].sort((left, right) => temporalEventScore(right) - temporalEventScore(left));
}

export function temporalVenueScore(venue: ScoredVenue, source: "opentripmap" | "google_places"): number {
  let score = venue.fairnessScore;
  const haystack = `${venue.name} ${venue.category} ${venue.address} ${(venue.types ?? []).join(" ")}`;

  if (source === "opentripmap") score += 90;
  if (source === "google_places") score -= 25;
  if (TEMPORAL_EVENT_BOOST.test(haystack)) score += 35;
  if (isGenericPermanentVenue(venue)) score -= 120;

  return Math.round(score * 10) / 10;
}

export function rankTemporalVenues(
  venues: Array<{ venue: ScoredVenue; source: "opentripmap" | "google_places" }>
): ScoredVenue[] {
  return dedupeTemporalVenues(venues)
    .sort((left, right) => temporalVenueScore(right.venue, right.source) - temporalVenueScore(left.venue, left.source))
    .map((entry) => entry.venue);
}

export function enoughTimeAwareCoverage(events: EventResult[], venues: ScoredVenue[]) {
  return events.length + venues.length >= TIME_AWARE_MIN_PRIMARY_RESULTS;
}

export function isGenericPermanentVenue(venue: Pick<ScoredVenue, "name" | "category" | "address" | "types">) {
  const haystack = `${venue.name} ${venue.category} ${venue.address} ${(venue.types ?? []).join(" ")}`;
  return GENERIC_PERMANENT_VENUE.test(haystack);
}

export function withTemporalExploreResults(
  response: SearchHalfwayResponse,
  events: EventResult[],
  venues: ScoredVenue[]
): SearchHalfwayResponse {
  return {
    ...response,
    events: rankTemporalEvents(events),
    venues: venues.slice(0, 18),
    eventProfile: response.eventProfile ?? "weekend"
  };
}

function dedupeTemporalVenues(
  venues: Array<{ venue: ScoredVenue; source: "opentripmap" | "google_places" }>
) {
  const seen = new Set<string>();
  const out: Array<{ venue: ScoredVenue; source: "opentripmap" | "google_places" }> = [];

  for (const entry of venues) {
    const venue = entry.venue;
    const key = `${venue.name.toLowerCase()}|${venue.location.lat.toFixed(3)}|${venue.location.lng.toFixed(3)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(entry);
  }

  return out;
}
