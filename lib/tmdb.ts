import { withTmdbCache } from "@/lib/tmdbCache";

const TMDB_API_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w342";
const TMDB_LOGO_BASE = "https://image.tmdb.org/t/p/w92";

export function tmdbLogoUrl(logoPath: string) {
  return `${TMDB_LOGO_BASE}${logoPath}`;
}
const TMDB_MAX_DISCOVER_PAGE = 2;

export type TmdbMediaKind = "movie" | "tv";

export type TmdbPick = {
  id: number;
  kind: TmdbMediaKind;
  title: string;
  overview: string;
  year: string;
  rating: number;
  voteCount: number;
  posterUrl: string;
  runtimeMinutes: number | null;
  seasonCount: number | null;
  tmdbUrl: string;
};

/** @deprecated Use TmdbPick */
export type TmdbMovie = TmdbPick & { kind: "movie" };

type TmdbMovieResponse = {
  id: number;
  title: string;
  overview?: string;
  release_date?: string;
  vote_average?: number;
  vote_count?: number;
  poster_path?: string | null;
  runtime?: number;
};

type TmdbTvResponse = {
  id: number;
  name: string;
  overview?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  poster_path?: string | null;
  number_of_seasons?: number;
  episode_run_time?: number[];
};

type TmdbMovieListResponse = {
  results?: TmdbMovieResponse[];
};

type TmdbTvListResponse = {
  results?: TmdbTvResponse[];
};

const MOVIE_GENRE_IDS: Record<string, number> = {
  action: 28,
  comedy: 35,
  drama: 18,
  horror: 27,
  romance: 10749,
  "sci-fi": 878,
  thriller: 53,
  documentary: 99,
  family: 10751
};

const TV_GENRE_IDS: Record<string, number> = {
  action: 10759,
  comedy: 35,
  drama: 18,
  horror: 9648,
  romance: 10749,
  "sci-fi": 10765,
  thriller: 9648,
  documentary: 99,
  family: 10751
};

export function isTmdbConfigured() {
  return Boolean(process.env.TMDB_API_KEY?.trim() || process.env.TMDB_READ_ACCESS_TOKEN?.trim());
}

export function resolveTmdbGenreId(genre: string, kind: TmdbMediaKind = "movie") {
  const map = kind === "tv" ? TV_GENRE_IDS : MOVIE_GENRE_IDS;
  return map[genre.toLowerCase()] ?? null;
}

export function buildTmdbPosterUrl(posterPath: string | null | undefined) {
  if (!posterPath) return "";
  return `${TMDB_IMAGE_BASE}${posterPath}`;
}

export function buildTmdbUrl(kind: TmdbMediaKind, id: number) {
  return kind === "tv" ? `https://www.themoviedb.org/tv/${id}` : `https://www.themoviedb.org/movie/${id}`;
}

function pickKey(pick: TmdbPick) {
  return `${pick.kind}:${pick.id}`;
}

export async function discoverMediaByGenre(
  genre: string,
  kind: TmdbMediaKind,
  limit = 5,
  excludeKeys: string[] = []
) {
  const genreId = resolveTmdbGenreId(genre, kind);
  if (!genreId) return [];

  const dateField = kind === "tv" ? "first_air_date" : "primary_release_date";
  const queries: Record<string, string>[] = [
    { with_genres: String(genreId), sort_by: "vote_average.desc", "vote_count.gte": "150" },
    { with_genres: String(genreId), sort_by: "popularity.desc", "vote_count.gte": "75" },
    {
      with_genres: String(genreId),
      sort_by: `${dateField}.desc`,
      "vote_count.gte": "30",
      "vote_average.gte": "6.5"
    }
  ];

  const seen = new Set(excludeKeys);
  const picks: TmdbPick[] = [];

  for (const baseParams of queries) {
    for (let page = 1; page <= TMDB_MAX_DISCOVER_PAGE && picks.length < limit; page += 1) {
      const batch =
        kind === "tv"
          ? await discoverTv(baseParams, page)
          : await discoverMovies(baseParams, page);
      if (!batch.length) break;

      for (const pick of batch) {
        const key = pickKey(pick);
        if (seen.has(key)) continue;
        seen.add(key);
        picks.push(await enrichPick(pick));
        if (picks.length >= limit) return picks;
      }
    }
  }

  return picks;
}

