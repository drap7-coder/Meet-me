import { normalizeCategory } from "@/lib/categories";
import type { LatLng, MeetupMode, Preference, ScoredVenue, SearchHalfwayRequest, SearchMode, VenueCategory } from "@/lib/types";

const SHARE_PREFIX = "halfway:share:";
const SHARE_TTL_SECONDS = 60 * 60 * 24 * 30;

export type SharePayload = {
  locationA: {
    label: string;
    placeId?: string;
  };
  locationB: {
    label: string;
    placeId?: string;
  };
  category: VenueCategory;
  searchMode?: SearchMode;
  meetupMode?: MeetupMode;
  customQuery?: string;
  preferences: Preference[];
  midpoint?: LatLng;
  selectedResultIds?: string[];
  recommendations?: Pick<ScoredVenue, "id" | "name" | "category" | "googleMapsUri">[];
  createdAt: string;
};

type RedisConfig = {
  url: string;
  token: string;
};

const memoryStore = getMemoryStore();

export async function createShare(payload: SharePayload) {
  const shortId = createShortId();
  const key = `${SHARE_PREFIX}${shortId}`;
  const redis = getRedisConfig();

  if (redis) {
    await redisCommand(redis, ["SET", key, JSON.stringify(payload), "EX", String(SHARE_TTL_SECONDS)]);
    return shortId;
  }

  if (process.env.NODE_ENV === "production") {
    warnNoDurableStorage();
    return encodePortablePayload(payload);
  }

  warnNoDurableStorage();
  memoryStore.set(shortId, payload);
  return shortId;
}

export async function getShare(id: string) {
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeId) return null;

  if (safeId.startsWith("p_")) {
    return decodePortablePayload(safeId);
  }

  const redis = getRedisConfig();

  if (redis) {
    const value = await redisCommand(redis, ["GET", `${SHARE_PREFIX}${safeId}`]);
    if (typeof value !== "string") return null;
    return JSON.parse(value) as SharePayload;
  }

  warnNoDurableStorage();
  return memoryStore.get(safeId) ?? null;
}

export function sharePayloadToSearchRequest(payload: SharePayload): SearchHalfwayRequest {
  return {
    locationA: payload.locationA.label,
    locationAPlaceId: payload.locationA.placeId,
    locationB: payload.locationB.label,
    locationBPlaceId: payload.locationB.placeId,
    category: normalizeCategory(payload.category),
    searchMode: payload.searchMode ?? "midpoint",
    meetupMode: payload.meetupMode,
    customQuery: payload.customQuery,
    preferences: payload.preferences
  };
}

function getRedisConfig(): RedisConfig | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

async function redisCommand(config: RedisConfig, command: string[]) {
  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Share storage failed with ${response.status}.`);
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

function createShortId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

let warned = false;
function warnNoDurableStorage() {
  if (warned) return;
  warned = true;
  console.warn(
    "[shareStore] Durable share storage is not configured. Set KV_REST_API_URL/KV_REST_API_TOKEN or UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN. In-memory fallback is for local development only."
  );
}

function getMemoryStore() {
  const globalStore = globalThis as typeof globalThis & {
    __halfwayShareStore?: Map<string, SharePayload>;
  };
  globalStore.__halfwayShareStore ??= new Map<string, SharePayload>();
  return globalStore.__halfwayShareStore;
}

function encodePortablePayload(payload: SharePayload) {
  const compact = {
    a: payload.locationA,
    b: payload.locationB,
    c: payload.category,
    sm: payload.searchMode,
    mode: payload.meetupMode,
    q: payload.customQuery,
    p: payload.preferences,
    m: payload.midpoint,
    r: payload.selectedResultIds,
    t: payload.createdAt
  };
  return `p_${Buffer.from(JSON.stringify(compact), "utf8").toString("base64url")}`;
}

function decodePortablePayload(id: string): SharePayload | null {
  try {
    const compact = JSON.parse(Buffer.from(id.slice(2), "base64url").toString("utf8")) as {
      a: SharePayload["locationA"];
      b: SharePayload["locationB"];
      c: SharePayload["category"];
      sm?: SharePayload["searchMode"];
      mode?: SharePayload["meetupMode"];
      q?: string;
      p?: SharePayload["preferences"];
      m?: SharePayload["midpoint"];
      r?: SharePayload["selectedResultIds"];
      t?: string;
    };
    return {
      locationA: compact.a,
      locationB: compact.b,
      category: compact.c,
      searchMode: compact.sm,
      meetupMode: compact.mode,
      customQuery: compact.q,
      preferences: compact.p ?? [],
      midpoint: compact.m,
      selectedResultIds: compact.r,
      createdAt: compact.t ?? new Date().toISOString()
    };
  } catch {
    return null;
  }
}
