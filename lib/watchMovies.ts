import type { WatchEventsIntent, WatchEventsRecommendation } from "@/lib/types";
import { extractSimilarMediaTitle } from "@/lib/watchQuery";
import { WATCH_PICK_PAGE_SIZE } from "@/lib/watchMedia";
import {
  discoverMediaByGenre,
  fetchNewReleaseMedia,
  fetchSimilarMedia,
  fetchTrendingMedia,
  isTmdbConfigured,
  searchMedia,
  type TmdbMediaKind,
  type TmdbPick
} from "@/lib/tmdb";

type MovieRecommendationContext = {
  query: string;
  intent: WatchEventsIntent;
  timeframe: string;
  topic: string;
  genre: string;
};

type LiveRecommendationOptions = {
  limit?: number;
  excludeKeys?: string[];
  startRank?: number;
};

export type LiveWatchRecommendationBatch = {
  recommendations: WatchEventsRecommendation[];
  hasMore: boolean;
};

export async function tryBuildLiveMovieRecommendations(
  context: MovieRecommendationContext,
  options: LiveRecommendationOptions = {}
): Promise<LiveWatchRecommendationBatch | null> {
  if (!isTmdbConfigured()) return null;
  if (/\b(?:movie theater|movie theatre|cinema|cinemas)\b/i.test(context.query)) return null;
  if (context.intent === "sports" || context.intent === "live_event" || context.intent === "things_to_do") {
    return null;
  }

  const limit = options.limit ?? WATCH_PICK_PAGE_SIZE;
  const excludeKeys = options.excludeKeys ?? [];
  const startRank = options.startRank ?? 1;
  const mediaKind = detectMediaKind(context.query);

  try {
    const similarTitle = extractSimilarMediaTitle(context.query);
    if (similarTitle) {
      const recommendations = await buildTitleSearchRecommendations(
        similarTitle,
        context.timeframe,
        mediaKind,
        startRank
      );
      if (recommendations?.length) {
        return { recommendations, hasMore: false };
      }
    }

    if (context.intent === "stream" && context.topic && context.topic !== "movies") {
      const recommendations = await buildTitleSearchRecommendations(context.topic, context.timeframe, mediaKind, startRank);
      return recommendations ? { recommendations, hasMore: false } : null;
    }

    if (context.genre) {
      return buildGenreRecommendations(context.genre, context.timeframe, mediaKind, limit, excludeKeys, startRank);
    }

    if (/\bnew releases?\b/i.test(context.query)) {
      return buildSimpleRecommendations(
        await fetchNewReleaseMedia(mediaKind, limit, excludeKeys),
        context.timeframe,
        mediaKind === "tv" ? "New series" : "New releases",
        mediaKind,
        limit,
        startRank
      );
    }

    if (context.intent === "general" || context.intent === "stream") {
      const lane = mediaKind === "tv" ? "Trending TV" : "Trending";
      return buildSimpleRecommendations(
        await fetchTrendingMedia(mediaKind, limit, excludeKeys),
        context.timeframe,
        lane,
        mediaKind,
        limit,
        startRank
      );
    }

    return null;
  } catch {
    return null;
  }
}

