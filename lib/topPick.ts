import { getPrimaryCategoryId } from "@/lib/categories";
import { eventDistanceChip, mapsSearch, venueSignalChips } from "@/lib/resultSignals";
import type { EventResult, PlaceInsight, ScoredVenue, SearchHalfwayResponse } from "@/lib/types";

export type TopPickCta = {
  label: string;
  href: string;
};

export type TopPickKind = "place" | "event" | "night_out";

export type TopPickProfile =
  | "date_night"
  | "family"
  | "sports"
  | "events"
  | "restaurants"
  | "halfway"
  | "streaming"
  | "place";

export type TopPick = {
  kind: TopPickKind;
  profile: TopPickProfile;
  eyebrow: string;
  headline: string;
  summary: string;
  chips: string[];
  primary: TopPickCta;
  secondary?: TopPickCta;
  imageUrl?: string;
  /** Optional "why it's interesting" context (e.g. Wikipedia), when enriched. */
  insight?: PlaceInsight;
  /** EV charging context for the top venue, when travel mode is EV. */
  evCharging?: ScoredVenue["evCharging"];
};

/** Max straight-line miles between a place and an event to still call it "nearby". */
const MAX_PAIR_MILES = 6;

/**
 * Collapse a results payload into one calm, confident recommendation built only
 * from data already fetched (ranking order, rating, hours, price, travel time,
 * event time/venue/coords). No extra API calls — this just decides, and it hedges
 * when the data is thin rather than overselling.
 */
export function buildTopPick(results: SearchHalfwayResponse): TopPick | null {
  const venue = results.venues?.[0];
  const event = results.events?.[0];
  const profile = resolveProfile(results);

  if (venue && event && shouldPairForNightOut(venue, event)) {
    return buildNightOut(venue, event, results, profile);
  }

  // Both exist but pairing confidence is low: fall back to the single best pick.
  if (venue && event) {
    return isEventPrimary(profile) ? buildEventPick(event, profile) : buildPlacePick(venue, results, profile);
  }

  if (venue) return buildPlacePick(venue, results, profile);
  if (event) return buildEventPick(event, profile);
  return null;
}

function resolveProfile(results: SearchHalfwayResponse): TopPickProfile {
  if (results.searchMode === "midpoint") return "halfway";

  switch (results.eventProfile) {
    case "date_night":
      return "date_night";
    case "family":
      return "family";
    case "sports":
      return "sports";
    case "music":
    case "tonight":
    case "weekend":
    case "general":
      return "events";
    default:
      break;
  }

  const primary = getPrimaryCategoryId(results.category);
  if (primary === "food" || primary === "drinks") return "restaurants";
  if (primary === "family") return "family";
  return "place";
}

function isEventPrimary(profile: TopPickProfile): boolean {
  return profile === "sports" || profile === "events";
}

// --- Place pick -------------------------------------------------------------

function buildPlacePick(venue: ScoredVenue, results: SearchHalfwayResponse, profile: TopPickProfile): TopPick {
  return {
    kind: "place",
    profile,
    eyebrow: placeEyebrow(profile),
    headline: venue.name,
    summary: placeSummary(venue, results, profile),
    chips: placeChips(venue, results),
    primary: { label: "Get directions", href: venue.googleMapsUri },
    secondary: venue.websiteUri ? { label: "Visit site", href: venue.websiteUri } : undefined,
    insight: venue.insight,
    evCharging: venue.evCharging
  };
}

function placeEyebrow(profile: TopPickProfile): string {
  switch (profile) {
    case "date_night":
    case "restaurants":
      return "Best bet";
    case "family":
      return "Family pick";
    case "halfway":
      return "Good halfway pick";
    default:
      return "Koi's pick";
  }
}

