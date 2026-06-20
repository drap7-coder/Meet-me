import type { WatchSubcategory } from "@/lib/types";
import { detectEventsIntent, detectWatchIntent } from "@/lib/watchEvents";

export type KoiBrowseLaneId = "places" | "watch" | "events";

export type KoiBrowseOption = {
  id: string;
  label: string;
  query: string;
  watchSubcategory?: WatchSubcategory;
};

export type KoiBrowseLane = {
  id: KoiBrowseLaneId;
  label: string;
  description: string;
  iconCategory: string;
  featured?: boolean;
  options: KoiBrowseOption[];
};

export const KOI_BROWSE_LANES: KoiBrowseLane[] = [
  {
    id: "places",
    label: "Places",
    description: "Meetups, coffee, food, and activities.",
    iconCategory: "coffee",
    featured: true,
    options: [
      { id: "coffee", label: "Coffee between us", query: "Coffee between Hoboken and Edison" },
      { id: "dinner", label: "Dinner near me", query: "Dinner near me" },
      { id: "brewery", label: "Brewery halfway", query: "Brewery halfway between Philly and Princeton" },
      { id: "shopping", label: "Shopping nearby", query: "Shopping between Hoboken and Edison" },
      { id: "brunch", label: "Brunch near me", query: "Brunch near me" },
      { id: "activities", label: "Something fun", query: "Bowling between Hoboken and Edison" }
    ]
  },
  {
    id: "watch",
    label: "Watch",
    description: "Movies, TV, trending picks, and streaming ideas.",
    iconCategory: "events",
    options: [
      {
        id: "funny-movies",
        label: "Funny movies like Superbad",
        query: "Funny movies like Superbad",
        watchSubcategory: "movies"
      },
      {
        id: "action-movies",
        label: "Action movies",
        query: "Best action movies tonight",
        watchSubcategory: "movies"
      },
      {
        id: "movies-like",
        label: "Movies like…",
        query: "Movies like The Dark Knight",
        watchSubcategory: "movies"
      },
      {
        id: "sci-fi-tv",
        label: "Sci-fi TV",
        query: "Best sci-fi TV shows tonight",
        watchSubcategory: "tv_shows"
      },
      {
        id: "trending",
        label: "Trending",
        query: "Trending movies this week",
        watchSubcategory: "trending"
      },
      {
        id: "comfort",
        label: "Comfort rewatch",
        query: "Comfort rewatch series",
        watchSubcategory: "tv_shows"
      }
    ]
  },
  {
    id: "events",
    label: "Events",
    description: "Movie theaters, sports, concerts, festivals, and local plans.",
    iconCategory: "sports",
    options: [
      { id: "movie-theaters", label: "Movie theaters", query: "Movie theaters near me tonight" },
      { id: "concerts", label: "Concerts this weekend", query: "Concerts this weekend" },
      { id: "comedy", label: "Comedy", query: "Any comedy shows near me this weekend?" },
      { id: "sports", label: "Sports", query: "Sports games near me tonight" },
      { id: "festivals", label: "Festivals", query: "Festivals near me this weekend" },
      { id: "things-to-do", label: "Things to do", query: "Things to do near me tonight" }
    ]
  }
];

export type KoiFeaturedExample = KoiBrowseOption & {
  emoji: string;
};

/** Human, tappable starters — one row under the ask box. */
export const KOI_FEATURED_EXAMPLES: KoiFeaturedExample[] = [
  { id: "coffee", emoji: "☕", label: "Coffee between us", query: "Coffee between Hoboken and Edison" },
  {
    id: "brewery",
    emoji: "🍺",
    label: "Brewery halfway",
    query: "Brewery halfway between Philly and Princeton"
  },
  { id: "pizza", emoji: "🍕", label: "Pizza near me", query: "Pizza near me" },
  {
    id: "funny-movies",
    emoji: "🎬",
    label: "Funny movies like Superbad",
    query: "Funny movies like Superbad",
    watchSubcategory: "movies"
  },
  { id: "concerts", emoji: "🎵", label: "Concerts this weekend", query: "Concerts this weekend" }
];

export const DEFAULT_BROWSE_LANE_ID: KoiBrowseLaneId = "places";

export function getBrowseLaneById(id: KoiBrowseLaneId) {
  return KOI_BROWSE_LANES.find((lane) => lane.id === id) ?? KOI_BROWSE_LANES[0];
}

export function getBrowseLaneForQuery(query: string): KoiBrowseLane {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return getBrowseLaneById(DEFAULT_BROWSE_LANE_ID);

  for (const lane of KOI_BROWSE_LANES) {
    if (lane.options.some((option) => option.query.trim().toLowerCase() === normalized)) {
      return lane;
    }
  }

  if (detectWatchIntent(query)) {
    return getBrowseLaneById("watch");
  }

  if (detectEventsIntent(query)) {
    return getBrowseLaneById("events");
  }

  return getBrowseLaneById(DEFAULT_BROWSE_LANE_ID);
}
