import type { EventResult } from "@/lib/eventResult";
import { ticketmasterEventProvider } from "@/lib/providers/ticketmasterEventProvider";
import type { TrendingNearYouCard, TrendingNearYouPayload } from "@/lib/trendingNearYouTypes";
import { fetchTrendingNearYouEvents } from "@/lib/weekendTrendingEvents";
import { logApiError } from "@/lib/serverLog";

export type { TrendingNearYouCard, TrendingNearYouPayload } from "@/lib/trendingNearYouTypes";

const MAX_CARDS = 6;

export async function fetchTrendingNearYou(latitude: number, longitude: number): Promise<TrendingNearYouCard[]> {
  const events = await loadEvents(latitude, longitude);
  return events.slice(0, MAX_CARDS).map(eventCardToTrendingCard);
}

export function isTrendingNearYouConfigured() {
  return ticketmasterEventProvider.isConfigured();
}

async function loadEvents(latitude: number, longitude: number): Promise<EventResult[]> {
  if (!ticketmasterEventProvider.isConfigured()) return [];
  try {
    return await fetchTrendingNearYouEvents(latitude, longitude);
  } catch (error) {
    logApiError("trending-near-you-events", error);
    return [];
  }
}

function eventCardToTrendingCard(event: EventResult): TrendingNearYouCard {
  return {
    id: `event-${event.id}`,
    kind: "event",
    title: event.title,
    subtitle: [formatEventWhen(event.startTime), event.venue].filter(Boolean).join(" · "),
    badge: event.category,
    imageUrl: event.imageUrl,
    actionUrl: event.ticketUrl,
    searchQuery: "Events near me this weekend"
  };
}

function formatEventWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}
