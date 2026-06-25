import type { ScoredVenue, TravelMode } from "@/lib/types";

/** True when the user is asking for places with EV charging (even if travel mode is Auto/Drive). */
export function isEvChargingIntent(query: string | null | undefined): boolean {
  const value = query?.trim().toLowerCase();
  if (!value) return false;

  if (/\b(?:ev|electric(?:\s+vehicle)?|e[\s-]?v)\b/.test(value) && /\b(?:charg(?:e|ing|ers?)|supercharg(?:e|er|ing)|charging station)\b/.test(value)) {
    return true;
  }

  return (
    /\b(?:ev[-\s]?friendly|charger nearby|near a charger|with charging|charging nearby|charging on site)\b/.test(value) ||
    /\b(?:restaurants?|cafes?|coffee|bars?|food)\b.*\b(?:with|near)\b.*\b(?:an?\s+)?(?:ev|e[\s-]?v)(?:\s+charg(?:e|ing|ers?))?\b/i.test(value) ||
    /\b(?:where (?:can|to) i charge|need (?:to )?charge|while i charge)\b/.test(value)
  );
}

/** True when the charger itself is the destination, not enrichment for dinner/coffee/etc. */
export function isDirectEvChargerSearch(query: string | null | undefined): boolean {
  const value = query?.trim().toLowerCase();
  if (!value || !isEvChargingIntent(value)) return false;
  return !/\b(?:restaurants?|food|dinner|lunch|brunch|eat|cafes?|coffee|bars?|brewery|shopping|movies?|theater|museum|park)\b/.test(value);
}

/** Remove EV/charging phrasing so Google Places searches the venue type, not chargers. */
export function stripEvChargingPhrases(query: string): string {
  return query
    .replace(
      /\b(?:with|near|by|at)\s+(?:a\s+)?(?:nearby\s+)?(?:an?\s+)?(?:ev\s+|electric\s+vehicle\s+|e[\s-]?v\s*)?(?:charg(?:e|ing|ers?)|supercharg(?:e|er|ing)|charging stations?)(?:\s+(?:nearby|available|on[\s-]?site))?\b/gi,
      ""
    )
    .replace(/\b(?:with|near|by|at)\s+(?:a\s+)?(?:an?\s+)?(?:ev|e[\s-]?v)\b/gi, "")
    .replace(/\b(?:ev|electric(?:\s+vehicle)?)\s+(?:charg(?:e|ing|ers?)|supercharg(?:e|er|ing))\b/gi, "")
    .replace(/\b(?:where (?:can|to) i charge|need (?:to )?charge while|while (?:i|we) charge)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s,]+|[\s,]+$/g, "")
    .trim();
}

/** Use EV enrichment when travel mode is EV or the query explicitly asks for charging. */
export function effectiveTravelModeForQuery(travelMode: TravelMode | null | undefined, query: string): TravelMode {
  if (travelMode === "ev") return "ev";
  if (isEvChargingIntent(query)) return "ev";
  return travelMode ?? "auto";
}

/** Places search term: strip charging intent from free-text queries sent to Google. */
export function placesSearchQuery(category: string, customQuery?: string): string | undefined {
  const raw = customQuery?.trim();
  if (!raw) return raw;
  if (isDirectEvChargerSearch(raw)) return raw;
  if (category !== "custom" && !isEvChargingIntent(raw)) return raw;
  const stripped = stripEvChargingPhrases(raw);
  return stripped || raw;
}

/** Ranking bonus for venues with nearby chargers after EV enrichment. */
export function evRankingBoost(venue: ScoredVenue): number {
  const ev = venue.evCharging;
  if (!ev) return 0;
  if (ev.nearbyCount > 0) return 0.12 + Math.min(ev.nearbyCount, 4) * 0.04;
  if (ev.nearestDistanceMeters == null) return 0;
  if (ev.nearestDistanceMeters <= 800) return 0.08;
  if (ev.nearestDistanceMeters <= 1600) return 0.04;
  return 0;
}

export function sortVenuesForEvIntent(
  venues: ScoredVenue[],
  query: string,
  travelMode?: TravelMode
): ScoredVenue[] {
  if (effectiveTravelModeForQuery(travelMode, query) !== "ev") return venues;
  return [...venues].sort((a, b) => {
    const scoreA = a.fairnessScore + evRankingBoost(a);
    const scoreB = b.fairnessScore + evRankingBoost(b);
    return scoreB - scoreA;
  });
}
