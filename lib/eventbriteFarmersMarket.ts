import type { EventResult } from "@/lib/eventResult";
import { formatEventDistanceChip } from "@/lib/eventDistance";
import type { TrendingNearYouCard } from "@/lib/trendingNearYou";

const FARMERS_MARKET_RE =
  /\b(?:farmers? markets?|farm market|produce market|public market|fresh market|market day)\b/i;

export function isFarmersMarketEvent(event: EventResult): boolean {
  const haystack = `${event.title} ${event.category} ${event.venue}`.toLowerCase();
  return FARMERS_MARKET_RE.test(haystack);
}

/** Prefer title/category matches; fall back to the nearest upcoming event from a food_markets source. */
export function pickFarmersMarketEvent(events: EventResult[]): EventResult | null {
  const explicit = events.filter(isFarmersMarketEvent);
  if (explicit.length) return explicit[0];
  return events[0] ?? null;
}

export function farmersMarketCardFromEvent(event: EventResult): TrendingNearYouCard {
  const distanceLabel = formatEventDistanceChip(event.distance);
  return {
    id: `farmers-${event.source}-${event.id}`,
    kind: "farmers_market",
    title: event.title,
    subtitle: [formatEventWhen(event.startTime), event.venue, distanceLabel].filter(Boolean).join(" · "),
    badge: "Farmers Market",
    imageUrl: event.imageUrl,
    actionUrl: event.ticketUrl,
    searchQuery: "Farmers markets near me this weekend"
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
