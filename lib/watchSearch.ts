import type { WatchEventsResult, WatchSubcategory } from "@/lib/types";
import { getWatchSubcategoryLabel } from "@/lib/watchBrowse";
import { tryBuildLiveMovieRecommendations, detectMediaKind } from "@/lib/watchMovies";
import {
  WATCH_DESCRIPTION,
  WATCH_LIVE_MESSAGE,
  WATCH_PREVIEW_MESSAGE,
  WATCH_TITLE,
  classifyWatchIntent,
  extractWatchEventsTimeframe,
  extractWatchEventsTopic,
  extractMovieGenre,
  buildWatchPreviewRecommendations
} from "@/lib/watchEvents";

const SUBCATEGORY_INTENT_LABELS: Record<WatchSubcategory, string> = {
  movies: getWatchSubcategoryLabel("movies"),
  tv_shows: getWatchSubcategoryLabel("tv_shows"),
  trending: getWatchSubcategoryLabel("trending")
};

export async function buildWatchSearchResult(
  query: string,
  subcategory?: WatchSubcategory
): Promise<WatchEventsResult> {
  const context = buildWatchSearchContext(query, subcategory);
  const liveBatch = await tryBuildLiveMovieRecommendations(context);
  const recommendations =
    liveBatch?.recommendations ??
    buildWatchPreviewRecommendations({
      query: context.query,
      intent: context.intent,
      timeframe: context.timeframe,
      topic: context.topic,
      genre: context.genre
    });
  const hasLivePicks = recommendations.some((item) => !item.preview);

  return {
    botMode: "watch",
    query: context.query,
    title: WATCH_TITLE,
    description: WATCH_DESCRIPTION,
    message: hasLivePicks ? WATCH_LIVE_MESSAGE : WATCH_PREVIEW_MESSAGE,
    intent: context.intent,
    intentLabel: subcategory ? SUBCATEGORY_INTENT_LABELS[subcategory] : "Streaming",
    location: "",
    timeframe: context.timeframe,
    topic: context.topic,
    contextSummary: buildWatchContextSummary(subcategory, context.timeframe, context.topic),
    resultCount: recommendations.length,
    recommendations,
    futureProviders: hasLivePicks
      ? ["Watchmode", "Streaming Availability API"]
      : ["TMDB", "Watchmode", "Streaming Availability API"],
    preview: !hasLivePicks,
    hasMore: liveBatch?.hasMore ?? false
  };
}

export async function buildWatchSearchMore(
  query: string,
  excludeKeys: string[],
  subcategory?: WatchSubcategory
) {
  const context = buildWatchSearchContext(query, subcategory);
  const liveBatch = await tryBuildLiveMovieRecommendations(context, {
    excludeKeys,
    startRank: excludeKeys.length + 1
  });

  return {
    botMode: "watch" as const,
    append: true as const,
    recommendations: liveBatch?.recommendations ?? [],
    hasMore: liveBatch?.hasMore ?? false
  };
}

function buildWatchSearchContext(query: string, subcategory?: WatchSubcategory) {
  const trimmed = query.trim();
  const augmentedQuery = augmentQueryForSubcategory(trimmed, subcategory);
  const intent = steerIntentForSubcategory(classifyWatchIntent(augmentedQuery), subcategory);
  const timeframe = extractWatchEventsTimeframe(augmentedQuery);
  const topic = extractWatchEventsTopic(augmentedQuery, intent);
  const genre = extractMovieGenre(augmentedQuery);

  return {
    query: augmentedQuery,
    intent,
    timeframe,
    topic,
    genre
  };
}

function augmentQueryForSubcategory(query: string, subcategory?: WatchSubcategory) {
  if (!subcategory) return query;

  switch (subcategory) {
    case "movies":
      return /\b(?:movie|movies|film|films)\b/i.test(query) ? query : `${query} movies`;
    case "tv_shows":
      return /\b(?:tv|television|series|show|shows)\b/i.test(query) ? query : `${query} TV shows`;
    case "trending":
      return /\btrending\b/i.test(query)
        ? query
        : `Trending ${detectMediaKind(query) === "tv" ? "TV shows" : "movies"} ${query}`.trim();
    default:
      return query;
  }
}

function steerIntentForSubcategory(intent: ReturnType<typeof classifyWatchIntent>, subcategory?: WatchSubcategory) {
  if (subcategory === "movies" || subcategory === "tv_shows" || subcategory === "trending") {
    return "general";
  }
  return intent;
}

function buildWatchContextSummary(
  subcategory: WatchSubcategory | undefined,
  timeframe: string,
  topic: string
) {
  const parts = [subcategory ? SUBCATEGORY_INTENT_LABELS[subcategory] : "Streaming"];
  if (topic) parts.push(topic);
  if (timeframe) parts.push(timeframe);
  return parts.join(" · ");
}
