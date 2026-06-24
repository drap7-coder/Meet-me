import { getRedisConfig, redisCommand } from "@/lib/redisRest";
import { recordCacheHit, recordCacheMiss, recordProviderCall } from "@/lib/searchTelemetryRuntime";

const CACHE_PREFIX = "ticketmaster:v2:";
const CACHE_TTL_SECONDS = 60 * 30;

type MemoryEntry = {
  value: string;
  expiresAt: number;
};

function getMemoryStore() {
  const globalStore = globalThis as typeof globalThis & {
    __ticketmasterCache?: Map<string, MemoryEntry>;
  };
  globalStore.__ticketmasterCache ??= new Map<string, MemoryEntry>();
  return globalStore.__ticketmasterCache;
}

function cacheKey(path: string, params: Record<string, string>) {
  const paramKey = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return `${CACHE_PREFIX}${path}?${paramKey}`;
}

async function readCache(key: string) {
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

async function writeCache(key: string, value: string) {
  if (getRedisConfig()) {
    await redisCommand(["SET", key, value, "EX", String(CACHE_TTL_SECONDS)]);
    return;
  }

  getMemoryStore().set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_SECONDS * 1000
  });
}

export async function withTicketmasterCache<T>(path: string, params: Record<string, string>, loader: () => Promise<T>) {
  const key = cacheKey(path, params);
  const cached = await readCache(key);
  if (cached) {
    try {
      recordCacheHit("ticketmaster");
      return JSON.parse(cached) as T;
    } catch {
      // fall through
    }
  }

  recordCacheMiss("ticketmaster");
  recordProviderCall("ticketmaster", path);
  const result = await loader();
  await writeCache(key, JSON.stringify(result));
  return result;
}
