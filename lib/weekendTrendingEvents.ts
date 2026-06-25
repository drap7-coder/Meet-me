import { isEventDiscoveryConfigured, searchLocalEvents, searchTicketmasterEvents } from "@/lib/eventDiscovery";
import type { EventResult } from "@/lib/eventResult";
import { composeTrendingPicks, inSeasonSportIds } from "@/lib/trendingComposition";
import { upcomingWeekendWindow, weekendTrendingWeekKey } from "@/lib/weekendWindow";

export { upcomingWeekendWindow, weekendTrendingWeekKey } from "@/lib/weekendWindow";

export const WEEKEND_TRENDING_CAP = 5;
export const WEEKEND_TRENDING_RADIUS_MILES = 30;
export const TRENDING_NEAR_YOU_EVENT_CAP = 6;

const SEGMENT_FETCH_CAP = 12;

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

async function fetchSeasonalSportsEvents(
  base: Omit<Parameters<typeof searchTicketmasterEvents>[0], "query" | "profile" | "segmentName">,
  latitude: number,
  longitude: number
) {
  const inSeason = inSeasonSportIds(new Date(), { lat: latitude, lng: longitude });
  const requests: Array<Promise<EventResult[]>> = [
    searchTicketmasterEvents({ ...base, query: "sports this weekend", profile: "sports", segmentName: "Sports" })
  ];

  if (inSeason.has("baseball")) {
    requests.push(
      searchTicketmasterEvents({ ...base, query: "baseball", profile: "sports", segmentName: "Sports" })
    );
  }
  if (inSeason.has("football")) {
    requests.push(
      searchTicketmasterEvents({ ...base, query: "football", profile: "sports", segmentName: "Sports" })
    );
  }
  if (inSeason.has("soccer")) {
    requests.push(
      searchTicketmasterEvents({ ...base, query: "soccer", profile: "sports", segmentName: "Sports" })
    );
  }

  const batches = await Promise.all(requests);
  return dedupeEvents(batches.flat());
}

export async function fetchTrendingNearYouEvents(
  latitude: number,
  longitude: number
): Promise<EventResult[]> {
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

  const candidates = dedupeEvents([
    ...withEventImages(sports),
    ...withEventImages(music),
    ...withEventImages(comedyRaw)
  ]);

  return composeTrendingPicks(candidates, {
    latitude,
    longitude,
    cap: TRENDING_NEAR_YOU_EVENT_CAP
  });
}

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

  return composeTrendingPicks(withEventImages(dedupeEvents([...sports, ...music, ...arts])), {
    latitude,
    longitude,
    cap: WEEKEND_TRENDING_CAP
  });
}
