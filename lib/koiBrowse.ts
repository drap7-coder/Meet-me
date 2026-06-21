import type { WatchSubcategory } from "@/lib/types";
import { detectWatchIntent } from "@/lib/watchEvents";
import { KOI_EXAMPLE } from "@/lib/koiExamples";

export type KoiBrowseLaneId = "places" | "watch";

export type KoiBrowseOption = {
  id: string;
  label: string;
  query: string;
  watchSubcategory?: WatchSubcategory;
  cardIcon?: string;
  cardTitle?: string;
  cardSubtitle?: string;
  cardAccent?: "places" | "watch";
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
      { id: "dinner-halfway", label: "Dinner halfway", query: KOI_EXAMPLE.halfwayQuery },
      { id: "brewery", label: "Brewery halfway", query: KOI_EXAMPLE.breweryHalfwayQuery },
      { id: "pizza", label: "Pizza near me", query: "Pizza near me" },
      { id: "dinner", label: "Dinner near me", query: "Dinner near me" },
      { id: "shopping", label: "Shopping nearby", query: "Shopping near me" },
      { id: "activities", label: "Something fun", query: `Bowling between ${KOI_EXAMPLE.locationA} and ${KOI_EXAMPLE.locationB}` }
    ]
  },
  {
    id: "watch",
    label: "Watch",
    description: "TMDB streaming picks for movies, TV, and trending titles.",
    iconCategory: "events",
    options: [
      {
        id: "netflix-comedy",
        label: "Comedy on Netflix",
        query: KOI_EXAMPLE.streamQuery,
        watchSubcategory: "tv_shows"
      },
      {
        id: "funny-movies",
        label: "Funny movies like Superbad",
        query: KOI_EXAMPLE.funnyMoviesQuery,
        watchSubcategory: "movies"
      },
      {
        id: "sci-fi-tv",
        label: "Best sci-fi shows",
        query: KOI_EXAMPLE.sciFiShowsQuery,
        watchSubcategory: "tv_shows"
      },
      {
        id: "stream-tonight",
        label: "What should I watch tonight?",
        query: "What should I watch tonight?",
        watchSubcategory: "tv_shows"
      },
      {
        id: "trending",
        label: "Trending movies",
        query: KOI_EXAMPLE.trendingMoviesQuery,
        watchSubcategory: "trending"
      }
    ]
  }
];

export type KoiFeaturedExample = KoiBrowseOption;

export const KOI_GO_SOMEWHERE_QUERY = KOI_EXAMPLE.spotQuery;
export const KOI_WATCH_SOMETHING_QUERY = KOI_EXAMPLE.streamQuery;
export const KOI_FIND_EVENTS_QUERY = "Farmers markets near me today";

/** Compact prompt chips under the ask box. */
export const KOI_FEATURED_EXAMPLES: KoiFeaturedExample[] = [
  { id: "dinner-halfway", label: KOI_EXAMPLE.halfwayQuery, query: KOI_EXAMPLE.halfwayQuery },
  { id: "pizza", label: "Pizza near me", query: "Pizza near me" },
  {
    id: "netflix-comedy",
    label: "Comedy on Netflix",
    query: KOI_EXAMPLE.streamQuery,
    watchSubcategory: "tv_shows"
  },
  {
    id: "funny-movies",
    label: "Funny movies like Superbad",
    query: KOI_EXAMPLE.funnyMoviesQuery,
    watchSubcategory: "movies"
  },
  {
    id: "sci-fi-shows",
    label: "Best sci-fi shows to stream",
    query: KOI_EXAMPLE.sciFiShowsQuery,
    watchSubcategory: "tv_shows"
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
