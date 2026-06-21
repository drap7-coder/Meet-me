import {
  KOI_CAPABILITY_EXAMPLES,
  KOI_FEATURED_EXAMPLES,
  KOI_BROWSE_LANES,
  type KoiBrowseOption
} from "@/lib/koiBrowse";
import type { WatchSubcategory } from "@/lib/types";

const STORAGE_KEY = "koi.trendingSearches.v1";
const UPDATE_EVENT = "koi-trending-updated";

type TrendingStat = {
  query: string;
  watchSubcategory?: WatchSubcategory;
  count: number;
  lastUsed: number;
};

const FALLBACK_TRENDING: KoiBrowseOption[] = [
  { id: "trend-pizza", label: "Pizza nearby", query: "Pizza near me" },
  {
    id: "trend-halfway",
    label: "Halfway meetup",
    query: "Meet a friend halfway between Hoboken and Princeton"
  },
  {
    id: "trend-stream",
    label: "Stream tonight",
    query: "Best shows to stream tonight",
    watchSubcategory: "tv_shows"
  },
  {
    id: "trend-movies",
    label: "Movies tonight",
    query: "Movies playing nearby tonight",
    watchSubcategory: "movies"
  },
  {
    id: "trend-superbad",
    label: "Like Superbad",
    query: "Find a funny movie like Superbad",
    watchSubcategory: "movies"
  },
  {
    id: "trend-brewery",
    label: "Doylestown breweries",
    query: "Breweries near Doylestown"
  }
];

const LABEL_CATALOG: KoiBrowseOption[] = [
  ...KOI_CAPABILITY_EXAMPLES,
  ...KOI_FEATURED_EXAMPLES,
  ...FALLBACK_TRENDING,
  ...KOI_BROWSE_LANES.flatMap((lane) => lane.options)
];

function normalizeQuery(query: string) {
  return query.trim().toLowerCase();
}

function shortenToWordLimit(text: string, maxWords: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return words.slice(0, maxWords).join(" ");
}

export function getSearchDisplayLabel(query: string) {
  const normalized = normalizeQuery(query);
  const match = LABEL_CATALOG.find((option) => normalizeQuery(option.query) === normalized);
  const source = match?.label ?? query.trim();
  return shortenToWordLimit(source, 5);
}

function readStats(): TrendingStat[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is TrendingStat =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof (item as TrendingStat).query === "string" &&
        typeof (item as TrendingStat).count === "number" &&
        typeof (item as TrendingStat).lastUsed === "number"
    );
  } catch {
    return [];
  }
}

function writeStats(stats: TrendingStat[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats.slice(0, 20)));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function recordTrendingSearch(query: string, watchSubcategory?: WatchSubcategory) {
  const trimmed = query.trim();
  if (!trimmed || typeof window === "undefined") return;

  const normalized = normalizeQuery(trimmed);
  const stats = readStats();
  const existing = stats.find((item) => normalizeQuery(item.query) === normalized);

  const nextStat: TrendingStat = existing
    ? {
        ...existing,
        watchSubcategory: watchSubcategory ?? existing.watchSubcategory,
        count: existing.count + 1,
        lastUsed: Date.now()
      }
    : {
        query: trimmed,
        watchSubcategory,
        count: 1,
        lastUsed: Date.now()
      };

  const next = [
    nextStat,
    ...stats.filter((item) => normalizeQuery(item.query) !== normalized)
  ].slice(0, 20);

  writeStats(next);
}

export function getTrendingSearches(limit = 5): KoiBrowseOption[] {
  const stats = readStats()
    .sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed)
    .slice(0, limit);

  const dynamic: KoiBrowseOption[] = stats.map((item, index) => ({
    id: `trending-${index}-${normalizeQuery(item.query).slice(0, 24)}`,
    label: getSearchDisplayLabel(item.query),
    query: item.query,
    watchSubcategory: item.watchSubcategory
  }));

  const seen = new Set(dynamic.map((item) => normalizeQuery(item.query)));
  const filled: KoiBrowseOption[] = [...dynamic];

  for (const fallback of FALLBACK_TRENDING) {
    if (filled.length >= limit) break;
    if (seen.has(normalizeQuery(fallback.query))) continue;
    filled.push(fallback);
    seen.add(normalizeQuery(fallback.query));
  }

  return filled.slice(0, limit);
}

export function subscribeTrendingSearches(onChange: () => void) {
  if (typeof window === "undefined") return () => {};

  const handler = () => onChange();
  window.addEventListener(UPDATE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(UPDATE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
