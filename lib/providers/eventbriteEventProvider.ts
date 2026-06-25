import type { EventResult } from "@/lib/eventResult";
import type { EventProvider, EventSearchParams } from "@/lib/providers/eventDiscoveryTypes";
import { fetchWithTimeout } from "@/lib/providers/fetchWithTimeout";
import { withEventbriteCache } from "@/lib/eventbriteCache";
import { haversineMilesBetween } from "@/lib/eventDistance";
import { logApiError } from "@/lib/serverLog";
import {
  EVENTBRITE_ORGANIZATION_SOURCES,
  EVENTBRITE_VENUE_SOURCES,
  getEventbriteFoodMarketSources,
  hasEventbriteFoodMarketSources,
  hasEventbriteSources,
  type EventbriteSource
} from "@/src/config/eventbriteSources";
import { upcomingWeekendWindow } from "@/lib/weekendWindow";

export const EVENTBRITE_API_BASE = "https://www.eventbriteapi.com/v3";
const API_BASE = EVENTBRITE_API_BASE;
const PAGE_SIZE = 50;
const DEFAULT_RADIUS_MILES = 25;
/** Eventbrite category_id -> readable label. Unknown ids fall back to "Local event". */
const CATEGORY_LABELS: Record<string, string> = {
  "103": "Music",
  "104": "Film & Media",
  "105": "Arts",
  "108": "Sports & Fitness",
  "110": "Food & Drink",
  "113": "Community",
  "116": "Hobbies",
  "119": "Family & Education",
  "199": "Other"
};

type EventbriteDateTime = { utc?: string; local?: string; timezone?: string };

type EventbriteVenue = {
  id?: string;
  name?: string;
  latitude?: string;
  longitude?: string;
  address?: {
    city?: string;
    region?: string;
    latitude?: string;
    longitude?: string;
  };
};

type EventbriteEvent = {
  id?: string;
  name?: { text?: string };
  url?: string;
  start?: EventbriteDateTime;
  end?: EventbriteDateTime;
  status?: string;
  online_event?: boolean;
  category_id?: string | null;
  logo?: { url?: string } | null;
  venue?: EventbriteVenue | null;
};

type EventbriteEventsResponse = {
  events?: EventbriteEvent[];
};

export function getEventbriteToken() {
  return (
    // Note: env var names are case-sensitive. "Eventbrite_API_Key" matches the
    // name provisioned in Vercel; the others are accepted as conventional aliases.
    process.env.Eventbrite_API_Key?.trim() ||
    process.env.EVENTBRITE_API_KEY?.trim() ||
    process.env.EVENTBRITE_PRIVATE_TOKEN?.trim() ||
    process.env.EVENTBRITE_OAUTH_TOKEN?.trim() ||
    ""
  );
}

export function hasEventbriteApiKey() {
  return Boolean(getEventbriteToken());
}

