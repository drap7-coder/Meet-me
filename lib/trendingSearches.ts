import {
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
  {
    id: "trend-coffee-halfway",
    label: "Coffee halfway between Hoboken and Princeton",
    query: "Coffee halfway between Hoboken and Princeton",
    cardIcon: "☕",
    cardTitle: "Halfway coffee",
    cardSubtitle: "Fair meetup between two places",
    cardAccent: "places"
  },
  {
    id: "trend-pizza",
    label: "Pizza near me",
    query: "Pizza near me",
    cardIcon: "🍕",
    cardTitle: "Pizza near me",
    cardSubtitle: "Find spots close to you",
    cardAccent: "places"
  },
  {
    id: "trend-stream",
    label: "What should I stream tonight?",
    query: "What should I stream tonight?",
    watchSubcategory: "tv_shows",
    cardIcon: "📺",
    cardTitle: "Stream tonight",
    cardSubtitle: "TV and streaming picks",
    cardAccent: "watch"
  },
  {
    id: "trend-movies-near",
    label: "Movies playing near me",
    query: "Movies playing near me",
    watchSubcategory: "movies",
    cardIcon: "🎬",
    cardTitle: "Movies near me",
    cardSubtitle: "Theaters playing tonight",
    cardAccent: "watch"
  },
  {
    id: "trend-sports",
    label: "Sports on TV tonight",
    query: "Sports on TV tonight",
    watchSubcategory: "tv_shows",
    cardIcon: "🏈",
    cardTitle: "Sports on TV",
    cardSubtitle: "Games and matches tonight",
    cardAccent: "watch"
  }
];

const LABEL_CATALOG: KoiBrowseOption[] = [
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

export type TrendingCardDisplay = {
  icon: string;
  title: string;
  subtitle: string;
  accent: "places" | "watch";
};

function inferTrendingCard(option: KoiBrowseOption): TrendingCardDisplay {
  const query = option.query.toLowerCase();
  const title = option.cardTitle ?? getSearchDisplayLabel(option.query);

  if (option.watchSubcategory || /\b(stream|watch|movie|show|tv|sport)\b/.test(query)) {
    if (query.includes("sport")) {
      return { icon: "🏈", title, subtitle: "Sports and games tonight", accent: "watch" };
    }
    if (query.includes("movie") || query.includes("theater")) {
      return { icon: "🎬", title, subtitle: "Movies playing nearby", accent: "watch" };
    }
    return { icon: "📺", title, subtitle: "Streaming and TV picks", accent: "watch" };
  }

  if (query.includes("halfway") || query.includes("between")) {
    return { icon: "☕", title, subtitle: "Halfway meetup search", accent: "places" };
  }
  if (query.includes("pizza")) {
    return { icon: "🍕", title, subtitle: "Food nearby", accent: "places" };
  }
  if (query.includes("brewer") || query.includes("bar") || query.includes("drink")) {
    return { icon: "🍺", title, subtitle: "Drinks and breweries", accent: "places" };
  }
  if (query.includes("near me") || query.includes("nearby")) {
    return { icon: "📍", title, subtitle: "Places near you", accent: "places" };
  }

  return { icon: "✨", title, subtitle: "Popular on Koi", accent: "places" };
}

export function getTrendingCardDisplay(option: KoiBrowseOption): TrendingCardDisplay {
  if (option.cardIcon && option.cardTitle && option.cardSubtitle && option.cardAccent) {
    return {
      icon: option.cardIcon,
      title: option.cardTitle,
      subtitle: option.cardSubtitle,
      accent: option.cardAccent
    };
  }

  const catalogMatch = LABEL_CATALOG.find((item) => normalizeQuery(item.query) === normalizeQuery(option.query));
  if (
    catalogMatch?.cardIcon &&
    catalogMatch.cardTitle &&
    catalogMatch.cardSubtitle &&
    catalogMatch.cardAccent
  ) {
    return {
      icon: catalogMatch.cardIcon,
      title: catalogMatch.cardTitle,
      subtitle: catalogMatch.cardSubtitle,
      accent: catalogMatch.cardAccent
    };
  }

  return inferTrendingCard(option);
}

function mergeTrendingMetadata(option: KoiBrowseOption): KoiBrowseOption {
  const catalogMatch = FALLBACK_TRENDING.find((item) => normalizeQuery(item.query) === normalizeQuery(option.query));
  if (!catalogMatch) return option;
  return { ...catalogMatch, ...option, id: option.id, label: option.label || catalogMatch.label };
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

  return filled.slice(0, limit).map(mergeTrendingMetadata);
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