function placeSummary(venue: ScoredVenue, results: SearchHalfwayResponse, profile: TopPickProfile): string {
  const rating = ratingPhrase(venue);
  const strongRating = rating === "highly rated" || rating === "well reviewed";
  const openNow = venue.openNow === true ? "open now" : null;
  const closed = venue.openNow === false;
  const travel = travelPhrase(venue, results);

  const signals = [rating, openNow, travel].filter((value): value is string => Boolean(value));
  const confident = !closed && (strongRating || signals.length >= 2);

  let lead: string;
  let body = [...signals];

  if (profile === "halfway") {
    if (travel) {
      lead = capitalize(travel);
      body = body.filter((value) => value !== travel);
    } else {
      lead = "A reasonable middle-ground option";
    }
  } else {
    lead = placeLead(profile, confident);
  }

  if (closed) {
    // Stay honest: hedge the lead and call out the closure as its own short sentence.
    const items = [lead, ...body.filter((value) => value !== openNow)];
    return `${joinList(items)}. Closed right now.`;
  }

  return `${joinList([lead, ...body])}.`;
}

function placeLead(profile: TopPickProfile, confident: boolean): string {
  switch (profile) {
    case "date_night":
      return confident ? "A strong date-night choice" : "Could work for date night";
    case "family":
      return confident ? "An easy family pick" : "Might suit the family";
    case "restaurants":
      return confident ? "A solid choice" : "Worth a look";
    case "streaming":
      return confident ? "Worth a watch" : "Might be worth a watch";
    default:
      return confident ? "A solid pick" : "Worth a look";
  }
}

// --- Event pick -------------------------------------------------------------

function buildEventPick(event: EventResult, profile: TopPickProfile): TopPick {
  return {
    kind: "event",
    profile,
    eyebrow: isTonight(event) ? "For tonight" : "Koi's pick",
    headline: event.title,
    summary: eventSummary(event),
    chips: eventChips(event),
    primary: event.ticketUrl
      ? { label: "Get tickets", href: event.ticketUrl }
      : { label: "Open in Maps", href: mapsSearch([event.venue, event.city, event.state].filter(Boolean).join(" ")) },
    imageUrl: event.imageUrl
  };
}

function eventSummary(event: EventResult): string {
  const when = whenPhrase(event.startTime);
  if (!when && !event.venue) return "Tickets available soon.";
  if (!when) return `At ${event.venue}.`;
  return event.venue ? `${when} at ${event.venue}.` : `${when}.`;
}

// --- Night out (pairing) ----------------------------------------------------

function shouldPairForNightOut(venue: ScoredVenue, event: EventResult): boolean {
  // Place must be open right now (unknown hours = not confident enough).
  if (venue.openNow !== true) return false;

  // Event must be later today and still upcoming.
  const start = new Date(event.startTime);
  if (Number.isNaN(start.getTime())) return false;
  const now = new Date();
  if (start.getTime() < now.getTime()) return false;
  if (!isSameLocalDay(start, now)) return false;

  // Place and event must be a reasonable distance apart (and we must be able to tell).
  const miles = milesBetween(venue, event);
  if (miles == null || miles > MAX_PAIR_MILES) return false;

  return true;
}

function buildNightOut(
  venue: ScoredVenue,
  event: EventResult,
  results: SearchHalfwayResponse,
  profile: TopPickProfile
): TopPick {
  const eventNoun = eventActivityNoun(event);
  const placeNoun = placeActivityNoun(venue);
  const when = shortTime(event.startTime);
  const eyebrow = isTonight(event) ? "For tonight" : "Make a night of it";

  if (isEventPrimary(profile)) {
    return {
      kind: "night_out",
      profile,
      eyebrow,
      headline: `${capitalize(eventNoun)} + ${placeNoun}`,
      summary: `${capitalize(eventNoun)} at ${event.venue}${when ? ` at ${when}` : ""}, then ${placeNoun} nearby.`,
      chips: eventChips(event),
      primary: event.ticketUrl
        ? { label: "Get tickets", href: event.ticketUrl }
        : { label: "Open in Maps", href: mapsSearch([event.venue, event.city].filter(Boolean).join(" ")) },
      secondary: { label: `${capitalize(placeNoun)} at ${truncate(venue.name, 28)}`, href: venue.googleMapsUri },
      imageUrl: event.imageUrl
    };
  }

  return {
    kind: "night_out",
    profile,
    eyebrow,
    headline: `${capitalize(placeNoun)} + ${eventNoun}`,
    summary: `${capitalize(placeNoun)} at ${venue.name}, then ${eventNoun} at ${event.venue}${when ? ` at ${when}` : ""}.`,
    chips: placeChips(venue, results),
    primary: { label: "Directions to dinner", href: venue.googleMapsUri },
    secondary: event.ticketUrl ? { label: `Then: ${truncate(event.title, 28)}`, href: event.ticketUrl } : undefined,
    imageUrl: event.imageUrl,
    insight: venue.insight,
    evCharging: venue.evCharging
  };
}

