import type { EventResult } from "@/lib/eventResult";
import { haversineMilesBetween } from "@/lib/eventDistance";
import { fetchWithTimeout } from "@/lib/providers/fetchWithTimeout";
import { withEventbriteCache } from "@/lib/eventbriteCache";
import {
  EVENTBRITE_API_BASE,
  getEventbriteToken,
  normalizeEventbriteEvent
} from "@/lib/providers/eventbriteEventProvider";
import { fetchTrendingWeekendEvents, upcomingWeekendWindow } from "@/lib/weekendTrendingEvents";
import {
  EVENTBRITE_ORGANIZATION_SOURCES,
  EVENTBRITE_VENUE_SOURCES,
  type EventbriteSource
} from "@/src/config/eventbriteSources";
import { logApiError } from "@/lib/serverLog";

const DEFAULT_RADIUS_MILES = 25;

export type EventbriteAuthState = "missing_key" | "invalid_key" | "valid" | "unknown";

/**
 * Mutually exclusive top-level states, ordered from earliest failure to success.
 * Use this to drive a single, clear status banner in dev tooling.
 */
export type EventbriteDiagnosticStatus =
  | "missing_api_key"
  | "invalid_api_key"
  | "no_sources_configured"
  | "sources_without_events"
  | "events_filtered_out"
  | "events_merged";

export type EventbriteSourceDiagnostic = {
  scope: "organization" | "venue";
  id: string;
  label: string;
  ok: boolean;
  error?: string;
  raw: number;
  afterDate: number;
  afterDistance: number;
};

export type EventbriteDiagnostic = {
  status: EventbriteDiagnosticStatus;
  apiKeyPresent: boolean;
  auth: EventbriteAuthState;
  authUser?: string;
  organizationSources: number;
  venueSources: number;
  rawEvents: number;
  afterDateFilter: number;
  afterDistanceFilter: number;
  mergedIntoTrending: number;
  radiusMiles: number;
  window: { start: string; end: string };
  origin: { latitude: number; longitude: number };
  sources: EventbriteSourceDiagnostic[];
  notes: string[];
};

export type EventbriteDiagnosticParams = {
  latitude: number;
  longitude: number;
  radiusMiles?: number;
  startDateTime?: string;
  endDateTime?: string;
};

/** Verify the token works with a safe, read-only auth check. */
export async function checkEventbriteAuth(
  token: string
): Promise<{ state: Exclude<EventbriteAuthState, "missing_key">; user?: string }> {
  try {
    const response = await fetchWithTimeout(`${EVENTBRITE_API_BASE}/users/me/`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      timeoutMs: 8000,
      timeoutMessage: "Eventbrite auth check timed out."
    });

    if (response.status === 401 || response.status === 403) return { state: "invalid_key" };
    if (!response.ok) return { state: "unknown" };

    const data = (await response.json()) as { name?: string; emails?: Array<{ email?: string }> };
    return { state: "valid", user: data.name || data.emails?.[0]?.email || "authenticated" };
  } catch (error) {
    logApiError("eventbrite-auth-check", error);
    return { state: "unknown" };
  }
}

/** Fetch a source's upcoming live events WITHOUT date filtering, so we can show the full funnel. */
async function fetchRawSourceEvents(
  scope: "organizations" | "venues",
  source: EventbriteSource,
  token: string
): Promise<{ events: EventResult[]; error?: string }> {
  const path = `/${scope}/${source.id}/events/`;
  const params: Record<string, string> = {
    status: "live",
    order_by: "start_asc",
    expand: "venue,category",
    page_size: "50",
    diagnostic: "1"
  };

  try {
    const payload = await withEventbriteCache(path, params, async () => {
      const url = new URL(`${EVENTBRITE_API_BASE}${path}`);
      for (const [key, value] of Object.entries(params)) {
        if (key === "diagnostic") continue;
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
        throw new Error(`HTTP ${response.status}: ${body.slice(0, 160)}`);
      }
      return (await response.json()) as { events?: Parameters<typeof normalizeEventbriteEvent>[0][] };
    });

    const events = (payload.events ?? [])
      .map((event) => normalizeEventbriteEvent(event))
      .filter((event): event is EventResult => Boolean(event));
    return { events };
  } catch (error) {
    logApiError(`eventbrite-diagnostic-${scope}`, error);
    return { events: [], error: error instanceof Error ? error.message : String(error) };
  }
}

function withinWindow(event: EventResult, start: Date, end: Date) {
  const time = new Date(event.startTime).getTime();
  if (Number.isNaN(time)) return false;
  return time >= start.getTime() && time <= end.getTime();
}

