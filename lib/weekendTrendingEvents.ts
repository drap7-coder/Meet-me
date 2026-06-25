import { isEventDiscoveryConfigured, searchLocalEvents } from "@/lib/eventDiscovery";
import type { EventResult } from "@/lib/eventResult";

export const WEEKEND_TRENDING_CAP = 5;
export const WEEKEND_TRENDING_RADIUS_MILES = 30;

const SEGMENT_FETCH_CAP = 6;

/** ISO year + week number — used for dismiss-until-next-week storage. */
export function weekendTrendingWeekKey(now = new Date()): string {
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const week = Math.ceil(((now.getTime() - start.getTime()) / 86_400_000 + start.getDay() + 1) / 7);
  return `${year}-W${week}`;
}

/** Upcoming Fri–Sun window for the trending feed (includes Friday when still ahead). */
export function upcomingWeekendWindow(now = new Date()): { start: Date; end: Date } {
  const day = now.getDay(); // 0 Sun … 5 Fri 6 Sat
  const start = new Date(now);
  const end = new Date(now);

  if (day === 0) {
    end.setHours(23, 59, 59, 999);
    return { start: now, end };
  }

  if (day === 5 || day === 6) {
    end.setDate(end.getDate() + (day === 5 ? 2 : 1));
    end.setHours(23, 59, 59, 999);
    return { start: now, end };
  }

  const daysUntilFriday = (5 - day + 7) % 7;
  start.setDate(start.getDate() + daysUntilFriday);
  start.setHours(0, 0, 0, 0);
  end.setTime(start.getTime());
  end.setDate(end.getDate() + 2);
  end.setHours(23, 59, 59, 999);
  return { start, end };
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
