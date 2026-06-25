import { fetchWithTimeout } from "@/lib/providers/fetchWithTimeout";
import { recordProviderCall } from "@/lib/searchTelemetryRuntime";
import { logApiError } from "@/lib/serverLog";

/**
 * National Park Service Data API — server-only outdoor discovery source.
 *
 * Gated behind NPS_API_KEY. When absent every method is a safe no-op.
 * Responses are normalized; network failures degrade to empty arrays.
 */

const API_BASE = "https://developer.nps.gov/api/v1";
const REQUEST_TIMEOUT_MS = 9000;
const DEFAULT_LIMIT = 50;

export type NpsActivity = {
  id: string;
  name: string;
};

export type NpsAmenity = {
  id: string;
  name: string;
};

export type NpsPark = {
  parkCode: string;
  fullName: string;
  description: string;
  states: string;
  url: string;
  lat: number;
  lng: number;
  imageUrl?: string;
};

export type NpsParkPlace = {
  id: string;
  title: string;
  description: string;
  parkCode: string;
  parkName?: string;
  lat: number | null;
  lng: number | null;
  url?: string;
  amenityId?: string;
  amenityName?: string;
};

export type NpsAlert = {
  id: string;
  title: string;
  description: string;
  category: string;
  parkCode: string;
  url?: string;
};

type NpsListResponse<T> = {
  data?: T[];
};

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const catalogCache = new Map<string, CacheEntry<unknown>>();
const CATALOG_TTL_MS = 60 * 60 * 1000;

export function getNpsApiKey(): string | undefined {
  const key = process.env.NPS_API_KEY?.trim();
  return key ? key : undefined;
}

function readCache<T>(key: string): T | null {
  const entry = catalogCache.get(key);
  if (!entry || entry.expiresAt < Date.now()) return null;
  return entry.value as T;
}

function writeCache<T>(key: string, value: T) {
  catalogCache.set(key, { value, expiresAt: Date.now() + CATALOG_TTL_MS });
}

function parseCoordinate(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizePark(raw: Record<string, unknown>): NpsPark | null {
  const parkCode = typeof raw.parkCode === "string" ? raw.parkCode.trim() : null;
  const fullName = typeof raw.fullName === "string" ? raw.fullName.trim() : null;
  const lat = parseCoordinate(raw.latitude);
  const lng = parseCoordinate(raw.longitude);
  if (!parkCode || !fullName || lat == null || lng == null) return null;

  const images = Array.isArray(raw.images) ? raw.images : [];
  const firstImage = images.find(
    (item): item is { url?: unknown } => typeof item === "object" && item !== null
  );
  const imageUrl =
    typeof firstImage?.url === "string" && firstImage.url.trim() ? firstImage.url.trim() : undefined;

  return {
    parkCode,
    fullName,
    description: typeof raw.description === "string" ? raw.description.trim() : "",
    states: typeof raw.states === "string" ? raw.states.trim() : "",
    url: typeof raw.url === "string" ? raw.url.trim() : `https://www.nps.gov/${parkCode}/index.htm`,
    lat,
    lng,
    imageUrl
  };
}

function normalizeActivity(raw: Record<string, unknown>): NpsActivity | null {
  const id = typeof raw.id === "string" ? raw.id.trim() : null;
  const name = typeof raw.name === "string" ? raw.name.trim() : null;
  if (!id || !name) return null;
  return { id, name };
}

function normalizeAmenity(raw: Record<string, unknown>): NpsAmenity | null {
  const id = typeof raw.id === "string" ? raw.id.trim() : null;
  const name = typeof raw.name === "string" ? raw.name.trim() : null;
  if (!id || !name) return null;
  return { id, name };
}

function normalizeAlert(raw: Record<string, unknown>): NpsAlert | null {
  const id = typeof raw.id === "string" ? raw.id.trim() : null;
  const title = typeof raw.title === "string" ? raw.title.trim() : null;
  const parkCode = typeof raw.parkCode === "string" ? raw.parkCode.trim() : null;
  if (!id || !title || !parkCode) return null;
  return {
    id,
    title,
    description: typeof raw.description === "string" ? raw.description.trim() : "",
    category: typeof raw.category === "string" ? raw.category.trim() : "Information",
    parkCode,
    url: typeof raw.url === "string" ? raw.url.trim() : undefined
  };
}

function normalizeParkPlace(raw: Record<string, unknown>, amenity?: NpsAmenity): NpsParkPlace | null {
  const id = typeof raw.id === "string" ? raw.id.trim() : null;
  const title =
    (typeof raw.title === "string" && raw.title.trim()) ||
    (typeof raw.name === "string" && raw.name.trim()) ||
    null;
  const parkCode = typeof raw.parkCode === "string" ? raw.parkCode.trim() : null;
  if (!id || !title || !parkCode) return null;

  return {
    id,
    title,
    description:
      (typeof raw.listingDescription === "string" && raw.listingDescription.trim()) ||
      (typeof raw.description === "string" && raw.description.trim()) ||
      "",
    parkCode,
    parkName: typeof raw.parkFullName === "string" ? raw.parkFullName.trim() : undefined,
    lat: parseCoordinate(raw.latitude),
    lng: parseCoordinate(raw.longitude),
    url: typeof raw.url === "string" ? raw.url.trim() : undefined,
    amenityId: amenity?.id,
    amenityName: amenity?.name
  };
}

async function npsRequest<T>(
  path: string,
  params: Record<string, string | number | undefined>,
  operation: string
): Promise<T[]> {
  const apiKey = getNpsApiKey();
  if (!apiKey) return [];

  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === "") continue;
    url.searchParams.set(key, String(value));
  }
  url.searchParams.set("limit", String(params.limit ?? DEFAULT_LIMIT));

  try {
    recordProviderCall("national_parks", operation);
    const response = await fetchWithTimeout(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-Api-Key": apiKey
      },
      timeoutMs: REQUEST_TIMEOUT_MS,
      timeoutMessage: "National parks request timed out."
    });
    if (!response.ok) {
      throw new Error(`National parks ${operation} failed with ${response.status}.`);
    }
    const payload = (await response.json()) as NpsListResponse<T>;
    return Array.isArray(payload.data) ? payload.data : [];
  } catch (error) {
    logApiError(`nps-${operation}`, error);
    return [];
  }
}

