import { fetchWithTimeout } from "@/lib/providers/fetchWithTimeout";
import { recordProviderCall } from "@/lib/searchTelemetryRuntime";
import { logApiError } from "@/lib/serverLog";
import type { LatLng } from "@/lib/types";

/**
 * OpenTripMap POI discovery near a lat/lng.
 *
 * Gated behind OPENTRIPMAP_API_KEY: when the key is absent every method is a safe
 * no-op (isConfigured() === false, discovery returns []), so search flows are
 * never affected. Network/parse failures also degrade to empty results.
 */

const API_BASE = "https://api.opentripmap.com/0.1/en/places";
const REQUEST_TIMEOUT_MS = 8000;
const DEFAULT_RADIUS_METERS = 5000;
const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

/** User-facing discovery categories mapped to OpenTripMap "kinds". */
export const OPENTRIPMAP_CATEGORY_KINDS = {
  historic: "historic",
  cultural: "cultural",
  natural: "natural",
  architecture: "architecture",
  museums: "museums",
  viewpoints: "view_points",
  amusement: "amusements",
  sport: "sport",
  interesting_places: "interesting_places"
} as const;

export type OpenTripMapCategory = keyof typeof OPENTRIPMAP_CATEGORY_KINDS;

export const OPENTRIPMAP_CATEGORIES = Object.keys(OPENTRIPMAP_CATEGORY_KINDS) as OpenTripMapCategory[];

export type OpenTripMapPlace = {
  xid: string;
  name: string;
  lat: number;
  lng: number;
  /** Raw OpenTripMap kinds for this POI. */
  kinds: string[];
  /** Best-matching friendly category, when one of the known kinds is present. */
  category: OpenTripMapCategory | null;
  /** Straight-line distance from the origin in meters, when provided. */
  distanceMeters: number | null;
  /** OpenTripMap importance rating (higher is more notable), when provided. */
  rating: number | null;
  /** Wikidata / external URL when available. */
  sourceUrl?: string;
};

export type OpenTripMapDiscoveryParams = {
  origin: LatLng;
  radiusMeters?: number;
  categories?: OpenTripMapCategory[];
  limit?: number;
  /** Minimum OpenTripMap rating (1-3). Defaults to 1 (include rated POIs). */
  minRating?: number;
  signal?: AbortSignal;
};

type RadiusFeature = {
  xid?: unknown;
  name?: unknown;
  dist?: unknown;
  rate?: unknown;
  kinds?: unknown;
  wikidata?: unknown;
  point?: { lon?: unknown; lat?: unknown } | null;
};

export function getOpenTripMapApiKey(): string | undefined {
  const key = process.env.OPENTRIPMAP_API_KEY?.trim();
  return key ? key : undefined;
}

export function categoriesToKinds(categories?: OpenTripMapCategory[]): string {
  const list = categories?.length ? categories : OPENTRIPMAP_CATEGORIES;
  const kinds = list
    .filter((category): category is OpenTripMapCategory => category in OPENTRIPMAP_CATEGORY_KINDS)
    .map((category) => OPENTRIPMAP_CATEGORY_KINDS[category]);
  return [...new Set(kinds)].join(",");
}

function kindsToCategory(kinds: string[]): OpenTripMapCategory | null {
  for (const category of OPENTRIPMAP_CATEGORIES) {
    if (kinds.includes(OPENTRIPMAP_CATEGORY_KINDS[category])) return category;
  }
  return null;
}

function parseRating(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    // OpenTripMap ratings can look like "3" or "3h" (h = historic importance).
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeFeature(raw: RadiusFeature): OpenTripMapPlace | null {
  const xid = typeof raw.xid === "string" ? raw.xid : null;
  const lat = typeof raw.point?.lat === "number" ? raw.point.lat : null;
  const lng = typeof raw.point?.lon === "number" ? raw.point.lon : null;
  if (!xid || lat == null || lng == null) return null;

  const name = typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : "Unnamed place";
  const kinds = typeof raw.kinds === "string" ? raw.kinds.split(",").map((k) => k.trim()).filter(Boolean) : [];
  const wikidata = typeof raw.wikidata === "string" && raw.wikidata.trim() ? raw.wikidata.trim() : undefined;

  return {
    xid,
    name,
    lat,
    lng,
    kinds,
    category: kindsToCategory(kinds),
    distanceMeters: typeof raw.dist === "number" && Number.isFinite(raw.dist) ? Math.round(raw.dist) : null,
    rating: parseRating(raw.rate),
    sourceUrl: wikidata ? `https://www.wikidata.org/wiki/${wikidata}` : undefined
  };
}

export const openTripMapProvider = {
  isConfigured(): boolean {
    return Boolean(getOpenTripMapApiKey());
  },

  /**
   * Discover POIs within a radius of an origin. Returns [] when no API key is
   * configured or the request fails.
   */
  async discoverNearby(params: OpenTripMapDiscoveryParams): Promise<OpenTripMapPlace[]> {
    const apiKey = getOpenTripMapApiKey();
    if (!apiKey) return [];

    const url = new URL(`${API_BASE}/radius`);
    url.searchParams.set("radius", String(params.radiusMeters ?? DEFAULT_RADIUS_METERS));
    url.searchParams.set("lon", String(params.origin.lng));
    url.searchParams.set("lat", String(params.origin.lat));
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", String(Math.min(params.limit ?? DEFAULT_LIMIT, MAX_LIMIT)));
    url.searchParams.set("rate", String(params.minRating ?? 1));
    url.searchParams.set("apikey", apiKey);

    const kinds = categoriesToKinds(params.categories);
    if (kinds) url.searchParams.set("kinds", kinds);

    try {
      recordProviderCall("opentripmap", "radius");
      const response = await fetchWithTimeout(url, {
        cache: "no-store",
        headers: { Accept: "application/json" },
        timeoutMs: REQUEST_TIMEOUT_MS,
        timeoutMessage: "OpenTripMap request timed out.",
        signal: params.signal
      });
      if (!response.ok) {
        throw new Error(`OpenTripMap radius failed with ${response.status}.`);
      }

      const data = (await response.json()) as unknown;
      if (!Array.isArray(data)) return [];

      return data
        .map((feature) => normalizeFeature(feature as RadiusFeature))
        .filter((place): place is OpenTripMapPlace => place !== null);
    } catch (error) {
      logApiError("opentripmap-radius", error);
      return [];
    }
  }
};
