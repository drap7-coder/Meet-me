import type { EventResult, ScoredVenue, SearchMode } from "@/lib/types";
import { EV_TRAVEL_ICON } from "@/lib/travelMode";
import { formatEventDistanceChip } from "@/lib/eventDistance";

/**
 * Canonical, payload-only signal builders shared by the Top Pick and the result
 * cards below it. Everything here is derived from data already fetched — no new
 * API calls — and weak/missing data is hidden rather than guessed.
 */

export type EventCta = {
  label: string;
  href: string;
  kind: "tickets" | "directions";
};

/** Compact, scannable chips for a place card: drive, open state, rating, price. */
export function venueSignalChips(venue: ScoredVenue, searchMode: SearchMode): string[] {
  const chips: string[] = [];

  const drive = driveChip(venue, searchMode);
  if (drive) chips.push(drive);

  if (venue.openNow === true) chips.push("Open now");
  else if (venue.openNow === false) chips.push("Closed");

  const rating = ratingChip(venue);
  if (rating) chips.push(rating);

  const price = formatPriceLevel(venue.priceLevel);
  if (price) chips.push(price);

  const ev = evChargingChip(venue);
  if (ev) chips.push(ev);

  return chips.slice(0, 4);
}

function driveChip(venue: ScoredVenue, searchMode: SearchMode): string | null {
  if (searchMode === "midpoint") {
    const diff = venue.timeDifferenceMinutes;
    if (typeof diff === "number" && diff <= 12) return "Fair for both";
    return null;
  }
  const minutes = venue.travelFromA?.durationMinutes;
  if (typeof minutes === "number" && venue.travelFromA?.status === "OK") return `${minutes} min away`;
  return null;
}

function ratingChip(venue: ScoredVenue): string | null {
  if (typeof venue.rating !== "number") return null;
  return `${venue.rating.toFixed(1)} ★ (${formatCount(venue.reviewCount)})`;
}

/** Compact EV charging signal for venue cards when enrichment ran. */
export function evChargingChip(venue: ScoredVenue): string | null {
  const ev = venue.evCharging;
  if (!ev) return null;
  if (ev.nearbyCount > 0) {
    const fast = ev.fastChargingAvailable ? " · fast" : "";
    return `${EV_TRAVEL_ICON} ${ev.nearbyCount} charger${ev.nearbyCount === 1 ? "" : "s"} nearby${fast}`;
  }
  if (ev.nearestDistanceMeters != null) {
    const miles = (ev.nearestDistanceMeters / 1609.34).toFixed(1);
    return `${EV_TRAVEL_ICON} Charger ${miles} mi away`;
  }
  return null;
}

/** Straight-line miles only — never Google Routes drive time. See lib/eventDistance.ts */
export function eventDistanceChip(event: EventResult): string | null {
  return formatEventDistanceChip(event.distance);
}

/** Primary CTA for an event: tickets if available, otherwise directions, else none. */
export function eventCta(event: EventResult): EventCta | null {
  if (event.ticketUrl) {
    return { label: "Get tickets", href: event.ticketUrl, kind: "tickets" };
  }
  const query = [event.venue, event.city, event.state].filter(Boolean).join(" ").trim();
  if (!query) return null;
  return { label: "Get directions", href: mapsSearch(query), kind: "directions" };
}

export function formatPriceLevel(priceLevel?: string): string | null {
  if (!priceLevel) return null;
  const prices: Record<string, string> = {
    PRICE_LEVEL_FREE: "Free",
    PRICE_LEVEL_INEXPENSIVE: "$",
    PRICE_LEVEL_MODERATE: "$$",
    PRICE_LEVEL_EXPENSIVE: "$$$",
    PRICE_LEVEL_VERY_EXPENSIVE: "$$$$"
  };
  return prices[priceLevel] ?? null;
}

export function formatCount(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0";
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return String(value);
}

export function mapsSearch(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query.trim())}`;
}
