import type { SearchHalfwayRequest, VenueCategory } from "@/lib/types";

type LocationContext = Pick<
  SearchHalfwayRequest,
  | "locationA"
  | "locationB"
  | "locationAPlaceId"
  | "locationBPlaceId"
  | "locationACoordinates"
  | "locationBCoordinates"
  | "searchMode"
>;

const WATCH_VENUE_NOUN_PATTERN =
  /\b(?:sports bars?|game day bars?|movie theaters?|movie theatres?|cinemas?)\b/i;
const WATCH_AT_VENUE_PATTERN = /\bbest place to watch\b|\bfind (?:a )?sports bar\b/i;
const WATCH_SPORT_AT_PLACE_PATTERN =
  /\b(?:watch|catch)\b.*\b(?:football|baseball|soccer|basketball|hockey|game)\b.*\b(?:near|between|around|in|bar|place|spot)\b/i;
const STREAMING_ONLY_PATTERN = /\b(?:stream(?:ing)?|online|at home|on (?:tv|television|netflix|hulu|peacock|espn\+))\b/i;

export function isWatchPlaceSearchQuery(query: string): boolean {
  const trimmed = query.trim();
  if (!trimmed) return false;

  if (WATCH_VENUE_NOUN_PATTERN.test(trimmed)) return true;
  if (WATCH_AT_VENUE_PATTERN.test(trimmed) && hasLocationHint(trimmed)) return true;

  if (WATCH_SPORT_AT_PLACE_PATTERN.test(trimmed)) {
    if (STREAMING_ONLY_PATTERN.test(trimmed) && !/\b(?:bar|place|spot|near|between)\b/i.test(trimmed)) {
      return false;
    }
    return true;
  }

  if (
    /\b(?:sports bar|movie theater|movie theatre|cinema)\b/i.test(trimmed) &&
    hasLocationHint(trimmed)
  ) {
    return true;
  }

  return false;
}

export function resolveWatchPlaceSearchForm(
  query: string,
  context?: LocationContext
): SearchHalfwayRequest | null {
  if (!isWatchPlaceSearchQuery(query)) return null;

  const parsed = parseLocationsFromQuery(query);
  const categoryIntent = resolveWatchPlaceCategory(query);
  const searchMode = resolveSearchMode(query, parsed, context);
  const locationA = parsed.locationA || context?.locationA?.trim() || "";
  const locationB =
    searchMode === "single" ? "" : parsed.locationB || context?.locationB?.trim() || "";

  return {
    locationA,
    locationB,
    locationAPlaceId: parsed.locationA ? undefined : context?.locationAPlaceId,
    locationBPlaceId: parsed.locationB ? undefined : context?.locationBPlaceId,
    locationACoordinates: parsed.locationA ? undefined : context?.locationACoordinates,
    locationBCoordinates: parsed.locationB ? undefined : context?.locationBCoordinates,
    category: categoryIntent.category,
    searchMode,
    meetupMode: "single",
    customQuery: categoryIntent.customQuery ?? ""
  };
}

export function watchPlaceSearchNeedsLocation(query: string, form?: LocationContext): boolean {
  const resolved = resolveWatchPlaceSearchForm(query, form);
  if (!resolved) return false;
  if (resolved.locationA) {
    return resolved.searchMode === "midpoint" && !resolved.locationB;
  }
  return true;
}

function resolveWatchPlaceCategory(query: string): { category: VenueCategory; customQuery?: string } {
  const normalized = query.toLowerCase();

  if (/\b(?:movie theaters?|movie theatres?|cinemas?)\b/i.test(normalized)) {
    return { category: "custom", customQuery: "movie theater" };
  }

  if (/\b(?:sports bars?|game day bars?)\b/i.test(normalized)) {
    return { category: "sports_bars" };
  }

  if (
    /\bbest place to watch\b/i.test(normalized) ||
    (/\b(?:watch|catch)\b.*\b(?:football|baseball|soccer|basketball|hockey|game)\b/i.test(normalized) &&
      /\b(?:near|between|bar|place|spot)\b/i.test(normalized))
  ) {
    return { category: "sports_bars" };
  }

  return { category: "sports_bars" };
}

function resolveSearchMode(
  query: string,
  parsed: { locationA: string; locationB: string; searchMode: "single" | "midpoint" },
  context?: LocationContext
): "single" | "midpoint" {
  if (parsed.locationA && parsed.locationB) return "midpoint";
  if (parsed.locationA && !parsed.locationB) return "single";
  if (looksLikeMidpointQuery(query) || (context?.searchMode === "midpoint" && context.locationB?.trim())) {
    return "midpoint";
  }
  return "single";
}

function parseLocationsFromQuery(query: string): {
  locationA: string;
  locationB: string;
  searchMode: "single" | "midpoint";
} {
  const betweenMatch = query.match(
    /\bbetween\s+(.+?)\s+(?:and|&)\s+(.+?)(?:\s+(?:with|for|near|that|where|$).*)?$/i
  );
  if (betweenMatch) {
    return {
      locationA: cleanupLocation(betweenMatch[1]),
      locationB: cleanupLocation(betweenMatch[2]),
      searchMode: "midpoint"
    };
  }

  if (/\bnear me\b/i.test(query)) {
    return { locationA: "", locationB: "", searchMode: "single" };
  }

  const nearMatch = query.match(
    /\b(?:near|around|in)\s+(.+?)(?:\s+(?:with|that|where|this|on|for|tonight|today|weekend|open|$).*)?$/i
  );
  if (nearMatch) {
    const location = cleanupLocation(nearMatch[1]);
    if (location && !/^me$/i.test(location)) {
      return { locationA: location, locationB: "", searchMode: "single" };
    }
  }

  return { locationA: "", locationB: "", searchMode: "single" };
}

function hasLocationHint(query: string): boolean {
  return (
    /\bnear me\b/i.test(query) ||
    /\bnear\s+\S/i.test(query) ||
    /\b(?:around|in)\s+\S/i.test(query) ||
    /\bbetween\s+.+\s+(?:and|&)\s+/i.test(query) ||
    /\bhalfway\b/i.test(query)
  );
}

function looksLikeMidpointQuery(query: string) {
  return /\b(?:between|halfway|midway|middle)\b/i.test(query);
}

function cleanupLocation(value: string) {
  return value
    .replace(/^(?:me|us|everyone|people)\s+/i, "")
    .replace(/\b(?:halfway|midway|in the middle)\b/gi, "")
    .replace(/[?.!,]+$/g, "")
    .trim();
}
