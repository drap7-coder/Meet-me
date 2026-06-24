import type { LocalEventProfile } from "@/lib/eventResult";
import type { VenueCategory } from "@/lib/types";
import { detectEventsIntent } from "@/lib/watchEvents";

const PLACE_ONLY_CATEGORIES = new Set<VenueCategory>([
  "restaurant",
  "coffee",
  "shopping",
  "malls",
  "outlets",
  "pizza",
  "sushi",
  "italian",
  "mexican",
  "thai",
  "indian",
  "steakhouse",
  "brunch",
  "breakfast",
  "bbq",
  "breweries",
  "cocktail_bars",
  "wine_bars",
  "dessert",
  "thrifting",
  "vintage",
  "bookstore"
]);

const PLACE_ONLY_QUERY =
  /\b(?:restaurant|restaurants|coffee shop|coffee|cafe|pizza|sushi|brunch|lunch|dinner|breakfast|brewery|breweries|bar|cafe|shopping|mall|store|stores|bookstore)\b/i;

export function shouldFetchTicketmasterEvents(query: string, category?: VenueCategory): boolean {
  const trimmed = query.trim();
  if (!trimmed) return false;

  if (category && PLACE_ONLY_CATEGORIES.has(category) && !detectEventsIntent(trimmed)) {
    return false;
  }

  if (PLACE_ONLY_QUERY.test(trimmed) && !detectEventsIntent(trimmed)) {
    return false;
  }

  return detectEventsIntent(trimmed) || hasLocalEventProfile(trimmed) || category === "events";
}

function hasLocalEventProfile(query: string): boolean {
  return (
    /\b(?:things to do|date night|fun tonight|family activit|concerts?|comedy shows?|festivals?|live entertainment|what(?:'s| is) (?:happening|on) tonight|this weekend)\b/i.test(
      query
    ) || classifyLocalEventProfile(query) !== "general"
  );
}

export function classifyLocalEventProfile(query: string): LocalEventProfile {
  const value = query.toLowerCase();

  if (/\b(?:tonight|today|this evening|right now)\b/i.test(value)) {
    return "tonight";
  }

  if (/\b(?:date night|romantic|couples?)\b/i.test(value)) {
    return "date_night";
  }

  if (/\b(?:family|kids?|children)\b/i.test(value)) {
    return "family";
  }

  if (/\b(?:this weekend|saturday|sunday|weekend)\b/i.test(value)) {
    return "weekend";
  }

  return "general";
}

export function eventTimeWindow(profile: LocalEventProfile): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);

  switch (profile) {
    case "tonight":
      end.setDate(end.getDate() + 1);
      end.setHours(5, 0, 0, 0);
      return { start: now, end };
    case "weekend": {
      const day = now.getDay();
      const daysUntilSaturday = (6 - day + 7) % 7;
      start.setDate(start.getDate() + daysUntilSaturday);
      end.setTime(start.getTime());
      end.setDate(end.getDate() + 2);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    default:
      end.setDate(end.getDate() + 14);
      end.setHours(23, 59, 59, 999);
      return { start: now, end };
  }
}
