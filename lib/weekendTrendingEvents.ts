import { isEventDiscoveryConfigured, searchLocalEvents } from "@/lib/eventDiscovery";
import type { EventResult } from "@/lib/eventResult";

export const WEEKEND_TRENDING_CAP = 5;
export const WEEKEND_TRENDING_RADIUS_MILES = 30;

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

export async function fetchTrendingWeekendEvents(
  latitude: number,
  longitude: number
): Promise<EventResult[]> {
  if (!isEventDiscoveryConfigured()) return [];

  const window = upcomingWeekendWindow();
  const events = await searchLocalEvents({
    query: "events this weekend",
    latitude,
    longitude,
    profile: "weekend",
    radiusMiles: WEEKEND_TRENDING_RADIUS_MILES,
    startDateTime: window.start.toISOString(),
    endDateTime: window.end.toISOString(),
    resultCap: WEEKEND_TRENDING_CAP
  });

  return events.slice(0, WEEKEND_TRENDING_CAP);
}
