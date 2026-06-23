import { isTmdbConfigured, type TmdbMediaKind } from "@/lib/tmdb";
import { withTmdbCache } from "@/lib/tmdbCache";
import type { NormalizedWatchProviders } from "@/lib/types";

const TMDB_API_BASE = "https://api.themoviedb.org/3";

type TmdbWatchProvider = {
  provider_name?: string;
  logo_path?: string | null;
};

type TmdbWatchProvidersRegion = {
  flatrate?: TmdbWatchProvider[];
  free?: TmdbWatchProvider[];
  ads?: TmdbWatchProvider[];
  rent?: TmdbWatchProvider[];
  buy?: TmdbWatchProvider[];
};

export type TmdbWatchProvidersResponse = {
  results?: Record<string, TmdbWatchProvidersRegion>;
};

const EMPTY_PROVIDERS: NormalizedWatchProviders = {
  streaming: [],
  free: [],
  ads: [],
  rent: [],
  buy: []
};

function providerNames(list: TmdbWatchProvider[] | undefined) {
  const seen = new Set<string>();
  const names: string[] = [];

  for (const provider of list ?? []) {
    const name = provider.provider_name?.trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    names.push(name);
  }

  return names;
}

export function normalizeWatchProviders(
  rawProviders: TmdbWatchProvidersResponse | null | undefined,
  region = "US"
): NormalizedWatchProviders {
  const regionData = rawProviders?.results?.[region];
  if (!regionData) return { ...EMPTY_PROVIDERS };

  return {
    streaming: providerNames(regionData.flatrate),
    free: providerNames(regionData.free),
    ads: providerNames(regionData.ads),
    rent: providerNames(regionData.rent),
    buy: providerNames(regionData.buy)
  };
}

export function hasWatchProviders(providers: NormalizedWatchProviders) {
  return (
    providers.streaming.length > 0 ||
    providers.free.length > 0 ||
    providers.ads.length > 0 ||
    providers.rent.length > 0 ||
    providers.buy.length > 0
  );
}

export async function fetchWatchProviders(
  mediaType: TmdbMediaKind,
  tmdbId: number,
  region = "US"
): Promise<NormalizedWatchProviders> {
  if (!isTmdbConfigured() || !Number.isFinite(tmdbId)) {
    return { ...EMPTY_PROVIDERS };
  }

  try {
    const raw = await tmdbFetchWatchProviders(`/${mediaType}/${tmdbId}/watch/providers`);
    return normalizeWatchProviders(raw, region);
  } catch (error) {
    console.error(`TMDB watch providers failed for ${mediaType}/${tmdbId}:`, error);
    return { ...EMPTY_PROVIDERS };
  }
}

async function tmdbFetchWatchProviders(path: string) {
  return withTmdbCache<TmdbWatchProvidersResponse>(path, {}, async () => {
    const apiKey = process.env.TMDB_API_KEY?.trim();
    const readToken = process.env.TMDB_READ_ACCESS_TOKEN?.trim();
    if (!apiKey && !readToken) {
      throw new Error("TMDB is not configured. Set TMDB_API_KEY or TMDB_READ_ACCESS_TOKEN.");
    }

    const url = new URL(`${TMDB_API_BASE}${path}`);
    if (apiKey) url.searchParams.set("api_key", apiKey);

    const headers: HeadersInit = {};
    if (readToken) headers.Authorization = `Bearer ${readToken}`;

    const response = await fetch(url, { cache: "no-store", headers });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`TMDB watch providers failed with ${response.status}: ${text.slice(0, 180)}`);
    }

    return response.json() as Promise<TmdbWatchProvidersResponse>;
  });
}
