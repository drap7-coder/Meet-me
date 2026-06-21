import type { WatchSubcategory } from "@/lib/types";
import { detectWatchIntent } from "@/lib/watchEvents";

export type KoiBrowseLaneId = "places" | "watch";

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
    description: "Restaurants, coffee, drinks, shopping, activities, and halfway spots.",
    iconCategory: "coffee",
    featured: true,
    options: [
      { id: "coffee", label: "Coffee halfway", query: "Coffee halfway between Hoboken and Princeton" },
      { id: "brewery", label: "Brewery halfway", query: "Brewery halfway between us" },
      { id: "pizza", label: "Pizza near me", query: "Pizza near me" },
      { id: "dinner", label: "Dinner near me", query: "Dinner near me" },
      { id: "shopping", label: "Shopping nearby", query: "Shopping near me" },
      { id: "activities", label: "Something fun", query: "Bowling between Hoboken and Edison" }
    ]
  },
  {
    id: "watch",
    label: "Watch",
    description: "Streaming picks, TV, movies, and nearby theaters.",
    iconCategory: "events",
    options: [
      {
        id: "funny-movies",
        label: "Funny movies like Superbad",
        query: "Funny movies like Superbad",
        watchSubcategory: "movies"
      },
      {
        id: "sci-fi-tv",
        label: "Best sci-fi shows",
        query: "Best sci-fi shows to stream",
        watchSubcategory: "tv_shows"
      },
      {
        id: "stream-tonight",
        label: "Shows to stream tonight",
        query: "Best shows to stream tonight",
        watchSubcategory: "tv_shows"
      },
      {
        id: "movies-nearby",
        label: "Movies playing nearby",
        query: "Movies playing nearby tonight",
        watchSubcategory: "movies"
      },
      {
        id: "theaters",
        label: "Movie theaters near me",
        query: "Movie theaters near me tonight",
        watchSubcategory: "movies"
      },
      {
        id: "trending",
        label: "Trending movies",
        query: "Trending movies this week",
        watchSubcategory: "trending"
      }
    ]
  }
];

export type KoiFeaturedExample = KoiBrowseOption;

/** Compact prompt chips under the ask box. */
export const KOI_FEATURED_EXAMPLES: KoiFeaturedExample[] = [
  { id: "coffee", label: "Coffee halfway between Hoboken and Princeton", query: "Coffee halfway between Hoboken and Princeton" },
  { id: "pizza", label: "Pizza near me", query: "Pizza near me" },
  {
    id: "funny-movies",
    label: "Funny movies like Superbad",
    query: "Funny movies like Superbad",
    watchSubcategory: "movies"
  },
  {
    id: "stream-tonight",
    label: "Best shows to stream tonight",
    query: "Best shows to stream tonight",
    watchSubcategory: "tv_shows"
  },
  {
    id: "movies-nearby",
    label: "Movies playing nearby tonight",
    query: "Movies playing nearby tonight",
    watchSubcategory: "movies"
  }
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

  return getBrowseLaneById(DEFAULT_BROWSE_LANE_ID);
}
