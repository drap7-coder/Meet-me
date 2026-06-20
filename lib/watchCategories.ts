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

export const WATCH_CATEGORY_GROUPS: WatchCategoryGroup[] = [
  {
    id: "movies",
    label: "Movies",
    description: "Theaters, date nights, and movie picks for tonight.",
    iconCategory: "events",
    options: [
      { id: "drama", label: "Drama", query: "Best drama movies tonight", iconCategory: "events" },
      { id: "sci-fi", label: "Sci-Fi", query: "Best sci-fi movies tonight", iconCategory: "events" },
      { id: "comedy", label: "Comedy", query: "Best comedy movies tonight", iconCategory: "events" },
      { id: "action", label: "Action", query: "Best action movies tonight", iconCategory: "events" },
      { id: "horror", label: "Horror", query: "Best horror movies tonight", iconCategory: "events" },
      { id: "romance", label: "Romance", query: "Best romance movies tonight", iconCategory: "events" },
      { id: "movie-theaters", label: "Movie Theaters", query: "Movie theater near me", iconCategory: "events" }
    ]
  },
  {
    id: "sports",
    label: "Sports",
    description: "Live games, matches, and sports bars.",
    iconCategory: "sports",
    options: [
      { id: "live-sports", label: "Live Sports", query: "What live sports are on tonight?", iconCategory: "sports" },
      { id: "football", label: "Football", query: "Best place to watch football near me", iconCategory: "sports" },
      { id: "baseball", label: "Baseball", query: "Best place to watch baseball near me", iconCategory: "sports" },
      { id: "soccer", label: "Soccer", query: "Where can I watch soccer tonight?", iconCategory: "sports" },
      { id: "sports-bars", label: "Sports Bars", query: "Find a sports bar near me", iconCategory: "sports_bars" }
    ]
  },
  {
    id: "live_events",
    label: "Live Events",
    description: "Concerts, comedy, and things happening nearby.",
    iconCategory: "events",
    options: [
      { id: "live-events", label: "Live Events", query: "What's happening near me this weekend?", iconCategory: "events" },
      { id: "concerts", label: "Concerts", query: "Any concerts near me this weekend?", iconCategory: "events" },
      { id: "comedy", label: "Comedy", query: "Any comedy shows near me this weekend?", iconCategory: "events" },
      { id: "things-to-do", label: "Things To Do", query: "Things to do near me tonight", iconCategory: "events" }
    ]
  },
  {
    id: "tv_shows",
    label: "TV & Shows",
    description: "What is on TV and easy picks for tonight.",
    iconCategory: "events",
    options: [
      { id: "whats-on-tv", label: "What's on TV", query: "What's on TV tonight?", iconCategory: "events" },
      { id: "trending-shows", label: "Trending Shows", query: "What should we watch tonight?", iconCategory: "events" },
      { id: "new-releases", label: "New Releases", query: "What new releases should we watch tonight?", iconCategory: "events" }
    ]
  }
];

export const DEFAULT_WATCH_CATEGORY_GROUP = WATCH_CATEGORY_GROUPS[0];
export const DEFAULT_WATCH_QUERY = DEFAULT_WATCH_CATEGORY_GROUP.options[0].query;

export const WATCH_UI_GROUPS: WatchUiGroup[] = WATCH_CATEGORY_GROUPS.map((group) => ({
  label: group.label,
  options: group.options.map(({ label, query }) => ({ label, query }))
}));

export function getWatchCategoryGroupForQuery(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return DEFAULT_WATCH_CATEGORY_GROUP;

  for (const group of WATCH_CATEGORY_GROUPS) {
    if (group.options.some((option) => option.query.trim().toLowerCase() === normalized)) {
      return group;
    }
  }

  if (/\b(?:movie theater|movie theatre|cinema|cinemas)\b/i.test(normalized)) {
    return WATCH_CATEGORY_GROUPS.find((group) => group.id === "movies") ?? DEFAULT_WATCH_CATEGORY_GROUP;
  }

  if (
    /\b(?:drama|sci-fi|science fiction|comedy|action|horror|romance|thriller|documentary)\b/i.test(normalized) &&
    /\b(?:movie|movies|film|films|tonight)\b/i.test(normalized)
  ) {
    return WATCH_CATEGORY_GROUPS.find((group) => group.id === "movies") ?? DEFAULT_WATCH_CATEGORY_GROUP;
  }

  return DEFAULT_WATCH_CATEGORY_GROUP;
}

export const WATCH_EVENTS_EXAMPLE_PROMPTS = [
  "Best sci-fi movies tonight",
  "Find a sports bar between Princeton and Philly",
  "Movie theater between Hoboken and Edison",
  "Any comedy shows near Philly this weekend?",
  "Best place to watch football near me"
];

export const WATCH_EVENTS_PLACEHOLDER = "Ask Koi about movies, sports, live events, or what to watch tonight…";
