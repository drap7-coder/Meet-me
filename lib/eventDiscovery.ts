import type { EventResult, EventSearchRequest } from "@/lib/eventResult";
import { withEventStraightLineDistance } from "@/lib/eventDistance";
import { classifyLocalEventProfile, eventTimeWindow, isMusicEventQuery } from "@/lib/localEventIntent";
import { rankEventResults } from "@/lib/eventRanking";
import type { EventProvider } from "@/lib/providers/eventDiscoveryTypes";
import { ticketmasterEventProvider } from "@/lib/providers/ticketmasterEventProvider";
import { recordProviderError } from "@/lib/searchTelemetryRuntime";
import { logApiError } from "@/lib/serverLog";

const providers: EventProvider[] = [ticketmasterEventProvider];

const DEFAULT_RADIUS_MILES = 25;
const MUSIC_RADIUS_MILES = 100;
const DEFAULT_RESULT_CAP = 8;
const MUSIC_RESULT_CAP = 30;

export function isEventDiscoveryConfigured() {
  return providers.some((provider) => provider.isConfigured());
}

export async function searchLocalEvents(request: EventSearchRequest): Promise<EventResult[]> {
  const profile = request.profile ?? classifyLocalEventProfile(request.query);
  const window = eventTimeWindow(profile, request.query);
  const isMusic = profile === "music" || isMusicEventQuery(request.query);
  const merged: EventResult[] = [];

  for (const provider of providers) {
    if (!provider.isConfigured()) continue;
    try {
      const batch = await provider.searchEvents({
        ...request,
        profile,
        radiusMiles: request.radiusMiles ?? (isMusic ? MUSIC_RADIUS_MILES : DEFAULT_RADIUS_MILES),
        startDateTime: window.start.toISOString(),
        endDateTime: window.end.toISOString()
      });
      merged.push(...batch);
    } catch (error) {
      recordProviderError("ticketmaster", "search_events");
      logApiError("ticketmaster-event-discovery", error);
    }
  }

  const withDistance = merged.map((event) =>
    withEventStraightLineDistance(event, request.latitude, request.longitude)
  );
  const deduped = dedupeEvents(withDistance);
  const resultCap = isMusic ? MUSIC_RESULT_CAP : DEFAULT_RESULT_CAP;
  return rankEventResults(deduped, profile, new Date(), request.query).slice(0, resultCap);
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
