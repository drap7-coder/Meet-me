const TMDB_API_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w342";

export type TmdbMovie = {
  id: number;
  title: string;
  overview: string;
  releaseDate: string;
  year: string;
  rating: number;
  voteCount: number;
  posterUrl: string;
  runtimeMinutes: number | null;
  tmdbUrl: string;
};

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

type TmdbListResponse = {
  results?: TmdbMovieResponse[];
};

const GENRE_IDS: Record<string, number> = {
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

export function isTmdbConfigured() {
  return Boolean(process.env.TMDB_API_KEY?.trim());
}

export function resolveTmdbGenreId(genre: string) {
  return GENRE_IDS[genre.toLowerCase()] ?? null;
}

export function buildTmdbPosterUrl(posterPath: string | null | undefined) {
  if (!posterPath) return "";
  return `${TMDB_IMAGE_BASE}${posterPath}`;
}

export function buildTmdbMovieUrl(movieId: number) {
  return `https://www.themoviedb.org/movie/${movieId}`;
}

export async function discoverMoviesByGenre(genre: string, limit = 3) {
  const genreId = resolveTmdbGenreId(genre);
  if (!genreId) return [];

  const queries: Record<string, string>[] = [
    { with_genres: String(genreId), sort_by: "vote_average.desc", "vote_count.gte": "250" },
    { with_genres: String(genreId), sort_by: "popularity.desc", "vote_count.gte": "100" },
    {
      with_genres: String(genreId),
      sort_by: "primary_release_date.desc",
      "vote_count.gte": "50",
      "vote_average.gte": "6.5"
    }
  ];

  const movies: TmdbMovie[] = [];
  const seen = new Set<number>();

  for (const params of queries) {
    const batch = await discoverMovies(params);
    for (const movie of batch) {
      if (seen.has(movie.id)) continue;
      seen.add(movie.id);
      movies.push(await enrichMovie(movie));
      if (movies.length >= limit) return movies;
    }
  }

  return movies.slice(0, limit);
}

export async function fetchTrendingMovies(limit = 3) {
  const data = await tmdbFetch<TmdbListResponse>("/trending/movie/week");
  const movies = (data.results ?? []).slice(0, limit).map(normalizeMovie);
  return Promise.all(movies.map(enrichMovie));
}

export async function fetchNewReleaseMovies(limit = 3) {
  const today = new Date();
  const past = new Date(today);
  past.setDate(past.getDate() - 120);
  const movies = await discoverMovies({
    sort_by: "popularity.desc",
    "primary_release_date.gte": formatTmdbDate(past),
    "primary_release_date.lte": formatTmdbDate(today),
    "vote_count.gte": "20"
  });
  return Promise.all(movies.slice(0, limit).map(enrichMovie));
}

export async function searchMovies(query: string, limit = 3) {
  const data = await tmdbFetch<TmdbListResponse>("/search/movie", {
    query,
    include_adult: "false"
  });
  const movies = (data.results ?? []).slice(0, limit).map(normalizeMovie);
  return Promise.all(movies.map(enrichMovie));
}

export async function fetchSimilarMovies(movieId: number, limit = 2) {
  const data = await tmdbFetch<TmdbListResponse>(`/movie/${movieId}/similar`);
  const movies = (data.results ?? []).slice(0, limit).map(normalizeMovie);
  return Promise.all(movies.map(enrichMovie));
}

async function discoverMovies(params: Record<string, string>) {
  const data = await tmdbFetch<TmdbListResponse>("/discover/movie", params);
  return (data.results ?? []).map(normalizeMovie);
}

async function enrichMovie(movie: TmdbMovie): Promise<TmdbMovie> {
  if (movie.runtimeMinutes !== null) return movie;

  try {
    const details = await tmdbFetch<TmdbMovieResponse>(`/movie/${movie.id}`);
    return {
      ...movie,
      overview: movie.overview || details.overview || "",
      runtimeMinutes: typeof details.runtime === "number" ? details.runtime : null
    };
  } catch {
    return movie;
  }
}

function normalizeMovie(movie: TmdbMovieResponse): TmdbMovie {
  const year = movie.release_date?.slice(0, 4) ?? "";
  return {
    id: movie.id,
    title: movie.title,
    overview: movie.overview ?? "",
    releaseDate: movie.release_date ?? "",
    year,
    rating: typeof movie.vote_average === "number" ? movie.vote_average : 0,
    voteCount: typeof movie.vote_count === "number" ? movie.vote_count : 0,
    posterUrl: buildTmdbPosterUrl(movie.poster_path),
    runtimeMinutes: typeof movie.runtime === "number" ? movie.runtime : null,
    tmdbUrl: buildTmdbMovieUrl(movie.id)
  };
}

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}) {
  const apiKey = process.env.TMDB_API_KEY?.trim();
  if (!apiKey) throw new Error("TMDB is not configured. Set TMDB_API_KEY.");

  const url = new URL(`${TMDB_API_BASE}${path}`);
  url.searchParams.set("api_key", apiKey);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`TMDB request failed with ${response.status}: ${text.slice(0, 180)}`);
  }

  return response.json() as Promise<T>;
}

function formatTmdbDate(value: Date) {
  return value.toISOString().slice(0, 10);
}
