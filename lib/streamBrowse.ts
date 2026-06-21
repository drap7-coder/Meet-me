import { KOI_EXAMPLE } from "@/lib/koiExamples";
import type { WatchSubcategory } from "@/lib/types";

export type StreamingOptionAccent = "default" | "trending" | "series" | "movies";

export type StreamingOption = {
  id: string;
  label: string;
  query: string;
  watchSubcategory: WatchSubcategory;
  accent: StreamingOptionAccent;
};

export const STREAMING_OPTIONS: StreamingOption[] = [
  {
    id: "comedy",
    label: "Comedy",
    query: KOI_EXAMPLE.streamQuery,
    watchSubcategory: "tv_shows",
    accent: "series"
  },
  {
    id: "action",
    label: "Action",
    query: "Best action movies tonight",
    watchSubcategory: "movies",
    accent: "movies"
  },
  {
    id: "sci-fi",
    label: "Sci-Fi",
    query: KOI_EXAMPLE.sciFiShowsQuery,
    watchSubcategory: "tv_shows",
    accent: "series"
  },
  {
    id: "drama",
    label: "Drama",
    query: "Best drama movies tonight",
    watchSubcategory: "movies",
    accent: "movies"
  },
  {
    id: "horror",
    label: "Horror",
    query: "Best horror movies tonight",
    watchSubcategory: "movies",
    accent: "movies"
  },
  {
    id: "romance",
    label: "Romance",
    query: "Best romance movies tonight",
    watchSubcategory: "movies",
    accent: "default"
  },
  {
    id: "trending",
    label: "Trending",
    query: KOI_EXAMPLE.trendingMoviesQuery,
    watchSubcategory: "trending",
    accent: "trending"
  },
  {
    id: "documentary",
    label: "Documentary",
    query: "Best documentary series tonight",
    watchSubcategory: "tv_shows",
    accent: "default"
  }
];

export const STREAMING_EXAMPLE_PROMPTS = STREAMING_OPTIONS.map((option) => option.query);
