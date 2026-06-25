import { isEventDiscoveryConfigured, searchLocalEvents, searchTicketmasterEvents } from "@/lib/eventDiscovery";
import type { EventResult } from "@/lib/eventResult";
import { localTeamsForSport } from "@/lib/sportsTeams";
import { composeTrendingPicks, inSeasonSportIds, type TrendingCompositionContext } from "@/lib/trendingComposition";
import { upcomingWeekendWindow, weekendTrendingWeekKey } from "@/lib/weekendWindow";

export { upcomingWeekendWindow, weekendTrendingWeekKey } from "@/lib/weekendWindow";

export const WEEKEND_TRENDING_CAP = 5;
export const WEEKEND_TRENDING_RADIUS_MILES = 30;
export const TRENDING_NEAR_YOU_EVENT_CAP = 6;

const SEGMENT_FETCH_CAP = 20;

function withEventImages(events: EventResult[]) {
  return events.filter((event) => Boolean(event.imageUrl?.trim()));
}

function dedupeEvents(events: EventResult[]) {
  const seen = new Set<string>();
  const results: EventResult[] = [];
  for (const event of events) {
    const key = `${event.source}:${event.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(event);
  }
  return results;
}

/** @deprecated Prefer composeTrendingPicks — kept for legacy tests. */
export function blendWeekendTrendingMix(
  sports: EventResult[],
  music: EventResult[],
  arts: EventResult[],
  cap = WEEKEND_TRENDING_CAP
): EventResult[] {
  return composeTrendingPicks(withEventImages([...sports, ...music, ...arts]), { cap });
}

/** @deprecated Prefer composeTrendingPicks — kept for legacy tests. */
export function blendTrendingNearYouMix(
  sports: EventResult[],
  comedy: EventResult[],
  music: EventResult[],
  cap = TRENDING_NEAR_YOU_EVENT_CAP
): EventResult[] {
  return composeTrendingPicks(withEventImages([...sports, ...comedy, ...music]), { cap });
}

const LOCAL_TEAM_FETCH_CAP = 2;

/** Query plan for seasonal sports fetches — exported for diagnostics/tests. */
export function seasonalSportsFetchQueries(
  latitude: number,
  longitude: number,
  date = new Date()
): string[] {
  const origin = { lat: latitude, lng: longitude };
  const inSeason = inSeasonSportIds(date, origin);
  const queries = ["sports this weekend"];
  const teamQueries = new Set<string>();

  if (inSeason.has("baseball")) queries.push("baseball");
  if (inSeason.has("football")) queries.push("football");
  if (inSeason.has("soccer")) queries.push("soccer");

  for (const sport of inSeason) {
    for (const team of localTeamsForSport(sport, origin).slice(0, LOCAL_TEAM_FETCH_CAP)) {
      teamQueries.add(team.ticketmasterKeyword);
    }
  }

  return [...queries, ...teamQueries];
}

async function fetchSeasonalSportsEvents(
  base: Omit<Parameters<typeof searchTicketmasterEvents>[0], "query" | "profile" | "segmentName">,
  latitude: number,
  longitude: number
) {
  const queries = seasonalSportsFetchQueries(latitude, longitude);
  const requests = queries.map((query) =>
    searchTicketmasterEvents({ ...base, query, profile: "sports", segmentName: "Sports" })
  );

  const batches = await Promise.all(requests);
  return dedupeEvents(batches.flat());
}

function trendingEventScore(event: EventResult, index: number): number {
  let score = 1000 - index;
  if (event.imageUrl?.trim()) score += 14;
  if (event.ticketUrl) score += 4;
  if (event.distance != null) score += Math.max(0, 12 - event.distance);
  return score;
}

export function finalizeTrendingEvents(
  events: EventResult[],
  context: TrendingCompositionContext
): EventResult[] {
  const cap = context.cap ?? TRENDING_NEAR_YOU_EVENT_CAP;
  const deduped = dedupeEvents(events);
  if (!deduped.length) return [];

  const ranked = deduped
    .map((event, index) => ({ event, score: trendingEventScore(event, index) }))
    .sort((left, right) => right.score - left.score)
    .map((entry) => entry.event);

  const composed = composeTrendingPicks(ranked, { ...context, relaxedFill: true });
  if (composed.length >= cap) return composed.slice(0, cap);

  const seen = new Set(composed.map((event) => `${event.source}:${event.id}`));
  const filled = [...composed];
  for (const event of ranked) {
    if (filled.length >= cap) break;
    const key = `${event.source}:${event.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    filled.push(event);
  }

  return filled.slice(0, cap);
}

async function fetchTrendingNearYouCandidateBatches(
  latitude: number,
  longitude: number
): Promise<{
  sports: EventResult[];
  comedy: EventResult[];
  music: EventResult[];
  window: ReturnType<typeof upcomingWeekendWindow>;
}> {
  const window = upcomingWeekendWindow();
  const base = {
    latitude,
    longitude,
    radiusMiles: WEEKEND_TRENDING_RADIUS_MILES,
    startDateTime: window.start.toISOString(),
    endDateTime: window.end.toISOString(),
    resultCap: SEGMENT_FETCH_CAP
  };

  const [sports, comedyRaw, music] = await Promise.all([
    fetchSeasonalSportsEvents(base, latitude, longitude),
    searchTicketmasterEvents({
      ...base,
      query: "comedy shows this weekend",
      profile: "weekend",
      segmentName: "Arts & Theatre"
    }),
    searchTicketmasterEvents({ ...base, query: "concerts this weekend", profile: "music", segmentName: "Music" })
  ]);

  return { sports, comedy: comedyRaw, music, window };
}

export async function fetchTrendingNearYouEvents(
  latitude: number,
  longitude: number
): Promise<EventResult[]> {
  const { sports, comedy, music } = await fetchTrendingNearYouCandidateBatches(latitude, longitude);
  const candidates = dedupeEvents([...sports, ...music, ...comedy]);

  return finalizeTrendingEvents(candidates, {
    latitude,
    longitude,
    cap: TRENDING_NEAR_YOU_EVENT_CAP
  });
}

export { fetchTrendingNearYouCandidateBatches, dedupeEvents, withEventImages };

export async function fetchTrendingWeekendEvents(
  latitude: number,
  longitude: number
): Promise<EventResult[]> {
  if (!isEventDiscoveryConfigured()) return [];

  const window = upcomingWeekendWindow();
  const base = {
    latitude,
    longitude,
    radiusMiles: WEEKEND_TRENDING_RADIUS_MILES,
    startDateTime: window.start.toISOString(),
    endDateTime: window.end.toISOString(),
    resultCap: SEGMENT_FETCH_CAP
  };

  const [sports, music, arts] = await Promise.all([
    fetchSeasonalSportsEvents(base, latitude, longitude),
    searchLocalEvents({ ...base, query: "concerts this weekend", profile: "music", segmentName: "Music" }),
    searchLocalEvents({ ...base, query: "events this weekend", profile: "weekend", segmentName: "Arts & Theatre" })
  ]);

  return finalizeTrendingEvents(dedupeEvents([...sports, ...music, ...arts]), {
    latitude,
    longitude,
    cap: WEEKEND_TRENDING_CAP
  });
}