export async function runEventbriteDiagnostic(
  params: EventbriteDiagnosticParams
): Promise<EventbriteDiagnostic> {
  const radiusMiles = params.radiusMiles ?? DEFAULT_RADIUS_MILES;
  const weekend = upcomingWeekendWindow();
  const start = params.startDateTime ? new Date(params.startDateTime) : weekend.start;
  const end = params.endDateTime ? new Date(params.endDateTime) : weekend.end;

  const orgCount = EVENTBRITE_ORGANIZATION_SOURCES.length;
  const venueCount = EVENTBRITE_VENUE_SOURCES.length;
  const notes: string[] = [];

  const base: EventbriteDiagnostic = {
    status: "missing_api_key",
    apiKeyPresent: false,
    auth: "missing_key",
    organizationSources: orgCount,
    venueSources: venueCount,
    rawEvents: 0,
    afterDateFilter: 0,
    afterDistanceFilter: 0,
    mergedIntoTrending: 0,
    radiusMiles,
    window: { start: start.toISOString(), end: end.toISOString() },
    origin: { latitude: params.latitude, longitude: params.longitude },
    sources: [],
    notes
  };

  const token = getEventbriteToken();
  if (!token) {
    notes.push("Set EVENTBRITE_API_KEY (or EVENTBRITE_PRIVATE_TOKEN) to enable Eventbrite.");
    return base;
  }

  base.apiKeyPresent = true;

  const auth = await checkEventbriteAuth(token);
  base.auth = auth.state;
  base.authUser = auth.user;

  if (auth.state === "invalid_key") {
    base.status = "invalid_api_key";
    notes.push("Token was rejected by /users/me (401/403). Check the key in Vercel.");
    return base;
  }
  if (auth.state === "unknown") {
    notes.push("Could not confirm auth (network/non-200). Continuing with source checks.");
  }

  if (orgCount === 0 && venueCount === 0) {
    base.status = "no_sources_configured";
    notes.push("Add organizer/venue IDs in src/config/eventbriteSources.ts — Eventbrite shows nothing until then.");
    return base;
  }

  const orgResults = await Promise.all(
    EVENTBRITE_ORGANIZATION_SOURCES.map(async (source) => {
      const { events, error } = await fetchRawSourceEvents("organizations", source, token);
      return buildSourceDiagnostic("organization", source, events, error, start, end, params, radiusMiles);
    })
  );
  const venueResults = await Promise.all(
    EVENTBRITE_VENUE_SOURCES.map(async (source) => {
      const { events, error } = await fetchRawSourceEvents("venues", source, token);
      return buildSourceDiagnostic("venue", source, events, error, start, end, params, radiusMiles);
    })
  );

  const sources = [...orgResults, ...venueResults];
  base.sources = sources;
  base.rawEvents = sources.reduce((sum, item) => sum + item.raw, 0);
  base.afterDateFilter = sources.reduce((sum, item) => sum + item.afterDate, 0);
  base.afterDistanceFilter = sources.reduce((sum, item) => sum + item.afterDistance, 0);

  try {
    const trending = await fetchTrendingWeekendEvents(params.latitude, params.longitude);
    base.mergedIntoTrending = trending.filter((event) => event.source === "eventbrite").length;
  } catch (error) {
    logApiError("eventbrite-diagnostic-trending", error);
    notes.push("Trending merge check failed; merged count may be incomplete.");
  }

  if (base.rawEvents === 0) {
    base.status = "sources_without_events";
    notes.push("Configured sources returned 0 upcoming live events. Verify the IDs host public events.");
  } else if (base.afterDistanceFilter === 0) {
    base.status = "events_filtered_out";
    notes.push(
      `All ${base.rawEvents} event(s) were filtered out by date window or the ${radiusMiles}mi radius from this origin.`
    );
  } else {
    base.status = "events_merged";
  }

  return base;
}

function buildSourceDiagnostic(
  scope: "organization" | "venue",
  source: EventbriteSource,
  events: EventResult[],
  error: string | undefined,
  start: Date,
  end: Date,
  params: EventbriteDiagnosticParams,
  radiusMiles: number
): EventbriteSourceDiagnostic {
  const dated = events.filter((event) => withinWindow(event, start, end));
  const distanced = dated.filter((event) => {
    if (event.latitude == null || event.longitude == null) return true;
    return (
      haversineMilesBetween(params.latitude, params.longitude, event.latitude, event.longitude) <= radiusMiles
    );
  });

  return {
    scope,
    id: source.id,
    label: source.label,
    ok: !error,
    error,
    raw: events.length,
    afterDate: dated.length,
    afterDistance: distanced.length
  };
}

function isDev() {
  return process.env.NODE_ENV !== "production";
}

/** Quiet in production; emits the human-readable funnel in development. */
export function logEventbriteDiagnostic(diag: EventbriteDiagnostic) {
  if (!isDev()) return;

  const lines = [
    `Eventbrite: API key ${diag.apiKeyPresent ? "present" : "MISSING"}`,
    `Eventbrite: auth ${diag.auth}${diag.authUser ? ` (${diag.authUser})` : ""}`,
    `Eventbrite: organization sources count = ${diag.organizationSources}`,
    `Eventbrite: venue sources count = ${diag.venueSources}`,
    `Eventbrite: raw events returned = ${diag.rawEvents}`,
    `Eventbrite: after filters = ${diag.afterDistanceFilter}`,
    `Eventbrite: merged into trending = ${diag.mergedIntoTrending}`,
    `Eventbrite: status = ${diag.status}`
  ];
  for (const line of lines) console.info(line);
  for (const note of diag.notes) console.info(`Eventbrite: note - ${note}`);
}