export async function discoverMoviesByGenre(genre: string, limit = 3) {
  return discoverMediaByGenre(genre, "movie", limit);
}

export async function discoverTvByGenre(genre: string, limit = 3) {
  return discoverMediaByGenre(genre, "tv", limit);
}

export async function fetchTrendingMedia(
  kind: TmdbMediaKind,
  limit = 5,
  excludeKeys: string[] = []
) {
  const path = kind === "tv" ? "/trending/tv/week" : "/trending/movie/week";
  const excluded = new Set(excludeKeys);
  const picks: TmdbPick[] = [];

  if (kind === "tv") {
    const data = await tmdbFetch<TmdbTvListResponse>(path);
    for (const show of data.results ?? []) {
      const pick = normalizeTv(show);
      if (excluded.has(pickKey(pick))) continue;
      picks.push(await enrichPick(pick));
      if (picks.length >= limit) return picks;
    }
    return picks;
  }

  const data = await tmdbFetch<TmdbMovieListResponse>(path);
  for (const movie of data.results ?? []) {
    const pick = normalizeMovie(movie);
    if (excluded.has(pickKey(pick))) continue;
    picks.push(await enrichPick(pick));
    if (picks.length >= limit) return picks;
  }

  return picks;
}

export async function fetchTrendingMovies(limit = 3) {
  return fetchTrendingMedia("movie", limit);
}

export async function fetchTrendingTv(limit = 3) {
  return fetchTrendingMedia("tv", limit);
}

export async function fetchNewReleaseMedia(
  kind: TmdbMediaKind,
  limit = 5,
  excludeKeys: string[] = []
) {
  const today = new Date();
  const past = new Date(today);
  past.setDate(past.getDate() - 120);
  const dateField = kind === "tv" ? "first_air_date" : "primary_release_date";
  const baseParams = {
    sort_by: "popularity.desc",
    [`${dateField}.gte`]: formatTmdbDate(past),
    [`${dateField}.lte`]: formatTmdbDate(today),
    "vote_count.gte": "20"
  };

  const seen = new Set(excludeKeys);
  const picks: TmdbPick[] = [];

  for (let page = 1; page <= TMDB_MAX_DISCOVER_PAGE && picks.length < limit; page += 1) {
    const batch = kind === "tv" ? await discoverTv(baseParams, page) : await discoverMovies(baseParams, page);
    if (!batch.length) break;

    for (const pick of batch) {
      const key = pickKey(pick);
      if (seen.has(key)) continue;
      seen.add(key);
      picks.push(await enrichPick(pick));
      if (picks.length >= limit) return picks;
    }
  }

  return picks;
}

export async function fetchNewReleaseMovies(limit = 3) {
  return fetchNewReleaseMedia("movie", limit);
}

export async function fetchNewReleaseTv(limit = 3) {
  return fetchNewReleaseMedia("tv", limit);
}

export async function searchMedia(query: string, kind: TmdbMediaKind, limit = 3) {
  if (kind === "tv") {
    const data = await tmdbFetch<TmdbTvListResponse>("/search/tv", {
      query,
      include_adult: "false"
    });
    const picks = (data.results ?? []).slice(0, limit).map(normalizeTv);
    return Promise.all(picks.map(enrichPick));
  }

  const data = await tmdbFetch<TmdbMovieListResponse>("/search/movie", {
    query,
    include_adult: "false"
  });
  const picks = (data.results ?? []).slice(0, limit).map(normalizeMovie);
  return Promise.all(picks.map(enrichPick));
}

export async function searchMovies(query: string, limit = 3) {
  return searchMedia(query, "movie", limit);
}

export async function searchTv(query: string, limit = 3) {
  return searchMedia(query, "tv", limit);
}

export async function fetchSimilarMedia(id: number, kind: TmdbMediaKind, limit = 2) {
  const path = kind === "tv" ? `/tv/${id}/similar` : `/movie/${id}/similar`;
  if (kind === "tv") {
    const data = await tmdbFetch<TmdbTvListResponse>(path);
    const picks = (data.results ?? []).slice(0, limit).map(normalizeTv);
    return Promise.all(picks.map(enrichPick));
  }

  const data = await tmdbFetch<TmdbMovieListResponse>(path);
  const picks = (data.results ?? []).slice(0, limit).map(normalizeMovie);
  return Promise.all(picks.map(enrichPick));
}

