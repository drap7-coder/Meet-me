import type { KoiBotMode, WatchEventsResult } from "@/lib/types";

export const WATCH_EVENTS_TITLE = "Watch & Events";
export const WATCH_EVENTS_DESCRIPTION = "Find shows, movies, sports, concerts, comedy, and things to do.";
export const WATCH_EVENTS_PLACEHOLDER_MESSAGE =
  "Koi Watch & Events is coming soon. You'll be able to ask what to watch, where to stream it, what games are on, and what events are happening nearby.";

export const WATCH_EVENTS_FUTURE_PROVIDERS = [
  "TMDB",
  "Watchmode",
  "Streaming Availability API",
  "Ticketmaster",
  "SeatGeek",
  "ESPN",
  "SportsDataIO"
] as const;

const PLACE_MEETUP_PATTERN = /\b(?:between|halfway|midway|meet(?:up)?|halfway point)\b/i;
const PLACE_CATEGORY_PATTERN =
  /\b(?:coffee|cafe|restaurant|brunch|brewery|breweries|bar|bars|pizza|sushi|italian|mexican|thai|indian|steakhouse|bookstore|bowling|park(?:ing)?|hiking|hotel|mall|shopping)\b/i;
const SHOW_ME_PLACES_PATTERN =
  /\bshow me\b.*\b(?:coffee|restaurant|place|spot|bar|brewery|food|lunch|dinner|brunch|hotel|park)\b/i;

const STRONG_WATCH_EVENTS_PATTERNS = [
  /\bwhat (?:should|can|do) (?:i|we) watch\b/i,
  /\bwhere (?:can|to|should) (?:i|we) (?:watch|stream)\b/i,
  /\bwhat(?:'s| is) on (?:tv|television)\b/i,
  /\b(?:stream(?:ing)?|watch(?:ing)?) (?:on|via)\b/i,
  /\b(?:movie|movies|film|films|tv show|tv shows|television show)\b/i,
  /\b(?:comedy|concert|concerts|stand[- ]?up|festival|festivals)\b/i,
  /\b(?:live sports|sports on tv|game tonight|watch the .* game|watch .* game tonight)\b/i,
  /\b(?:tickets?|box office)\b/i,
  /\bfamily[- ]friendly events\b/i,
  /\blocal events\b/i,
  /\bevents near\b/i,
  /\bthings to do\b/i,
  /\bthis weekend\b.*\b(?:show|shows|concert|comedy|event|events|game)\b/i,
  /\b(?:show|shows|concert|comedy|event|events|game)\b.*\bthis weekend\b/i
];

const WATCH_EVENTS_KEYWORDS =
  /\b(?:watch|stream|streaming|movie|movies|film|concert|comedy|festival|tickets?|tv|television|game tonight|on tv|events)\b/i;

export function detectWatchEventsIntent(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return false;

  if (SHOW_ME_PLACES_PATTERN.test(trimmed)) return false;

  if (STRONG_WATCH_EVENTS_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    if (PLACE_MEETUP_PATTERN.test(trimmed) && PLACE_CATEGORY_PATTERN.test(trimmed) && !/\b(?:show|concert|comedy|game|stream|watch)\b/i.test(trimmed)) {
      return false;
    }
    return true;
  }

  if (/\bwhere can i watch\b/i.test(trimmed)) return true;
  if (/\bstream\b/i.test(trimmed) && /\b(?:interstellar|netflix|hulu|disney|prime video|max|peacock)\b/i.test(trimmed)) {
    return true;
  }

  if (WATCH_EVENTS_KEYWORDS.test(trimmed) && /\bnear\b/i.test(trimmed) && /\b(?:show|shows|concert|comedy|event|events|game)\b/i.test(trimmed)) {
    return true;
  }

  return false;
}

export function resolveKoiBotMode(query: string, requestedMode?: KoiBotMode): KoiBotMode {
  if (requestedMode === "watch_events") return "watch_events";
  if (detectWatchEventsIntent(query)) return "watch_events";
  return "places";
}

export function buildWatchEventsResult(query: string): WatchEventsResult {
  return {
    botMode: "watch_events",
    query: query.trim(),
    title: WATCH_EVENTS_TITLE,
    description: WATCH_EVENTS_DESCRIPTION,
    message: WATCH_EVENTS_PLACEHOLDER_MESSAGE,
    futureProviders: [...WATCH_EVENTS_FUTURE_PROVIDERS]
  };
}
