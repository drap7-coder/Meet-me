import { getRedisConfig, redisCommand } from "@/lib/redisRest";
import { recordCacheHit, recordCacheMiss, recordProviderCall } from "@/lib/searchTelemetryRuntime";
import type { GeocodedLocation, LatLng } from "@/lib/types";

const CACHE_PREFIX = "geocode:v1:";
const CACHE_TTL_SECONDS = 60 * 60 * 24;

type MemoryEntry = {
  value: GeocodedLocation;
  expiresAt: number;
};

function getMemoryStore() {
  const globalStore = globalThis as typeof globalThis & {
    __geocodeCache?: Map<string, MemoryEntry>;
  };
  globalStore.__geocodeCache ??= new Map<string, MemoryEntry>();
  return globalStore.__geocodeCache;
}

function normalizeAddress(input: string) {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

function latLngKey({ lat, lng }: LatLng) {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

export function geocodeCacheKeyForAddress(input: string, placeId?: string) {
  if (placeId?.trim()) return `${CACHE_PREFIX}place:${placeId.trim()}`;
  return `${CACHE_PREFIX}address:${normalizeAddress(input)}`;
}

export function geocodeCacheKeyForLatLng(location: LatLng) {
  return `${CACHE_PREFIX}latlng:${latLngKey(location)}`;
}

function isGeocodedLocation(value: unknown): value is GeocodedLocation {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const location = value as Partial<GeocodedLocation>;
  return (
    typeof location.formattedAddress === "string" &&
    typeof location.input === "string" &&
    typeof location.location?.lat === "number" &&
    typeof location.location?.lng === "number"
  );
}

export async function readGeocodeCache(key: string): Promise<GeocodedLocation | null> {
  if (getRedisConfig()) {
    const value = await redisCommand(["GET", key]);
    if (typeof value !== "string") return null;
    try {
      const parsed = JSON.parse(value);
      return isGeocodedLocation(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  const entry = getMemoryStore().get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    getMemoryStore().delete(key);
    return null;
  }
  return entry.value;
}

export async function writeGeocodeCache(key: string, value: GeocodedLocation) {
  const payload = JSON.stringify(value);

  if (getRedisConfig()) {
    await redisCommand(["SET", key, payload, "EX", String(CACHE_TTL_SECONDS)]);
    return;
  }

  getMemoryStore().set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_SECONDS * 1000
  });
}

export async function withGeocodeCache(key: string, loader: () => Promise<GeocodedLocation>) {
  const cached = await readGeocodeCache(key);
  if (cached) {
    recordCacheHit("geocode");
    return cached;
  }

  recordCacheMiss("geocode");
  recordProviderCall("google", "geocode");
  const result = await loader();
  await writeGeocodeCache(key, result);
  return result;
}
