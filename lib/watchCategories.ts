import type { VenueCategory } from "@/lib/types";

export type WatchUiOption = {
  label: string;
  query: string;
};

export type WatchUiGroup = {
  label: string;
  options: WatchUiOption[];
};

export type WatchCategoryOption = {
  id: string;
  label: string;
  query: string;
  iconCategory: VenueCategory;
};

export type WatchCategoryGroup = {
  id: string;
  label: string;
  description: string;
  iconCategory: VenueCategory;
  options: WatchCategoryOption[];
};

export const WATCH_UI_GROUPS: WatchUiGroup[] = [
  {
    label: "Streaming",
    options: [
      { label: "Trending Shows", query: "What should we watch tonight?" },
      { label: "New Releases", query: "What new releases should we watch tonight?" },
      { label: "Netflix", query: "What's trending on Netflix?" },
      { label: "Hulu", query: "What's trending on Hulu?" },
      { label: "Prime Video", query: "What's trending on Prime Video?" },
      { label: "Apple TV+", query: "What's trending on Apple TV+?" }
    ]
  },
  {
    label: "Movies",
    options: [
      { label: "Movies Tonight", query: "What should we watch tonight?" },
      { label: "Movie Theaters", query: "Movie theater near me" },
      { label: "Date Night Movies", query: "Best date night movies tonight" },
      { label: "Family Movies", query: "Best family movies tonight" }
    ]
  },
  {
    label: "Sports",
    options: [
      { label: "Live Sports", query: "What live sports are on tonight?" },
      { label: "Eagles Game", query: "Best place to watch the Eagles game near me" },
      { label: "Phillies Game", query: "Best place to watch the Phillies game near me" },
      { label: "Soccer Matches", query: "Where can I watch soccer matches tonight?" },
      { label: "Sports Bars", query: "Find a sports bar near me" }
    ]
  }
];

export const WATCH_CATEGORY_GROUPS: WatchCategoryGroup[] = [
  {
    id: "streaming",
    label: "Streaming",
    description: "Trending shows and what to stream tonight.",
    iconCategory: "events",
    options: [
      { id: "trending-shows", label: "Trending Shows", query: "What should we watch tonight?", iconCategory: "events" },
      { id: "new-releases", label: "New Releases", query: "What new releases should we watch tonight?", iconCategory: "events" },
      { id: "netflix", label: "Netflix", query: "What's trending on Netflix?", iconCategory: "events" },
      { id: "hulu", label: "Hulu", query: "What's trending on Hulu?", iconCategory: "events" },
      { id: "prime-video", label: "Prime Video", query: "What's trending on Prime Video?", iconCategory: "events" },
      { id: "apple-tv", label: "Apple TV+", query: "What's trending on Apple TV+?", iconCategory: "events" }
    ]
  },
  {
    id: "movies",
    label: "Movies",
    description: "Movie nights, theaters, and date-night picks.",
    iconCategory: "events",
    options: [
      { id: "movies-tonight", label: "Movies Tonight", query: "What should we watch tonight?", iconCategory: "events" },
      { id: "movie-theaters", label: "Movie Theaters", query: "Movie theater near me", iconCategory: "events" },
      { id: "date-night-movies", label: "Date Night Movies", query: "Best date night movies tonight", iconCategory: "events" },
      { id: "family-movies", label: "Family Movies", query: "Best family movies tonight", iconCategory: "events" }
    ]
  },
  {
    id: "sports",
    label: "Sports",
    description: "Live games, matches, and sports bars.",
    iconCategory: "sports",
    options: [
      { id: "live-sports", label: "Live Sports", query: "What live sports are on tonight?", iconCategory: "sports" },
      { id: "eagles-game", label: "Eagles Game", query: "Best place to watch the Eagles game near me", iconCategory: "sports" },
      { id: "phillies-game", label: "Phillies Game", query: "Best place to watch the Phillies game near me", iconCategory: "sports" },
      { id: "soccer-matches", label: "Soccer Matches", query: "Where can I watch soccer matches tonight?", iconCategory: "sports" },
      { id: "sports-bars", label: "Sports Bars", query: "Find a sports bar near me", iconCategory: "sports_bars" }
    ]
  }
];

export function getWatchCategoryGroupForQuery(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return WATCH_CATEGORY_GROUPS[0];

  for (const group of WATCH_CATEGORY_GROUPS) {
    if (group.options.some((option) => option.query.trim().toLowerCase() === normalized)) {
      return group;
    }
  }

  return WATCH_CATEGORY_GROUPS[0];
}

export const WATCH_EVENTS_EXAMPLE_PROMPTS = [
  "What should we watch tonight?",
  "What's trending on Netflix?",
  "Find a sports bar between Princeton and Philly",
  "Best place to watch the Eagles game near me",
  "Movie theater between Hoboken and Edison"
];

export const WATCH_EVENTS_PLACEHOLDER = "Ask Koi what to watch, stream, or catch live…";
