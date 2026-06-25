import type { EventResult } from "@/lib/eventResult";
import { isEventDiscoveryConfigured } from "@/lib/eventDiscovery";
import { fetchNearbyChargers, hasOpenChargeMapApiKey } from "@/lib/providers/openChargeMap";
import { fetchTrendingWeekendEvents } from "@/lib/weekendTrendingEvents";
import { isTmdbConfigured, fetchTrendingMovies } from "@/lib/tmdb";
import { logApiError } from "@/lib/serverLog";

export type TrendingNearYouCard = {
  id: string;
  kind: "event" | "streaming" | "ev";
  title: string;
  subtitle: string;
  badge: string;
  imageUrl?: string;
  actionUrl?: string;
  searchQuery?: string;
};

export type TrendingNearYouPayload = {
  configured: boolean;
  cards: TrendingNearYouCard[];
};

const MAX_CARDS = 6;
const MAX_EVENT_CARDS = 4;

export async function fetchTrendingNearYou(latitude: number, longitude: number): Promise<TrendingNearYouCard[]> {
  const cards: TrendingNearYouCard[] = [];

  const [events, streaming, evCount] = await Promise.all([
    loadEvents(latitude, longitude),
    loadStreamingPick(),
    loadEvSummary(latitude, longitude)
  ]);

  for (const event of events.slice(0, MAX_EVENT_CARDS)) {
    cards.push(eventCardToTrendingCard(event));
  }

  if (streaming) cards.push(streaming);
  if (evCount) cards.push(evCount);

  return cards.slice(0, MAX_CARDS);
}

export function isTrendingNearYouConfigured() {
  return isEventDiscoveryConfigured() || isTmdbConfigured() || hasOpenChargeMapApiKey() || true;
}

async function loadEvents(latitude: number, longitude: number): Promise<EventResult[]> {
  if (!isEventDiscoveryConfigured()) return [];
  try {
    return await fetchTrendingWeekendEvents(latitude, longitude);
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

async function loadStreamingPick(): Promise<TrendingNearYouCard | null> {
  if (!isTmdbConfigured()) return null;
  try {
    const picks = await fetchTrendingMovies(1);
    const pick = picks[0];
    if (!pick) return null;
    return {
      id: `stream-${pick.id}`,
      kind: "streaming",
      title: pick.title,
      subtitle: "Trending to watch this week",
      badge: "Streaming",
      imageUrl: pick.posterUrl || undefined,
      searchQuery: "Trending movies this week"
    };
  } catch (error) {
    logApiError("trending-near-you-streaming", error);
    return null;
  }
}

async function loadEvSummary(latitude: number, longitude: number): Promise<TrendingNearYouCard | null> {
  if (!hasOpenChargeMapApiKey()) return null;
  try {
    const chargers = await fetchNearbyChargers({
      origin: { lat: latitude, lng: longitude },
      radiusKm: 15,
      maxResults: 20
    });
    if (!chargers.length) return null;
    const fastCount = chargers.filter((item) => item.isFastCharger).length;
    return {
      id: "ev-nearby",
      kind: "ev",
      title: `${chargers.length} chargers nearby`,
      subtitle: fastCount
        ? `${fastCount} fast-charging option${fastCount === 1 ? "" : "s"} within range`
        : "EV charging locations near your area",
      badge: "EV Charging",
      searchQuery: "Restaurant with EV charging near me"
    };
  } catch (error) {
    logApiError("trending-near-you-ev", error);
    return null;
  }
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
