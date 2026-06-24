import type { EventResult, ScoredVenue, SearchHalfwayResponse } from "@/lib/types";

export type TopPickCta = {
  label: string;
  href: string;
};

export type TopPick = {
  kind: "place" | "event" | "night_out";
  eyebrow: string;
  headline: string;
  summary: string;
  chips: string[];
  primary: TopPickCta;
  secondary?: TopPickCta;
  imageUrl?: string;
};

/**
 * Collapse a results payload into a single, confident recommendation built
 * entirely from data already fetched (ranking order, ratings, hours, price,
 * travel time, event time/venue). No extra API calls — this just decides.
 */
export function buildTopPick(results: SearchHalfwayResponse): TopPick | null {
  const venue = results.venues?.[0];
  const event = results.events?.[0];

  if (venue && event) return buildNightOut(venue, event, results);
  if (venue) return buildPlacePick(venue, results);
  if (event) return buildEventPick(event);
  return null;
}

function buildPlacePick(venue: ScoredVenue, results: SearchHalfwayResponse): TopPick {
  const chips = placeChips(venue, results);
  return {
    kind: "place",
    eyebrow: "Koi's pick",
    headline: venue.name,
    summary: placeSummary(venue, results),
    chips,
    primary: { label: "Get directions", href: venue.googleMapsUri },
    secondary: venue.websiteUri ? { label: "Visit site", href: venue.websiteUri } : undefined
  };
}

function buildEventPick(event: EventResult): TopPick {
  return {
    kind: "event",
    eyebrow: "Koi's pick",
    headline: event.title,
    summary: eventSummary(event),
    chips: eventChips(event),
    primary: event.ticketUrl
      ? { label: "Get tickets", href: event.ticketUrl }
      : { label: "Open in Maps", href: mapsSearch(`${event.venue} ${event.city} ${event.state}`) },
    imageUrl: event.imageUrl
  };
}

function buildNightOut(venue: ScoredVenue, event: EventResult, results: SearchHalfwayResponse): TopPick {
  const venueNoun = (venue.category || "a spot").toLowerCase();
  const when = formatEventWhen(event.startTime);
  return {
    kind: "night_out",
    eyebrow: "Make a night of it",
    headline: venue.name,
    summary: `Grab ${venueNoun} at ${venue.name}, then catch ${event.title}${when ? ` ${when}` : ""} nearby.`,
    chips: placeChips(venue, results),
    primary: { label: "Directions to dinner", href: venue.googleMapsUri },
    secondary: event.ticketUrl
      ? { label: `Then: ${truncate(event.title, 32)}`, href: event.ticketUrl }
      : undefined,
    imageUrl: event.imageUrl
  };
}

function placeSummary(venue: ScoredVenue, results: SearchHalfwayResponse): string {
  const parts: string[] = [];
  const rating = ratingPhrase(venue);
  if (rating) parts.push(rating);

  if (venue.openNow === true) parts.push("open now");
  else if (venue.openNow === false) parts.push("opens later — check hours");

  const travel = travelPhrase(venue, results);
  if (travel) parts.push(travel);

  if (parts.length === 0) return `${venue.name} is your best match right now.`;
  return `${capitalize(parts[0])}${parts.length > 1 ? `, ${parts.slice(1).join(", ")}` : ""}.`;
}

function eventSummary(event: EventResult): string {
  const when = formatEventWhen(event.startTime);
  const place = [event.venue, event.city && `${event.city}${event.state ? `, ${event.state}` : ""}`]
    .filter(Boolean)
    .join(" · ");
  const distance =
    typeof event.distance === "number" ? ` (${event.distance < 1 ? "under a mile" : `${Math.round(event.distance)} mi`} away)` : "";
  const head = when ? `${when}` : "Upcoming";
  return `${head}${place ? ` at ${place}` : ""}${distance}.`;
}

function placeChips(venue: ScoredVenue, results: SearchHalfwayResponse): string[] {
  const chips: string[] = [];
  const travel = travelChip(venue, results);
  if (travel) chips.push(travel);
  if (venue.openNow === true) chips.push("Open now");
  else if (venue.openNow === false) chips.push("Closed");
  if (typeof venue.rating === "number") chips.push(`${venue.rating.toFixed(1)} ★ (${formatCount(venue.reviewCount)})`);
  const price = formatPriceLevel(venue.priceLevel);
  if (price) chips.push(price);
  return chips.slice(0, 4);
}

function eventChips(event: EventResult): string[] {
  const chips: string[] = [];
  const when = formatEventWhen(event.startTime);
  if (when) chips.push(when);
  if (typeof event.distance === "number") chips.push(event.distance < 1 ? "Under 1 mi" : `${Math.round(event.distance)} mi away`);
  if (event.city) chips.push(`${event.city}${event.state ? `, ${event.state}` : ""}`);
  return chips.slice(0, 4);
}

function ratingPhrase(venue: ScoredVenue): string | null {
  if (typeof venue.rating !== "number") return null;
  const count = formatCount(venue.reviewCount);
  if (venue.rating >= 4.5) return `people love it (${venue.rating.toFixed(1)} ★, ${count} reviews)`;
  if (venue.rating >= 4.0) return `well-rated (${venue.rating.toFixed(1)} ★, ${count} reviews)`;
  return `a solid option (${venue.rating.toFixed(1)} ★)`;
}

function travelPhrase(venue: ScoredVenue, results: SearchHalfwayResponse): string | null {
  if (results.searchMode === "midpoint") {
    const diff = venue.timeDifferenceMinutes;
    if (typeof diff === "number" && diff <= 10) return "a fair trip for both of you";
    return null;
  }
  const minutes = venue.travelFromA?.durationMinutes;
  if (typeof minutes === "number" && venue.travelFromA?.status === "OK") return `about ${minutes} min away`;
  return null;
}

function travelChip(venue: ScoredVenue, results: SearchHalfwayResponse): string | null {
  if (results.searchMode === "midpoint") {
    const diff = venue.timeDifferenceMinutes;
    if (typeof diff === "number" && diff <= 10) return "Fair for both";
    return null;
  }
  const minutes = venue.travelFromA?.durationMinutes;
  if (typeof minutes === "number" && venue.travelFromA?.status === "OK") return `${minutes} min away`;
  return null;
}

function formatEventWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatCount(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0";
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return String(value);
}

function formatPriceLevel(priceLevel?: string): string | null {
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

function mapsSearch(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query.trim())}`;
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