function parseCoordinate(value?: string | null): number | undefined {
  if (value == null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function normalizeEventbriteEvent(raw: EventbriteEvent): EventResult | null {
  if (!raw.id || !raw.name?.text) return null;
  if (raw.online_event) return null;
  if (raw.status && raw.status !== "live" && raw.status !== "started") return null;

  const startTime = raw.start?.utc ?? raw.start?.local ?? "";
  if (!startTime) return null;

  const venue = raw.venue ?? undefined;
  const latitude = parseCoordinate(venue?.latitude) ?? parseCoordinate(venue?.address?.latitude);
  const longitude = parseCoordinate(venue?.longitude) ?? parseCoordinate(venue?.address?.longitude);

  return {
    id: raw.id,
    title: raw.name.text.trim(),
    category: (raw.category_id && CATEGORY_LABELS[raw.category_id]) || "Local event",
    venue: venue?.name?.trim() || "Local venue",
    startTime,
    endTime: raw.end?.utc ?? raw.end?.local ?? undefined,
    city: venue?.address?.city?.trim() || "",
    state: venue?.address?.region?.trim() || "",
    latitude,
    longitude,
    ticketUrl: raw.url,
    imageUrl: raw.logo?.url || undefined,
    source: "eventbrite"
  };
}

async function fetchSourceEvents(
  scope: "organizations" | "venues",
  source: EventbriteSource,
  token: string,
  window: { startDateTime?: string; endDateTime?: string }
): Promise<EventResult[]> {
  const path = `/${scope}/${source.id}/events/`;
  const params: Record<string, string> = {
    status: "live",
    order_by: "start_asc",
    expand: "venue,category",
    page_size: String(PAGE_SIZE)
  };
  if (window.startDateTime) params["start_date.range_start"] = toEventbriteTimestamp(window.startDateTime);
  if (window.endDateTime) params["start_date.range_end"] = toEventbriteTimestamp(window.endDateTime);

  try {
    const payload = await withEventbriteCache(path, params, async () => {
      const url = new URL(`${API_BASE}${path}`);
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }

      const response = await fetchWithTimeout(url, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        timeoutMs: 8000,
        timeoutMessage: "Eventbrite request timed out."
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Eventbrite ${scope} ${source.id} failed with ${response.status}: ${body.slice(0, 180)}`);
      }

      return (await response.json()) as EventbriteEventsResponse;
    });

    return (payload.events ?? [])
      .map((event) => normalizeEventbriteEvent(event))
      .filter((event): event is EventResult => Boolean(event));
  } catch (error) {
    logApiError(`eventbrite-${scope}`, error);
    return [];
  }
}

/** Eventbrite expects naive ISO timestamps without milliseconds or trailing "Z". */
function toEventbriteTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().replace(/\.\d{3}Z$/, "Z").replace("Z", "");
}

/**
 * Eventbrite is an OWNED/AUTHORIZED-SOURCE-ONLY provider. There is no public geo
 * search API, and public /o/ page IDs are not fetchable (404/403). It only returns
 * events for organization/venue IDs this token owns or is authorized for, listed in
 * src/config/eventbriteSources.ts. It is deprioritized behind Ticketmaster.
 */
async function collectAuthorizedEvents(
  request: EventSearchParams,
  organizations: EventbriteSource[],
  venues: EventbriteSource[]
): Promise<EventResult[]> {
  const token = getEventbriteToken();
  if (!token || (organizations.length === 0 && venues.length === 0)) return [];

  const window = { startDateTime: request.startDateTime, endDateTime: request.endDateTime };

  const batches = await Promise.all([
    ...organizations.map((source) => fetchSourceEvents("organizations", source, token, window)),
    ...venues.map((source) => fetchSourceEvents("venues", source, token, window))
  ]);

  const radiusMiles = request.radiusMiles ?? DEFAULT_RADIUS_MILES;
  const events: EventResult[] = [];
  const seen = new Set<string>();

  for (const event of batches.flat()) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);

    if (event.latitude != null && event.longitude != null) {
      const distance = haversineMilesBetween(
        request.latitude,
        request.longitude,
        event.latitude,
        event.longitude
      );
      if (distance > radiusMiles) continue;
      events.push({ ...event, distance });
    } else {
      events.push(event);
    }
  }

  return events;
}

/** One cached fetch for food_markets-tagged sources only — optional farmers market enrichment. */
export async function fetchEventbriteFoodMarketEvents(
  latitude: number,
  longitude: number
): Promise<EventResult[]> {
  if (!hasEventbriteApiKey() || !hasEventbriteFoodMarketSources()) return [];

  const { organizations, venues } = getEventbriteFoodMarketSources();
  const window = upcomingWeekendWindow();

  return collectAuthorizedEvents(
    {
      query: "farmers market",
      latitude,
      longitude,
      radiusMiles: DEFAULT_RADIUS_MILES,
      startDateTime: window.start.toISOString(),
      endDateTime: window.end.toISOString(),
      resultCap: 8
    },
    organizations,
    venues
  );
}

export function isEventbriteFoodMarketConfigured() {
  return hasEventbriteApiKey() && hasEventbriteFoodMarketSources();
}

export const eventbriteEventProvider: EventProvider = {
  name: "eventbrite",

  isConfigured() {
    return Boolean(getEventbriteToken()) && hasEventbriteSources();
  },

  async searchEvents(request: EventSearchParams) {
    if (!getEventbriteToken() || !hasEventbriteSources()) return [];
    return collectAuthorizedEvents(request, EVENTBRITE_ORGANIZATION_SOURCES, EVENTBRITE_VENUE_SOURCES);
  }
};
