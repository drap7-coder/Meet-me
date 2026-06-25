import { fetchWithTimeout } from "@/lib/providers/fetchWithTimeout";
import { recordProviderCall } from "@/lib/searchTelemetryRuntime";
import type { LatLng } from "@/lib/types";

const OCM_POI_URL = "https://api.openchargemap.io/v3/poi";

/** A normalized Open Charge Map point of interest (charging location). */
export type OpenChargeMapPoi = {
  id: number;
  title: string;
  location: LatLng;
  /** True when any connection reports fast/rapid charging (Level 3 or >= 43 kW). */
  isFastCharger: boolean;
};

/** Reads the Open Charge Map API key from the environment, if configured. */
export function getOpenChargeMapApiKey(): string | undefined {
  const key = process.env.OPENCHARGEMAP_API_KEY?.trim();
  return key ? key : undefined;
}

export function hasOpenChargeMapApiKey(): boolean {
  return Boolean(getOpenChargeMapApiKey());
}

type FetchChargersParams = {
  origin: LatLng;
  /** Search radius in kilometers (Open Charge Map "distance"). */
  radiusKm?: number;
  maxResults?: number;
  signal?: AbortSignal;
};

/**
 * Fetch charging locations near an origin from Open Charge Map. Returns an empty
 * list when no API key is configured, so callers can treat it as a safe no-op.
 */
export async function fetchNearbyChargers(params: FetchChargersParams): Promise<OpenChargeMapPoi[]> {
  const key = getOpenChargeMapApiKey();
  if (!key) return [];

  const url = new URL(OCM_POI_URL);
  url.searchParams.set("output", "json");
  url.searchParams.set("latitude", String(params.origin.lat));
  url.searchParams.set("longitude", String(params.origin.lng));
  url.searchParams.set("distance", String(params.radiusKm ?? 25));
  url.searchParams.set("distanceunit", "KM");
  url.searchParams.set("maxresults", String(params.maxResults ?? 100));
  url.searchParams.set("compact", "true");
  url.searchParams.set("verbose", "false");
  url.searchParams.set("key", key);

  recordProviderCall("openchargemap", "poi");
  const response = await fetchWithTimeout(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
    timeoutMs: 8000,
    timeoutMessage: "Open Charge Map request timed out.",
    signal: params.signal
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Open Charge Map failed with ${response.status}: ${body.slice(0, 180)}`);
  }

  const data = (await response.json()) as unknown;
  if (!Array.isArray(data)) return [];

  return data
    .map(normalizePoi)
    .filter((poi): poi is OpenChargeMapPoi => poi !== null);
}

function normalizePoi(raw: unknown): OpenChargeMapPoi | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as {
    ID?: unknown;
    AddressInfo?: { Title?: unknown; Latitude?: unknown; Longitude?: unknown } | null;
    Connections?: Array<{ LevelID?: unknown; PowerKW?: unknown; Level?: { IsFastChargeCapable?: unknown } | null }> | null;
  };

  const lat = value.AddressInfo?.Latitude;
  const lng = value.AddressInfo?.Longitude;
  if (typeof lat !== "number" || typeof lng !== "number") return null;

  const id = typeof value.ID === "number" ? value.ID : Number.NaN;
  const title = typeof value.AddressInfo?.Title === "string" ? value.AddressInfo.Title : "Charging station";

  const connections = Array.isArray(value.Connections) ? value.Connections : [];
  const isFastCharger = connections.some((connection) => {
    const level = typeof connection.LevelID === "number" ? connection.LevelID : null;
    const powerKw = typeof connection.PowerKW === "number" ? connection.PowerKW : null;
    const fastCapable = connection.Level?.IsFastChargeCapable === true;
    return fastCapable || level === 3 || (powerKw != null && powerKw >= 43);
  });

  return {
    id: Number.isNaN(id) ? Math.round((lat + lng) * 1e6) : id,
    title,
    location: { lat, lng },
    isFastCharger
  };
}
