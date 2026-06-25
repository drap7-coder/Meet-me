import { isEventDiscoveryConfigured, searchLocalEvents, searchTicketmasterEvents } from "@/lib/eventDiscovery";
import type { EventResult } from "@/lib/eventResult";
import { upcomingWeekendWindow, weekendTrendingWeekKey } from "@/lib/weekendWindow";

export { upcomingWeekendWindow, weekendTrendingWeekKey } from "@/lib/weekendWindow";

export const WEEKEND_TRENDING_CAP = 5;
export const WEEKEND_TRENDING_RADIUS_MILES = 30;
export const TRENDING_NEAR_YOU_EVENT_CAP = 6;

const SEGMENT_FETCH_CAP = 10;

function withEventImages(events: EventResult[]) {
  return events.filter((event) => Boolean(event.imageUrl?.trim()));
}

function isComedyEvent(event: EventResult): boolean {
  const haystack = `${event.title} ${event.category} ${event.venue}`;
  return /\b(?:comedy|stand[- ]?up|comedian)\b/i.test(haystack);
}

/** Interleave sports, music, and arts so the strip is not concert-heavy. */
export function blendWeekendTrendingMix(
  sports: EventResult[],
  music: EventResult[],
  arts: EventResult[],
  cap = WEEKEND_TRENDING_CAP
): EventResult[] {
  const seen = new Set<string>();
  const indices = { sports: 0, music: 0, arts: 0 };
  const results: EventResult[] = [];

  function takeNext(pool: EventResult[], key: keyof typeof indices): EventResult | undefined {
    while (indices[key] < pool.length) {
      const event = pool[indices[key]++];
      const id = `${event.source}:${event.id}`;
      if (seen.has(id)) continue;
      seen.add(id);
      return event;
    }
    return undefined;
  }

  const pattern: Array<keyof typeof indices> = ["sports", "music", "sports", "music", "arts"];

  for (const key of pattern) {
    if (results.length >= cap) break;
    const event = takeNext(key === "sports" ? sports : key === "music" ? music : arts, key);
    if (event) results.push(event);
  }

  for (const pool of [sports, music, arts] as const) {
    const key = pool === sports ? "sports" : pool === music ? "music" : "arts";
    while (results.length < cap) {
      const event = takeNext(pool, key);
      if (!event) break;
      results.push(event);
    }
  }

  return results;
}

/** Trending Near You: always lead with one sport and one comedian when available, then music. */
export function blendTrendingNearYouMix(
  sports: EventResult[],
  comedy: EventResult[],
  music: EventResult[],
  cap = TRENDING_NEAR_YOU_EVENT_CAP
): EventResult[] {
  const seen = new Set<string>();
  const results: EventResult[] = [];

  function takeNext(pool: EventResult[]): EventResult | undefined {
    for (const event of pool) {
      const id = `${event.source}:${event.id}`;
      if (seen.has(id)) continue;
      seen.add(id);
      return event;
    }
    return undefined;
  }

  function takeFrom(pool: EventResult[]) {
    if (results.length >= cap) return;
    const event = takeNext(pool);
    if (event) results.push(event);
  }

  takeFrom(sports);
  takeFrom(comedy);

  for (const pool of [music, sports, comedy]) {
    while (results.length < cap) {
      const before = results.length;
      takeFrom(pool);
      if (results.length === before) break;
    }
  }

  return results;
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
    searchTicketmasterEvents({ ...base, query: "sports this weekend", profile: "sports", segmentName: "Sports" }),
    searchTicketmasterEvents({
      ...base,
      query: "comedy shows this weekend",
      profile: "weekend",
      segmentName: "Arts & Theatre"
    }),
    searchTicketmasterEvents({ ...base, query: "concerts this weekend", profile: "music", segmentName: "Music" })
  ]);

  const comedy = withEventImages(comedyRaw.filter(isComedyEvent));
  return blendTrendingNearYouMix(
    withEventImages(sports),
    comedy.length ? comedy : withEventImages(comedyRaw),
    withEventImages(music),
    TRENDING_NEAR_YOU_EVENT_CAP
  );
}

export async function fetchTrendingWeekendEvents(
  latitude: number,
  longitude: number
): Promise<EventResult[]> {
  if (!isEventDiscoveryConfigured()) return [];

  const window = upcomingWeekendWindow();
  const base = {
    query: "events this weekend",
    latitude,
    longitude,
    radiusMiles: WEEKEND_TRENDING_RADIUS_MILES,
    startDateTime: window.start.toISOString(),
    endDateTime: window.end.toISOString(),
    resultCap: SEGMENT_FETCH_CAP
  };

  const [sports, music, arts] = await Promise.all([
    searchLocalEvents({ ...base, profile: "sports", segmentName: "Sports" }),
    searchLocalEvents({ ...base, profile: "music", segmentName: "Music" }),
    searchLocalEvents({ ...base, profile: "weekend", segmentName: "Arts & Theatre" })
  ]);

  return blendWeekendTrendingMix(sports, music, arts);
}
