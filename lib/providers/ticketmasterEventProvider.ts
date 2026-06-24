import type { EventResult } from "@/lib/eventResult";
import {
  extractSportsSearchKeyword,
  hasNamedTeamInQuery,
  isTeamSpecificSportsQuery,
  teamTicketmasterKeyword
} from "@/lib/localEventIntent";
import { filterNamedTeamGameEvents } from "@/lib/sportsEventFilter";
import type { EventProvider, EventSearchParams } from "@/lib/providers/eventDiscoveryTypes";
import { withTicketmasterCache } from "@/lib/ticketmasterCache";

const DISCOVERY_BASE = "https://app.ticketmaster.com/discovery/v2";

type TicketmasterEventsResponse = {
  _embedded?: {
    events?: TicketmasterEvent[];
  };
};

type TicketmasterEvent = {
  id?: string;
  name?: string;
  url?: string;
  images?: Array<{ url?: string; ratio?: string; width?: number }>;
  dates?: {
    start?: { dateTime?: string; localDate?: string; localTime?: string };
    end?: { dateTime?: string; localDate?: string; localTime?: string };
  };
  distance?: number;
  classifications?: Array<{
    segment?: { name?: string };
    genre?: { name?: string };
    subGenre?: { name?: string };
  }>;
  _embedded?: {
    venues?: Array<{
      name?: string;
      city?: { name?: string };
      state?: { stateCode?: string };
      location?: { latitude?: string; longitude?: string };
    }>;
  };
};

function getTicketmasterApiKey() {
  return process.env.TICKETMASTER_API_KEY?.trim() ?? "";
}

function formatIsoDate(date?: string, time?: string) {
  if (!date) return "";
  if (date.includes("T")) return date;
  return time ? `${date}T${time}` : `${date}T00:00:00`;
}

function pickImage(images: TicketmasterEvent["images"]) {
  const sorted = [...(images ?? [])].sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  return sorted.find((image) => image.url)?.url ?? "";
}

function normalizeEvent(raw: TicketmasterEvent): EventResult | null {
  if (!raw.id || !raw.name) return null;

  const venue = raw._embedded?.venues?.[0];
  const classification = raw.classifications?.[0];
  const category =
    classification?.genre?.name ||
    classification?.segment?.name ||
    classification?.subGenre?.name ||
    "Live event";

  const startTime = formatIsoDate(raw.dates?.start?.dateTime ?? raw.dates?.start?.localDate, raw.dates?.start?.localTime);
  const endTime = formatIsoDate(raw.dates?.end?.dateTime ?? raw.dates?.end?.localDate, raw.dates?.end?.localTime);

  const latitude = parseCoordinate(venue?.location?.latitude);
  const longitude = parseCoordinate(venue?.location?.longitude);

  return {
    id: raw.id,
    title: raw.name.trim(),
    category,
    venue: venue?.name?.trim() || "Venue TBA",
    startTime,
    endTime: endTime || undefined,
    city: venue?.city?.name?.trim() || "",
    state: venue?.state?.stateCode?.trim() || "",
    distance: typeof raw.distance === "number" ? raw.distance : undefined,
    latitude,
    longitude,
    ticketUrl: raw.url,
    imageUrl: pickImage(raw.images) || undefined,
    source: "ticketmaster"
  };
}

function parseCoordinate(value?: string): number | undefined {
  if (value == null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Ticketmaster keyword matches event names only — not natural-language queries. */
function keywordForProfile(profile?: EventSearchParams["profile"], query = "") {
  const value = query.toLowerCase();
  const tokens: string[] = [];

  if (/\bconcerts?\b/.test(value)) tokens.push("concert");
  if (/\bcomedy\b/.test(value)) tokens.push("comedy");
  if (/\b(?:theater|theatre)\b/.test(value)) tokens.push("theater");
  if (/\bfestivals?\b/.test(value)) tokens.push("festival");
  if (/\bfamily\b/.test(value)) tokens.push("family");
  if (/\bmusic\b/.test(value)) tokens.push("music");

  if (tokens.length) return [...new Set(tokens)].join(" ");

  switch (profile) {
    case "date_night":
      return "";
    case "family":
      return "family";
    case "tonight":
      return "comedy";
    case "weekend":
      return "";
    case "sports":
      return hasNamedTeamInQuery(query) ? teamTicketmasterKeyword(query) : extractSportsSearchKeyword(query);
    default:
      return "";
  }
}

function applyProfileFilters(params: Record<string, string>, profile?: EventSearchParams["profile"], query = "") {
  if (profile === "sports") {
    params.segmentName = "Sports";
  }

  const keyword = keywordForProfile(profile, query);
  if (keyword) params.keyword = keyword;
}

function formatTicketmasterDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export const ticketmasterEventProvider: EventProvider = {
  isConfigured() {
    return Boolean(getTicketmasterApiKey());
  },

  async searchEvents(request: EventSearchParams) {
    const apiKey = getTicketmasterApiKey();
    if (!apiKey) return [];

    const nationwideTeamSearch =
      request.profile === "sports" && isTeamSpecificSportsQuery(request.query);

    const params: Record<string, string> = {
      apikey: apiKey,
      size: nationwideTeamSearch || hasNamedTeamInQuery(request.query) ? "50" : "20",
      sort: "date,asc",
      countryCode: "US"
    };

    if (!nationwideTeamSearch) {
      params.latlong = `${request.latitude},${request.longitude}`;
      params.radius = String(request.radiusMiles ?? 25);
      params.unit = "miles";
    }

    applyProfileFilters(params, request.profile, request.query);

    if (request.startDateTime) params.startDateTime = formatTicketmasterDateTime(request.startDateTime);
    if (request.endDateTime) params.endDateTime = formatTicketmasterDateTime(request.endDateTime);

    const payload = await withTicketmasterCache("/events.json", params, async () => {
      const url = new URL(`${DISCOVERY_BASE}/events.json`);
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }

      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Ticketmaster search failed with ${response.status}.`);
      }

      return (await response.json()) as TicketmasterEventsResponse;
    });

    const events = (payload._embedded?.events ?? [])
      .map((event) => normalizeEvent(event))
      .filter((event): event is EventResult => Boolean(event?.startTime));

    return filterNamedTeamGameEvents(events, request.query);
  }
};
