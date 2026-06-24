import type { EventResult, EventSearchRequest } from "@/lib/eventResult";
import { classifyLocalEventProfile, eventTimeWindow } from "@/lib/localEventIntent";
import { rankEventResults } from "@/lib/eventRanking";
import type { EventProvider } from "@/lib/providers/eventDiscoveryTypes";
import { ticketmasterEventProvider } from "@/lib/providers/ticketmasterEventProvider";
import { logApiError } from "@/lib/serverLog";

const providers: EventProvider[] = [ticketmasterEventProvider];

export function isEventDiscoveryConfigured() {
  return providers.some((provider) => provider.isConfigured());
}

export async function searchLocalEvents(request: EventSearchRequest): Promise<EventResult[]> {
  const profile = request.profile ?? classifyLocalEventProfile(request.query);
  const window = eventTimeWindow(profile);
  const merged: EventResult[] = [];

  for (const provider of providers) {
    if (!provider.isConfigured()) continue;
    try {
      const batch = await provider.searchEvents({
        ...request,
        profile,
        startDateTime: window.start.toISOString(),
        endDateTime: window.end.toISOString()
      });
      merged.push(...batch);
    } catch (error) {
      logApiError("ticketmaster-event-discovery", error);
    }
  }

  const deduped = dedupeEvents(merged);
  return rankEventResults(deduped, profile).slice(0, 8);
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
