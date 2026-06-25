import type { EventResult } from "@/lib/eventResult";
import {
  extractSportsSearchKeyword,
  hasNamedTeamInQuery,
  isMusicEventQuery,
  isTeamSpecificSportsQuery,
  teamTicketmasterKeyword
} from "@/lib/localEventIntent";
import { extractMusicGenreFromQuery } from "@/lib/musicGenres";
import { resolveMusicArtistSearch } from "@/lib/musicArtists";
import { filterNamedArtistEvents } from "@/lib/musicEventFilter";
import { filterNamedTeamGameEvents } from "@/lib/sportsEventFilter";
import type { EventProvider, EventSearchParams } from "@/lib/providers/eventDiscoveryTypes";
import { withTicketmasterCache } from "@/lib/ticketmasterCache";

const DISCOVERY_BASE = "https://app.ticketmaster.com/discovery/v2";
/** Ticketmaster max per page (values above 200 are rejected). */
const MUSIC_PAGE_SIZE = "200";
/** Fetch two pages for music — still within deep-paging limit (200 × 2 = 400). */
const MUSIC_PAGES = 2;

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
    start?: {
      dateTime?: string;
      localDate?: string;
      localTime?: string;
      dateTBA?: boolean;
      dateTBD?: boolean;
      noSpecificTime?: boolean;
    };
    end?: { dateTime?: string; localDate?: string; localTime?: string };
    status?: { code?: string };
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

  const startTime =
    formatIsoDate(raw.dates?.start?.dateTime ?? raw.dates?.start?.localDate, raw.dates?.start?.localTime) ||
    (raw.dates?.start?.dateTBA || raw.dates?.start?.dateTBD ? "TBA" : "");
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

  if (/\bcomedy\b/.test(value)) tokens.push("comedy");
  if (/\b(?:theater|theatre)\b/.test(value)) tokens.push("theater");
  if (/\bfestivals?\b/.test(value)) tokens.push("festival");
  if (/\bfamily\b/.test(value)) tokens.push("family");

  if (tokens.length) return [...new Set(tokens)].join(" ");

  switch (profile) {
    case "date_night":
      return "";
    case "family":
      return "family";
    case "tonight":
      return isMusicEventQuery(query) ? "" : "comedy";
    case "weekend":
      return "";
    case "sports":
      return hasNamedTeamInQuery(query) ? teamTicketmasterKeyword(query) : extractSportsSearchKeyword(query);
    default:
      return "";
  }
}

function applyProfileFilters(
  params: Record<string, string>,
  profile?: EventSearchParams["profile"],
  query = "",
  segmentName?: string
) {
  if (segmentName) {
    params.segmentName = segmentName;
    const keyword = keywordForProfile(profile, query);
    if (keyword) params.keyword = keyword;
    return;
  }

  const musicGenre = extractMusicGenreFromQuery(query);
  const musicArtist = resolveMusicArtistSearch(query);
  const musicQuery =
    profile === "music" || isMusicEventQuery(query) || Boolean(musicGenre) || Boolean(musicArtist);

  if (profile === "sports") {
    params.segmentName = "Sports";
  } else if (musicQuery) {
    params.segmentName = "Music";
    // Date-bounded searches default to excluding TBA/TBD — include them for fuller catalogs.
    params.includeTBA = "yes";
    params.includeTBD = "yes";
  }

  if (musicGenre) {
    params.classificationName = musicGenre.ticketmasterClassification;
  } else if (musicArtist) {
    params.keyword = musicArtist.ticketmasterKeyword;
  } else {
    const keyword = keywordForProfile(profile, query);
    if (keyword) params.keyword = keyword;
  }
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
    const musicSearch =
      request.profile === "music" || isMusicEventQuery(request.query) || Boolean(resolveMusicArtistSearch(request.query));

    const params: Record<string, string> = {
      apikey: apiKey,
      size: musicSearch ? MUSIC_PAGE_SIZE : nationwideTeamSearch || hasNamedTeamInQuery(request.query) ? "50" : "20",
      sort: "date,asc",
      countryCode: "US"
    };

    if (!nationwideTeamSearch) {
      params.latlong = `${request.latitude},${request.longitude}`;
      params.radius = String(request.radiusMiles ?? (musicSearch ? 100 : 25));
      params.unit = "miles";
    }

    applyProfileFilters(params, request.profile, request.query, request.segmentName);

    if (request.startDateTime) params.startDateTime = formatTicketmasterDateTime(request.startDateTime);
    if (request.endDateTime) params.endDateTime = formatTicketmasterDateTime(request.endDateTime);

    const pageCount = musicSearch ? MUSIC_PAGES : 1;
    const rawEvents: TicketmasterEvent[] = [];

    for (let page = 0; page < pageCount; page += 1) {
      const pageParams = { ...params, page: String(page) };
      const payload = await withTicketmasterCache("/events.json", pageParams, async () => {
        const url = new URL(`${DISCOVERY_BASE}/events.json`);
        for (const [key, value] of Object.entries(pageParams)) {
          url.searchParams.set(key, value);
        }

        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Ticketmaster search failed with ${response.status}.`);
        }

        return (await response.json()) as TicketmasterEventsResponse;
      });

      const batch = payload._embedded?.events ?? [];
      rawEvents.push(...batch);
      if (batch.length < Number(MUSIC_PAGE_SIZE)) break;
    }

    const events = rawEvents
      .map((event) => normalizeEvent(event))
      .filter((event): event is EventResult => Boolean(event?.startTime));

    const teamFiltered = filterNamedTeamGameEvents(events, request.query);
    return filterNamedArtistEvents(teamFiltered, request.query);
  }
};