function flattenAmenityPlaces(rawItems: Record<string, unknown>[], amenity: NpsAmenity): NpsParkPlace[] {
  const places: NpsParkPlace[] = [];
  for (const item of rawItems) {
    const parks = Array.isArray(item.parks) ? item.parks : [];
    if (parks.length) {
      for (const park of parks) {
        if (typeof park !== "object" || park === null) continue;
        const merged = {
          ...item,
          parkCode:
            typeof (park as { parkCode?: unknown }).parkCode === "string"
              ? (park as { parkCode: string }).parkCode
              : item.parkCode,
          parkFullName:
            typeof (park as { fullName?: unknown }).fullName === "string"
              ? (park as { fullName: string }).fullName
              : item.parkFullName
        } as Record<string, unknown>;
        const place = normalizeParkPlace(merged, amenity);
        if (place) places.push(place);
      }
      continue;
    }
    const place = normalizeParkPlace(item, amenity);
    if (place) places.push(place);
  }
  return places;
}

export function clearNpsProviderCacheForTests() {
  catalogCache.clear();
}

export const npsProvider = {
  isConfigured(): boolean {
    return Boolean(getNpsApiKey());
  },

  async listActivities(): Promise<NpsActivity[]> {
    const cacheKey = "activities";
    const cached = readCache<NpsActivity[]>(cacheKey);
    if (cached) return cached;

    const rows = await npsRequest<Record<string, unknown>>("/activities", { limit: 127 }, "activities");
    const activities = rows.map((row) => normalizeActivity(row)).filter((item): item is NpsActivity => item !== null);
    if (activities.length) writeCache(cacheKey, activities);
    return activities;
  },

  async listAmenities(): Promise<NpsAmenity[]> {
    const cacheKey = "amenities";
    const cached = readCache<NpsAmenity[]>(cacheKey);
    if (cached) return cached;

    const rows = await npsRequest<Record<string, unknown>>("/amenities", { limit: 127 }, "amenities");
    const amenities = rows.map((row) => normalizeAmenity(row)).filter((item): item is NpsAmenity => item !== null);
    if (amenities.length) writeCache(cacheKey, amenities);
    return amenities;
  },

  async getParks(options: {
    stateCode?: string | null;
    q?: string | null;
    parkCode?: string | null;
    limit?: number;
  } = {}): Promise<NpsPark[]> {
    const rows = await npsRequest<Record<string, unknown>>(
      "/parks",
      {
        stateCode: options.stateCode ?? undefined,
        q: options.q ?? undefined,
        parkCode: options.parkCode ?? undefined,
        limit: options.limit ?? DEFAULT_LIMIT
      },
      "parks"
    );
    return rows.map((row) => normalizePark(row)).filter((item): item is NpsPark => item !== null);
  },

  async getActivityParks(activityId: string, options: { stateCode?: string | null; limit?: number } = {}) {
    const rows = await npsRequest<Record<string, unknown>>(
      "/activities/parks",
      {
        id: activityId,
        stateCode: options.stateCode ?? undefined,
        limit: options.limit ?? DEFAULT_LIMIT
      },
      "activities-parks"
    );
    return rows.map((row) => normalizePark(row)).filter((item): item is NpsPark => item !== null);
  },

  async getAmenityPlaces(
    amenityId: string,
    options: { parkCode?: string | null; stateCode?: string | null; limit?: number } = {}
  ): Promise<NpsParkPlace[]> {
    const rows = await npsRequest<Record<string, unknown>>(
      "/amenities/parksplaces",
      {
        id: amenityId,
        parkCode: options.parkCode ?? undefined,
        stateCode: options.stateCode ?? undefined,
        limit: options.limit ?? DEFAULT_LIMIT
      },
      "amenities-parksplaces"
    );
    const amenity = (await npsProvider.listAmenities()).find((item) => item.id === amenityId);
    return flattenAmenityPlaces(rows, amenity ?? { id: amenityId, name: "Outdoor place" });
  },

  async getPlaces(options: {
    parkCode?: string | null;
    stateCode?: string | null;
    q?: string | null;
    limit?: number;
  } = {}): Promise<NpsParkPlace[]> {
    const rows = await npsRequest<Record<string, unknown>>(
      "/places",
      {
        parkCode: options.parkCode ?? undefined,
        stateCode: options.stateCode ?? undefined,
        q: options.q ?? undefined,
        limit: options.limit ?? DEFAULT_LIMIT
      },
      "places"
    );
    return rows
      .map((row) => normalizeParkPlace(row))
      .filter((item): item is NpsParkPlace => item !== null);
  },

  async getAlerts(options: {
    parkCode?: string | null;
    stateCode?: string | null;
    limit?: number;
  } = {}): Promise<NpsAlert[]> {
    const rows = await npsRequest<Record<string, unknown>>(
      "/alerts",
      {
        parkCode: options.parkCode ?? undefined,
        stateCode: options.stateCode ?? undefined,
        limit: options.limit ?? DEFAULT_LIMIT
      },
      "alerts"
    );
    return rows.map((row) => normalizeAlert(row)).filter((item): item is NpsAlert => item !== null);
  }
};
