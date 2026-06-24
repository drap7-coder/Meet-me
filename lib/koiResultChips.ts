import { LOCAL_HAPPENINGS_OPTIONS } from "@/lib/localHappenings";
import type { WatchEventsResult, WatchSubcategory } from "@/lib/types";
import { WATCH_GENRES_BY_SUBCATEGORY, WATCH_SUBCATEGORIES } from "@/lib/watchBrowse";

export type KoiChip = {
  id: string;
  label: string;
};

export type ActionableFilter = KoiChip & {
  query: string;
  watchSubcategory?: WatchSubcategory;
};

export function buildActionableFilters(result: WatchEventsResult): ActionableFilter[] {
  if (result.botMode === "watch") {
    const subcategoryFilters: ActionableFilter[] = WATCH_SUBCATEGORIES.map((option) => ({
      id: `watch-${option.id}`,
      label: option.label,
      query: result.query,
      watchSubcategory: option.id
    }));

    const activeSubcategory = inferWatchSubcategory(result);
    const genreFilters =
      WATCH_GENRES_BY_SUBCATEGORY[activeSubcategory]?.slice(0, 6).map((genre) => ({
        id: `genre-${genre.id}`,
        label: genre.label,
        query: genre.query,
        watchSubcategory: activeSubcategory
      })) ?? [];

    return [...subcategoryFilters, ...genreFilters];
  }

  const happeningFilters: ActionableFilter[] = LOCAL_HAPPENINGS_OPTIONS.slice(0, 6).map((option) => ({
    id: `events-${option.id}`,
    label: option.label,
    query: option.query
  }));

  return happeningFilters;
}

function inferWatchSubcategory(result: WatchEventsResult): WatchSubcategory {
  const label = result.intentLabel.toLowerCase();
  if (label.includes("tv")) return "tv_shows";
  if (label.includes("trending")) return "trending";
  return "movies";
}

