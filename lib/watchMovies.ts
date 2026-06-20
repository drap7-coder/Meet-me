import type { WatchEventsIntent, WatchEventsRecommendation } from "@/lib/types";
import {
  discoverMoviesByGenre,
  fetchNewReleaseMovies,
  fetchSimilarMovies,
  fetchTrendingMovies,
  isTmdbConfigured,
  searchMovies,
  type TmdbMovie
} from "@/lib/tmdb";

type MovieRecommendationContext = {
  query: string;
  intent: WatchEventsIntent;
  timeframe: string;
  topic: string;
  genre: string;
};

const LIVE_MOVIE_BADGES = ["Best match", "Highly rated", "Worth a look"] as const;

export async function tryBuildLiveMovieRecommendations(
  context: MovieRecommendationContext
): Promise<WatchEventsRecommendation[] | null> {
  if (!isTmdbConfigured()) return null;
  if (/\b(?:movie theater|movie theatre|cinema|cinemas)\b/i.test(context.query)) return null;
  if (context.intent === "sports" || context.intent === "live_event" || context.intent === "things_to_do") {
    return null;
  }

  try {
    if (context.intent === "stream" && context.topic && context.topic !== "movies") {
      return buildTitleSearchRecommendations(context.topic, context.timeframe);
    }

    if (context.genre) {
      return buildGenreRecommendations(context.genre, context.timeframe);
    }

    if (/\bnew releases?\b/i.test(context.query)) {
      return buildSimpleRecommendations(await fetchNewReleaseMovies(3), context.timeframe, "New releases");
    }

    if (context.intent === "general" || context.intent === "stream") {
      return buildSimpleRecommendations(await fetchTrendingMovies(3), context.timeframe, "Trending");
    }

    return null;
  } catch {
    return null;
  }
}

async function buildGenreRecommendations(genre: string, timeframe: string) {
  const movies = await discoverMoviesByGenre(genre, 3);
  if (!movies.length) return null;

  const label = genre === "sci-fi" ? "Sci-Fi" : capitalizeWords(genre);
  return movies.map((movie, index) =>
    movieRecommendation({
      movie,
      rank: index + 1,
      kind: "general",
      badge: LIVE_MOVIE_BADGES[index] ?? "Pick",
      subtitle: `${timeframe} · ${label}`,
      explanation:
        index === 0
          ? `Koi matched your ${label.toLowerCase()} ask to a strong crowd-pleaser in that genre.`
          : index === 1
            ? `A well-rated ${label.toLowerCase()} option when you want something with more acclaim.`
            : `A fresher ${label.toLowerCase()} pick if you want something newer or less obvious.`,
      tags: [label, timeframe, formatRating(movie.rating)],
      meta: buildMovieMeta(movie, label)
    })
  );
}

async function buildTitleSearchRecommendations(title: string, timeframe: string) {
  const matches = await searchMovies(title, 1);
  const primary = matches[0];
  if (!primary) return null;

  const similar = await fetchSimilarMovies(primary.id, 2);
  const movies = [primary, ...similar.filter((movie) => movie.id !== primary.id)].slice(0, 3);
  if (!movies.length) return null;

  return movies.map((movie, index) =>
    movieRecommendation({
      movie,
      rank: index + 1,
      kind: "stream",
      badge: index === 0 ? "Title match" : "Similar pick",
      subtitle: index === 0 ? `${timeframe} · Matches your title ask` : `${timeframe} · If you want something like it`,
      explanation:
        index === 0
          ? `Koi found the movie you named and pulled real details from TMDB. Streaming availability is coming later.`
          : `A related pick if ${primary.title} is not the mood or already watched.`,
      tags: index === 0 ? ["Title match", timeframe, formatRating(movie.rating)] : ["Similar", timeframe, formatRating(movie.rating)],
      meta: buildMovieMeta(movie, index === 0 ? "Title match" : "Similar")
    })
  );
}

function buildSimpleRecommendations(movies: TmdbMovie[], timeframe: string, lane: string) {
  if (!movies.length) return null;

  return movies.map((movie, index) =>
    movieRecommendation({
      movie,
      rank: index + 1,
      kind: "general",
      badge: LIVE_MOVIE_BADGES[index] ?? "Pick",
      subtitle: `${timeframe} · ${lane}`,
      explanation:
        index === 0
          ? `Koi pulled tonight-friendly picks from TMDB based on your broad watch ask.`
          : index === 1
            ? `Another strong option when the first pick does not land with the group.`
            : `A backup pick to keep decision time short.`,
      tags: [lane, timeframe, formatRating(movie.rating)],
      meta: buildMovieMeta(movie, lane)
    })
  );
}

function movieRecommendation(input: {
  movie: TmdbMovie;
  rank: number;
  kind: WatchEventsRecommendation["kind"];
  badge: string;
  subtitle: string;
  explanation: string;
  tags: string[];
  meta: Array<{ label: string; value: string }>;
}): WatchEventsRecommendation {
  const { movie, rank } = input;
  return {
    id: `tmdb-${movie.id}-${rank}`,
    rank,
    title: movie.title,
    subtitle: input.subtitle,
    kind: input.kind,
    badge: input.badge,
    explanation: input.explanation,
    tags: input.tags,
    meta: input.meta,
    actionLabel: "View on TMDB",
    actionUrl: movie.tmdbUrl,
    provider: "TMDB",
    preview: false,
    posterUrl: movie.posterUrl,
    year: movie.year,
    rating: formatRating(movie.rating),
    overview: trimOverview(movie.overview),
    runtime: formatRuntime(movie.runtimeMinutes)
  };
}

function buildMovieMeta(movie: TmdbMovie, genreLabel: string) {
  return [
    { label: "Rating", value: formatRating(movie.rating) },
    { label: "Year", value: movie.year || "—" },
    { label: "Runtime", value: formatRuntime(movie.runtimeMinutes) },
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