export function detectMediaKind(query: string): TmdbMediaKind {
  const normalized = query.trim().toLowerCase();

  if (/\b(?:movie|movies|film|films)\b/i.test(normalized)) return "movie";
  if (/\b(?:tv show|tv shows|television show|television series)\b/i.test(normalized)) return "tv";
  if (/\bwhat(?:'s| is) on (?:tv|television)\b/i.test(normalized)) return "tv";
  if (/\b(?:trending shows?|what(?:'s| is) trending|trending to watch)\b/i.test(normalized)) {
    return "tv";
  }
  if (/\btrending\b/i.test(normalized) && /\b(?:movie|movies|film|films)\b/i.test(normalized)) return "movie";
  if (
    /\b(?:show|shows)\b/i.test(normalized) &&
    !/\b(?:comedy show|live show|game show|talk show|talent show|concert)\b/i.test(normalized)
  ) {
    return "tv";
  }

  return "movie";
}

async function buildGenreRecommendations(
  genre: string,
  timeframe: string,
  mediaKind: TmdbMediaKind,
  limit: number,
  excludeKeys: string[],
  startRank: number
): Promise<LiveWatchRecommendationBatch | null> {
  const picks = await discoverMediaByGenre(genre, mediaKind, limit, excludeKeys);
  if (!picks.length) return null;

  const label = genre === "sci-fi" ? "Sci-Fi" : capitalizeWords(genre);
  const formatLabel = mediaKind === "tv" ? "TV series" : "Movie";
  const recommendations = picks.map((pick, index) =>
    mediaRecommendation({
      pick,
      rank: startRank + index,
      kind: "general",
      badge: badgeForIndex(index),
      subtitle: `${timeframe} · ${label} ${mediaKind === "tv" ? "series" : "movies"}`,
      explanation:
        index === 0 && startRank === 1
          ? `Koi matched your ${label.toLowerCase()} ask to a strong ${formatLabel.toLowerCase()} in that genre.`
          : index === 1 && startRank === 1
            ? `A well-rated ${label.toLowerCase()} ${formatLabel.toLowerCase()} when you want something with more acclaim.`
            : startRank === 1
              ? `A fresher ${label.toLowerCase()} ${formatLabel.toLowerCase()} if you want something newer or less obvious.`
              : `Another ${label.toLowerCase()} ${formatLabel.toLowerCase()} worth adding to your list.`,
      tags: [label, timeframe, formatRating(pick.rating)],
      meta: buildMediaMeta(pick, label)
    })
  );

  return { recommendations, hasMore: picks.length >= limit };
}

async function buildTitleSearchRecommendations(
  title: string,
  timeframe: string,
  mediaKind: TmdbMediaKind,
  startRank: number
) {
  const matches = await searchMedia(title, mediaKind, 1);
  const primary = matches[0];
  if (!primary) {
    const fallbackKind: TmdbMediaKind = mediaKind === "movie" ? "tv" : "movie";
    const fallbackMatches = await searchMedia(title, fallbackKind, 1);
    if (!fallbackMatches[0]) return null;
    return buildTitleResults(fallbackMatches[0], timeframe, fallbackKind, startRank);
  }

  return buildTitleResults(primary, timeframe, mediaKind, startRank);
}

async function buildTitleResults(
  primary: TmdbPick,
  timeframe: string,
  mediaKind: TmdbMediaKind,
  startRank: number
) {
  const similar = await fetchSimilarMedia(primary.id, mediaKind, 2);
  const picks = [primary, ...similar.filter((pick) => pick.id !== primary.id)].slice(0, 3);
  if (!picks.length) return null;

  const formatLabel = mediaKind === "tv" ? "series" : "movie";

  return picks.map((pick, index) =>
    mediaRecommendation({
      pick,
      rank: startRank + index,
      kind: "stream",
      badge: index === 0 ? "Title match" : "Similar pick",
      subtitle: index === 0 ? `${timeframe} · Matches your title ask` : `${timeframe} · If you want something like it`,
      explanation:
        index === 0
          ? `Koi found the ${formatLabel} you named and pulled real details from TMDB. Streaming availability is coming later.`
          : `A related ${formatLabel} if ${primary.title} is not the mood or already watched.`,
      tags:
        index === 0
          ? ["Title match", timeframe, formatRating(pick.rating)]
          : ["Similar", timeframe, formatRating(pick.rating)],
      meta: buildMediaMeta(pick, index === 0 ? "Title match" : "Similar")
    })
  );
}

function buildSimpleRecommendations(
  picks: TmdbPick[],
  timeframe: string,
  lane: string,
  mediaKind: TmdbMediaKind,
  limit: number,
  startRank: number
): LiveWatchRecommendationBatch | null {
  if (!picks.length) return null;

  const recommendations = picks.map((pick, index) =>
    mediaRecommendation({
      pick,
      rank: startRank + index,
      kind: "general",
      badge: badgeForIndex(index),
      subtitle: `${timeframe} · ${lane}`,
      explanation:
        index === 0 && startRank === 1
          ? `Koi pulled ${mediaKind === "tv" ? "TV series" : "movie"} picks from TMDB based on your watch ask.`
          : `Another strong option when the first pick does not land with the group.`,
      tags: [lane, timeframe, formatRating(pick.rating)],
      meta: buildMediaMeta(pick, lane)
    })
  );

  return { recommendations, hasMore: picks.length >= limit };
}

function badgeForIndex(index: number) {
  if (index === 0) return "Best match";
  if (index === 1) return "Highly rated";
  if (index === 2) return "Worth a look";
  return "More to explore";
}

function mediaRecommendation(input: {
  pick: TmdbPick;
  rank: number;
  kind: WatchEventsRecommendation["kind"];
  badge: string;
  subtitle: string;
  explanation: string;
  tags: string[];
  meta: Array<{ label: string; value: string }>;
}): WatchEventsRecommendation {
  const { pick, rank } = input;
  return {
    id: `tmdb-${pick.kind}-${pick.id}`,
    rank,
    title: pick.title,
    subtitle: input.subtitle,
    kind: input.kind,
    badge: input.badge,
    explanation: input.explanation,
    tags: input.tags,
    meta: input.meta,
    actionLabel: "View on TMDB",
    actionUrl: pick.tmdbUrl,
    provider: "TMDB",
    preview: false,
    mediaType: pick.kind,
    tmdbId: pick.id,
    posterUrl: pick.posterUrl,
    year: pick.year,
    rating: formatRating(pick.rating),
    overview: pick.overview.trim(),
    runtime: formatDuration(pick),
    genre: input.meta.find((item) => item.label === "Genre lane")?.value
  };
}

function buildMediaMeta(pick: TmdbPick, genreLabel: string) {
  return [
    { label: "Type", value: pick.kind === "tv" ? "TV series" : "Movie" },
    { label: "Rating", value: formatRating(pick.rating) },
    { label: "Year", value: pick.year || "—" },
    {
      label: pick.kind === "tv" ? "Seasons" : "Runtime",
      value: pick.kind === "tv" ? formatSeasons(pick.seasonCount) : formatRuntime(pick.runtimeMinutes)
    },
    { label: "Genre lane", value: genreLabel }
  ];
}

function formatRating(value: number) {
  if (!value) return "—";
  return `${value.toFixed(1)}/10`;
}

function formatRuntime(minutes: number | null) {
  if (!minutes || minutes <= 0) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!hours) return `${mins}m`;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatSeasons(value: number | null) {
  if (!value || value <= 0) return "—";
  return value === 1 ? "1 season" : `${value} seasons`;
}

function formatDuration(pick: TmdbPick) {
  if (pick.kind === "tv") {
    const seasons = formatSeasons(pick.seasonCount);
    const episodeLength = formatRuntime(pick.runtimeMinutes);
    if (seasons === "—" && episodeLength === "—") return "—";
    if (episodeLength === "—") return seasons;
    if (seasons === "—") return `${episodeLength}/ep`;
    return `${seasons} · ${episodeLength}/ep`;
  }

  return formatRuntime(pick.runtimeMinutes);
}

function capitalizeWords(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
