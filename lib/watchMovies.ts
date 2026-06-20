import type { WatchEventsIntent, WatchEventsRecommendation } from "@/lib/types";
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

const LIVE_BADGES = ["Best match", "Highly rated", "Worth a look"] as const;

export async function tryBuildLiveMovieRecommendations(
  context: MovieRecommendationContext
): Promise<WatchEventsRecommendation[] | null> {
  if (!isTmdbConfigured()) return null;
  if (/\b(?:movie theater|movie theatre|cinema|cinemas)\b/i.test(context.query)) return null;
  if (context.intent === "sports" || context.intent === "live_event" || context.intent === "things_to_do") {
    return null;
  }

  const mediaKind = detectMediaKind(context.query);

  try {
    if (context.intent === "stream" && context.topic && context.topic !== "movies") {
      return buildTitleSearchRecommendations(context.topic, context.timeframe, mediaKind);
    }

    if (context.genre) {
      return buildGenreRecommendations(context.genre, context.timeframe, mediaKind);
    }

    if (/\bnew releases?\b/i.test(context.query)) {
      return buildSimpleRecommendations(
        await fetchNewReleaseMedia(mediaKind, 3),
        context.timeframe,
        mediaKind === "tv" ? "New series" : "New releases",
        mediaKind
      );
    }

    if (context.intent === "general" || context.intent === "stream") {
      const lane = mediaKind === "tv" ? "Trending TV" : "Trending";
      return buildSimpleRecommendations(await fetchTrendingMedia(mediaKind, 3), context.timeframe, lane, mediaKind);
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
  if (/\b(?:trending shows?|binge|series|tv|television)\b/i.test(normalized)) return "tv";
  if (
    /\b(?:show|shows)\b/i.test(normalized) &&
    !/\b(?:comedy show|live show|game show|talk show|talent show|concert)\b/i.test(normalized)
  ) {
    return "tv";
  }

  return "movie";
}

async function buildGenreRecommendations(genre: string, timeframe: string, mediaKind: TmdbMediaKind) {
  const picks = await discoverMediaByGenre(genre, mediaKind, 3);
  if (!picks.length) return null;

  const label = genre === "sci-fi" ? "Sci-Fi" : capitalizeWords(genre);
  const formatLabel = mediaKind === "tv" ? "TV series" : "Movie";
  return picks.map((pick, index) =>
    mediaRecommendation({
      pick,
      rank: index + 1,
      kind: "general",
      badge: LIVE_BADGES[index] ?? "Pick",
      subtitle: `${timeframe} · ${label} ${mediaKind === "tv" ? "series" : "movies"}`,
      explanation:
        index === 0
          ? `Koi matched your ${label.toLowerCase()} ask to a strong ${formatLabel.toLowerCase()} in that genre.`
          : index === 1
            ? `A well-rated ${label.toLowerCase()} ${formatLabel.toLowerCase()} when you want something with more acclaim.`
            : `A fresher ${label.toLowerCase()} ${formatLabel.toLowerCase()} if you want something newer or less obvious.`,
      tags: [label, timeframe, formatRating(pick.rating)],
      meta: buildMediaMeta(pick, label)
    })
  );
}

async function buildTitleSearchRecommendations(title: string, timeframe: string, mediaKind: TmdbMediaKind) {
  const matches = await searchMedia(title, mediaKind, 1);
  const primary = matches[0];
  if (!primary) {
    const fallbackKind: TmdbMediaKind = mediaKind === "movie" ? "tv" : "movie";
    const fallbackMatches = await searchMedia(title, fallbackKind, 1);
    if (!fallbackMatches[0]) return null;
    return buildTitleResults(fallbackMatches[0], timeframe, fallbackKind);
  }

  return buildTitleResults(primary, timeframe, mediaKind);
}

async function buildTitleResults(primary: TmdbPick, timeframe: string, mediaKind: TmdbMediaKind) {
  const similar = await fetchSimilarMedia(primary.id, mediaKind, 2);
  const picks = [primary, ...similar.filter((pick) => pick.id !== primary.id)].slice(0, 3);
  if (!picks.length) return null;

  const formatLabel = mediaKind === "tv" ? "series" : "movie";

  return picks.map((pick, index) =>
    mediaRecommendation({
      pick,
      rank: index + 1,
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
  mediaKind: TmdbMediaKind
) {
  if (!picks.length) return null;

  return picks.map((pick, index) =>
    mediaRecommendation({
      pick,
      rank: index + 1,
      kind: "general",
      badge: LIVE_BADGES[index] ?? "Pick",
      subtitle: `${timeframe} · ${lane}`,
      explanation:
        index === 0
          ? `Koi pulled ${mediaKind === "tv" ? "TV series" : "movie"} picks from TMDB based on your watch ask.`
          : index === 1
            ? `Another strong option when the first pick does not land with the group.`
            : `A backup pick to keep decision time short.`,
      tags: [lane, timeframe, formatRating(pick.rating)],
      meta: buildMediaMeta(pick, lane)
    })
  );
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
    id: `tmdb-${pick.kind}-${pick.id}-${rank}`,
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
    posterUrl: pick.posterUrl,
    year: pick.year,
    rating: formatRating(pick.rating),
    overview: trimOverview(pick.overview),
    runtime: formatDuration(pick)
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

function trimOverview(value: string) {
  const trimmed = value.trim();
  if (trimmed.length <= 220) return trimmed;
  return `${trimmed.slice(0, 217).trimEnd()}...`;
}

function capitalizeWords(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
