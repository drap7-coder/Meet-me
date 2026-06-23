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

const TIMEFRAME_FILTERS: ActionableFilter[] = [
  { id: "tonight", label: "🌙 Tonight", query: "tonight" },
  { id: "weekend", label: "📅 This weekend", query: "this weekend" },
  { id: "open-now", label: "🟢 Open now", query: "open now" }
];

function dedupeChips(chips: KoiChip[]): KoiChip[] {
  const seen = new Set<string>();
  return chips.filter((chip) => {
    const key = chip.label.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Parsed intent chips — what Koi inferred from the ask. */
export function buildKoiUnderstoodChips(result: WatchEventsResult): KoiChip[] {
  const chips: KoiChip[] = [];

  if (result.intentLabel.trim()) {
    chips.push({ id: "intent", label: result.intentLabel });
  }
  if (result.topic.trim()) {
    chips.push({ id: "topic", label: result.topic });
  }
  if (result.timeframe.trim()) {
    chips.push({ id: "timeframe", label: result.timeframe });
  }
  if (result.location.trim()) {
    chips.push({ id: "location", label: result.location });
  }

  return dedupeChips(chips);
}

/** Refinement chips the user can tap to rerun search. */
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

    const timeframeFilters = TIMEFRAME_FILTERS.map((filter) => ({
      ...filter,
      id: `watch-${filter.id}`,
      query: appendTimeframe(result.query, filter.query)
    }));

    return [...subcategoryFilters, ...genreFilters, ...timeframeFilters];
  }

  const happeningFilters: ActionableFilter[] = LOCAL_HAPPENINGS_OPTIONS.slice(0, 6).map((option) => ({
    id: `events-${option.id}`,
    label: option.label,
    query: option.query
  }));

  const timeframeFilters = TIMEFRAME_FILTERS.map((filter) => ({
    ...filter,
    id: `events-${filter.id}`,
    query: appendTimeframe(result.query, filter.query)
  }));

  return [...happeningFilters, ...timeframeFilters];
}

function inferWatchSubcategory(result: WatchEventsResult): WatchSubcategory {
  const label = result.intentLabel.toLowerCase();
  if (label.includes("tv")) return "tv_shows";
  if (label.includes("trending")) return "trending";
  return "movies";
}

function appendTimeframe(query: string, timeframe: string) {
  const trimmed = query.trim();
  if (!trimmed) return timeframe;
  if (new RegExp(timeframe.replace(/\s+/g, "\\s+"), "i").test(trimmed)) return trimmed;
  return `${trimmed} ${timeframe}`;
}