export async function fetchSimilarMovies(movieId: number, limit = 2) {
  return fetchSimilarMedia(movieId, "movie", limit);
}

export async function fetchSimilarTv(tvId: number, limit = 2) {
  return fetchSimilarMedia(tvId, "tv", limit);
}

async function discoverMovies(params: Record<string, string>, page = 1) {
  const data = await tmdbFetch<TmdbMovieListResponse>("/discover/movie", {
    ...params,
    page: String(page)
  });
  return (data.results ?? []).map(normalizeMovie);
}

async function discoverTv(params: Record<string, string>, page = 1) {
  const data = await tmdbFetch<TmdbTvListResponse>("/discover/tv", {
    ...params,
    page: String(page)
  });
  return (data.results ?? []).map(normalizeTv);
}

async function enrichPick(pick: TmdbPick): Promise<TmdbPick> {
  if (pick.overview && pick.posterUrl) {
    return pick;
  }

  if (pick.kind === "movie") {
    if (pick.runtimeMinutes !== null) return pick;
    try {
      const details = await tmdbFetch<TmdbMovieResponse>(`/movie/${pick.id}`);
      return {
        ...pick,
        overview: pick.overview || details.overview || "",
        runtimeMinutes: typeof details.runtime === "number" ? details.runtime : null
      };
    } catch {
      return pick;
    }
  }

  if (pick.seasonCount !== null && pick.runtimeMinutes !== null) return pick;

  try {
    const details = await tmdbFetch<TmdbTvResponse>(`/tv/${pick.id}`);
    const runtime = Array.isArray(details.episode_run_time)
      ? details.episode_run_time.find((value) => value > 0) ?? null
      : null;
    return {
      ...pick,
      overview: pick.overview || details.overview || "",
      seasonCount: typeof details.number_of_seasons === "number" ? details.number_of_seasons : pick.seasonCount,
      runtimeMinutes: runtime
    };
  } catch {
    return pick;
  }
}

function normalizeMovie(movie: TmdbMovieResponse): TmdbPick {
  return {
    id: movie.id,
    kind: "movie",
    title: movie.title,
    overview: movie.overview ?? "",
    year: movie.release_date?.slice(0, 4) ?? "",
    rating: typeof movie.vote_average === "number" ? movie.vote_average : 0,
    voteCount: typeof movie.vote_count === "number" ? movie.vote_count : 0,
    posterUrl: buildTmdbPosterUrl(movie.poster_path),
    runtimeMinutes: typeof movie.runtime === "number" ? movie.runtime : null,
    seasonCount: null,
    tmdbUrl: buildTmdbUrl("movie", movie.id)
  };
}

function normalizeTv(show: TmdbTvResponse): TmdbPick {
  const runtime = Array.isArray(show.episode_run_time)
    ? show.episode_run_time.find((value) => value > 0) ?? null
    : null;

  return {
    id: show.id,
    kind: "tv",
    title: show.name,
    overview: show.overview ?? "",
    year: show.first_air_date?.slice(0, 4) ?? "",
    rating: typeof show.vote_average === "number" ? show.vote_average : 0,
    voteCount: typeof show.vote_count === "number" ? show.vote_count : 0,
    posterUrl: buildTmdbPosterUrl(show.poster_path),
    runtimeMinutes: runtime,
    seasonCount: typeof show.number_of_seasons === "number" ? show.number_of_seasons : null,
    tmdbUrl: buildTmdbUrl("tv", show.id)
  };
}

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}) {
  return withTmdbCache<T>(path, params, async () => {
    const apiKey = process.env.TMDB_API_KEY?.trim();
    const readToken = process.env.TMDB_READ_ACCESS_TOKEN?.trim();
    if (!apiKey && !readToken) {
      throw new Error("TMDB is not configured. Set TMDB_API_KEY or TMDB_READ_ACCESS_TOKEN.");
    }

    const url = new URL(`${TMDB_API_BASE}${path}`);
    if (apiKey) url.searchParams.set("api_key", apiKey);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const headers: HeadersInit = {};
    if (readToken) headers.Authorization = `Bearer ${readToken}`;

    const response = await fetch(url, { cache: "no-store", headers });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`TMDB request failed with ${response.status}: ${text.slice(0, 180)}`);
    }

    return response.json() as Promise<T>;
  });
}

function formatTmdbDate(value: Date) {
  return value.toISOString().slice(0, 10);
}
