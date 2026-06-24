import type { EventResult, EventSearchRequest } from "@/lib/eventResult";
import { classifyLocalEventProfile, eventTimeWindow } from "@/lib/localEventIntent";
import { rankEventResults } from "@/lib/eventRanking";
import type { EventProvider } from "@/lib/providers/eventDiscoveryTypes";
import { ticketmasterEventProvider } from "@/lib/providers/ticketmasterEventProvider";
import { recordProviderError } from "@/lib/searchTelemetryRuntime";
import { logApiError } from "@/lib/serverLog";

const providers: EventProvider[] = [ticketmasterEventProvider];

export function isEventDiscoveryConfigured() {
  return providers.some((provider) => provider.isConfigured());
}

export async function searchLocalEvents(request: EventSearchRequest): Promise<EventResult[]> {
  const profile = request.profile ?? classifyLocalEventProfile(request.query);
  const window = eventTimeWindow(profile, request.query);
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
      recordProviderError("ticketmaster", "search_events");
      logApiError("ticketmaster-event-discovery", error);
    }
  }

  const withDistance = merged.map((event) => withComputedDistance(event, request.latitude, request.longitude));
  const deduped = dedupeEvents(withDistance);
  return rankEventResults(deduped, profile, new Date(), request.query).slice(0, 8);
}

/**
 * Ticketmaster only returns `distance` when a latlong is supplied (i.e. not on
 * nationwide team searches). When it's missing but we have venue coordinates,
 * derive a straight-line distance from the origin so cards/map can use it.
 */
function withComputedDistance(event: EventResult, originLat: number, originLng: number): EventResult {
  if (event.distance != null) return event;
  if (event.latitude == null || event.longitude == null) return event;
  if (!Number.isFinite(originLat) || !Number.isFinite(originLng)) return event;

  return {
    ...event,
    distance: haversineMiles(originLat, originLng, event.latitude, event.longitude)
  };
}

function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earthRadiusMiles * c * 10) / 10;
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