// --- Shared signal helpers --------------------------------------------------

function placeChips(venue: ScoredVenue, results: SearchHalfwayResponse): string[] {
  return venueSignalChips(venue, results.searchMode);
}

function eventChips(event: EventResult): string[] {
  const chips: string[] = [];
  const distance = eventDistanceChip(event);
  if (distance) chips.push(distance);
  if (event.city) chips.push(`${event.city}${event.state ? `, ${event.state}` : ""}`);
  return chips.slice(0, 3);
}

function ratingPhrase(venue: ScoredVenue): string | null {
  if (typeof venue.rating !== "number") return null;
  const count = venue.reviewCount;
  if (venue.rating >= 4.5 && count >= 75) return "highly rated";
  if (venue.rating >= 4.2 && count >= 30) return "well reviewed";
  if (venue.rating >= 4.0 && count >= 10) return "good reviews so far";
  return null; // thin review data → don't assert quality
}

function travelPhrase(venue: ScoredVenue, results: SearchHalfwayResponse): string | null {
  if (results.searchMode === "midpoint") {
    const diff = venue.timeDifferenceMinutes;
    if (typeof diff === "number" && diff <= 5) return "similar drive for both of you";
    if (typeof diff === "number" && diff <= 12) return "a fair trip for both of you";
    return null;
  }
  const minutes = venue.travelFromA?.durationMinutes;
  if (typeof minutes !== "number" || venue.travelFromA?.status !== "OK") return null;
  if (minutes <= 10) return "an easy drive";
  if (minutes <= 20) return "a short drive";
  return `about ${minutes} min away`;
}

function eventActivityNoun(event: EventResult): string {
  const haystack = `${event.category} ${event.title}`.toLowerCase();
  if (/comedy|stand[- ]?up/.test(haystack)) return "comedy";
  if (/sports|baseball|basketball|football|hockey|soccer|game|vs\.?/.test(haystack)) return "the game";
  if (/theat(?:er|re)|broadway|musical|play/.test(haystack)) return "a show";
  if (/concert|music|festival|tour|live/.test(haystack)) return "a show";
  return "the event";
}

function placeActivityNoun(venue: ScoredVenue): string {
  const haystack = `${venue.category} ${(venue.types ?? []).join(" ")}`.toLowerCase();
  if (/bar|brew|pub|cocktail|lounge|wine|tavern/.test(haystack)) return "drinks";
  if (/coffee|cafe|espresso/.test(haystack)) return "coffee";
  if (/dessert|ice cream|bakery/.test(haystack)) return "dessert";
  return "dinner";
}

// --- Time + distance utilities ----------------------------------------------

function isTonight(event: EventResult): boolean {
  const start = new Date(event.startTime);
  if (Number.isNaN(start.getTime())) return false;
  return isSameLocalDay(start, new Date()) && start.getTime() >= Date.now();
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function whenPhrase(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const weekday = date.toLocaleDateString(undefined, { weekday: "long" });
  const withinWeek = date.getTime() - Date.now() < 6 * 24 * 3600 * 1000;
  if (withinWeek) return `${weekday} at ${time}`;
  const monthDay = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${weekday}, ${monthDay} at ${time}`;
}

function shortTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function milesBetween(venue: ScoredVenue, event: EventResult): number | null {
  const lat1 = venue.location?.lat;
  const lng1 = venue.location?.lng;
  const lat2 = event.latitude;
  const lng2 = event.longitude;
  if (![lat1, lng1, lat2, lng2].every((value) => typeof value === "number")) return null;
  return haversineMiles(lat1 as number, lng1 as number, lat2 as number, lng2 as number);
}

function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// --- Formatting -------------------------------------------------------------

function joinList(items: string[]): string {
  const parts = items.filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
