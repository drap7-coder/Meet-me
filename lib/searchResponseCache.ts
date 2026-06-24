import { after } from "next/server";

import { getRedisConfig, redisCommand } from "@/lib/redisRest";
import { recordCacheHit, recordCacheMiss } from "@/lib/searchTelemetryRuntime";

/**
 * Stale-while-revalidate cache for fully-assembled search responses.
 *
 * The per-provider caches (Ticketmaster, geocode, ...) dedupe individual API
 * calls; this layer caches the final response object so repeated or refined
 * queries skip the entire provider round-trip. When an entry is past its fresh
 * window but still within the stale window, the cached value is served instantly
 * and a single background revalidation refreshes it — so users never wait and we
 * never add API calls for cache hits.
 */

type Envelope<T> = {
  v: 1;
  freshUntil: number;
  body: T;
};

type MemoryEntry = {
  value: string;
  expiresAt: number;
};

export type SearchCacheState = "fresh" | "stale" | "miss";

function getMemoryStore() {
  const globalStore = globalThis as typeof globalThis & {
    __searchResponseCache?: Map<string, MemoryEntry>;
  };
  globalStore.__searchResponseCache ??= new Map<string, MemoryEntry>();
  return globalStore.__searchResponseCache;
}

async function readRaw(key: string): Promise<string | null> {
  if (getRedisConfig()) {
    const value = await redisCommand(["GET", key]);
    return typeof value === "string" ? value : null;
  }

  const entry = getMemoryStore().get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    getMemoryStore().delete(key);
    return null;
  }
  return entry.value;
}

async function writeRaw(key: string, value: string, ttlSeconds: number) {
  if (getRedisConfig()) {
    await redisCommand(["SET", key, value, "EX", String(ttlSeconds)]);
    return;
  }

  getMemoryStore().set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
}

async function writeEnvelope<T>(key: string, body: T, freshTtlSeconds: number, staleTtlSeconds: number) {
  const envelope: Envelope<T> = {
    v: 1,
    freshUntil: Date.now() + freshTtlSeconds * 1000,
    body
  };
  await writeRaw(key, JSON.stringify(envelope), staleTtlSeconds);
}

function parseEnvelope<T>(raw: string): Envelope<T> | null {
  try {
    const parsed = JSON.parse(raw) as Partial<Envelope<T>>;
    if (parsed && parsed.v === 1 && typeof parsed.freshUntil === "number" && "body" in parsed) {
      return parsed as Envelope<T>;
    }
  } catch {
    // fall through
  }
  return null;
}

/** Dedupe concurrent background revalidations for the same key within an instance. */
const inFlightRevalidations = new Set<string>();

/** Dedupe concurrent cold-load misses (e.g. a prefetch racing the real submit). */
const inFlightLoads = new Map<string, Promise<unknown>>();

function runInBackground(task: () => Promise<void>) {
  try {
    after(task);
  } catch {
    // Outside a request scope (e.g. warm scripts): fire-and-forget.
    void task().catch(() => {});
  }
}

type CacheOptions<T> = {
  key: string;
  freshTtlSeconds: number;
  staleTtlSeconds: number;
  loader: () => Promise<T>;
  layer?: string;
  shouldCache?: (value: T) => boolean;
  revalidate?: boolean;
};

export async function withSearchResponseCache<T>(
  options: CacheOptions<T>
): Promise<{ value: T; state: SearchCacheState }> {
  const {
    key,
    freshTtlSeconds,
    staleTtlSeconds,
    loader,
    layer = "koi_response",
    shouldCache = () => true,
    revalidate = true
  } = options;

  const raw = await readRaw(key).catch(() => null);
  const envelope = raw ? parseEnvelope<T>(raw) : null;

  if (envelope) {
    if (Date.now() < envelope.freshUntil) {
      recordCacheHit(layer);
      return { value: envelope.body, state: "fresh" };
    }

    // Stale: serve immediately, refresh once in the background.
    recordCacheHit(layer);
    if (revalidate && !inFlightRevalidations.has(key)) {
      inFlightRevalidations.add(key);
      runInBackground(async () => {
        try {
          const fresh = await loader();
          if (shouldCache(fresh)) {
            await writeEnvelope(key, fresh, freshTtlSeconds, staleTtlSeconds);
          }
        } catch {
          // Keep the existing stale entry on failure.
        } finally {
          inFlightRevalidations.delete(key);
        }
      });
    }
    return { value: envelope.body, state: "stale" };
  }

  recordCacheMiss(layer);

  let pending = inFlightLoads.get(key) as Promise<T> | undefined;
  if (!pending) {
    pending = (async () => {
      const fresh = await loader();
      if (shouldCache(fresh)) {
        try {
          await writeEnvelope(key, fresh, freshTtlSeconds, staleTtlSeconds);
        } catch {
          // Never let a cache write break the response.
        }
      }
      return fresh;
    })();
    inFlightLoads.set(key, pending);
    void pending.finally(() => {
      inFlightLoads.delete(key);
    });
  }

  const value = await pending;
  return { value, state: "miss" };
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function roundCoord(value: number) {
  return Math.round(value * 1000) / 1000;
}

/** Small, stable, non-cryptographic hash (djb2) for compact cache keys. */
function stableHash(value: string) {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

type KoiCacheKeyInput = {
  query?: unknown;
  context?: unknown;
  form?: unknown;
  watchSubcategory?: unknown;
  streamingServiceIds?: unknown;
};

function coordPart(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const coords = value as { lat?: unknown; lng?: unknown };
  if (typeof coords.lat === "number" && typeof coords.lng === "number") {
    return `${roundCoord(coords.lat)},${roundCoord(coords.lng)}`;
  }
  return "";
}

/**
 * Build a cache key that captures everything that changes a Koi search result:
 * the normalized query, resolved location, watch refinements, and the calendar
 * day (so time-relative asks like "tonight" never serve across a day boundary).
 */
export function buildKoiSearchCacheKey(input: KoiCacheKeyInput): string {
  const query = normalizeText(typeof input.query === "string" ? input.query : "");

  const form = (input.form && typeof input.form === "object" ? input.form : {}) as {
    locationA?: unknown;
    locationACoordinates?: unknown;
  };
  const context = (input.context && typeof input.context === "object" ? input.context : {}) as {
    locationA?: unknown;
    locationACoordinates?: unknown;
  };

  const location =
    coordPart(form.locationACoordinates) ||
    coordPart(context.locationACoordinates) ||
    normalizeText(typeof form.locationA === "string" ? form.locationA : "") ||
    normalizeText(typeof context.locationA === "string" ? context.locationA : "");

  const watch = typeof input.watchSubcategory === "string" ? input.watchSubcategory : "";
  const streaming = Array.isArray(input.streamingServiceIds)
    ? [...input.streamingServiceIds].map((id) => String(id)).sort().join(",")
    : "";
  const day = new Date().toISOString().slice(0, 10);

  return `koi:v2:${stableHash([query, location, watch, streaming, day].join("|"))}`;
}
