import { fetchWithTimeout } from "@/lib/providers/fetchWithTimeout";
import { recordProviderCall } from "@/lib/searchTelemetryRuntime";
import { logApiError } from "@/lib/serverLog";

/**
 * Lightweight Wikipedia enrichment. No API key required.
 *
 * Use this to attach short, human-friendly context blurbs to places, landmarks,
 * parks, towns, and attractions (e.g. answering "why is this place interesting?").
 * Every method degrades gracefully: any network/parse failure returns null so it
 * can never break a search flow.
 */

const DEFAULT_LANG = "en";
// Wikipedia asks API clients to send a descriptive User-Agent.
const USER_AGENT = "KoiLocalSearch/1.0 (https://github.com/; contextual place summaries)";
const REQUEST_TIMEOUT_MS = 6000;

export type WikipediaSummary = {
  title: string;
  /** One or two sentence plain-text blurb. */
  extract: string;
  /** Very short descriptor (e.g. "Public park in Philadelphia"), when available. */
  description?: string;
  /** Canonical article URL. */
  url: string;
  thumbnailUrl?: string;
};

export type PlaceSummaryQuery = {
  /** Primary place name (e.g. "Wissahickon Valley Park"). */
  name: string;
  /** Optional locality to disambiguate (e.g. "Philadelphia, PA"). */
  locality?: string;
  lang?: string;
};

type ActionSearchResponse = {
  query?: {
    search?: Array<{ title?: string }>;
  };
};

type RestSummaryResponse = {
  type?: string;
  title?: string;
  extract?: string;
  description?: string;
  content_urls?: { desktop?: { page?: string }; mobile?: { page?: string } };
  thumbnail?: { source?: string };
};

function apiBase(lang: string) {
  return `https://${lang}.wikipedia.org`;
}

function baseHeaders() {
  return {
    "Api-User-Agent": USER_AGENT,
    "User-Agent": USER_AGENT,
    Accept: "application/json"
  };
}

/**
 * Find the best-matching article title for a free-text query. Returns null when
 * nothing relevant is found.
 */
export async function searchWikipediaTitle(query: string, lang = DEFAULT_LANG): Promise<string | null> {
  const term = query.trim();
  if (!term) return null;

  const url = new URL(`${apiBase(lang)}/w/api.php`);
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("list", "search");
  url.searchParams.set("srsearch", term);
  url.searchParams.set("srlimit", "1");
  url.searchParams.set("srnamespace", "0");
  url.searchParams.set("origin", "*");

  try {
    recordProviderCall("wikipedia", "search");
    const response = await fetchWithTimeout(url, {
      cache: "no-store",
      headers: baseHeaders(),
      timeoutMs: REQUEST_TIMEOUT_MS,
      timeoutMessage: "Wikipedia search timed out."
    });
    if (!response.ok) return null;
    const data = (await response.json()) as ActionSearchResponse;
    const title = data.query?.search?.[0]?.title;
    return typeof title === "string" && title.trim() ? title.trim() : null;
  } catch (error) {
    logApiError("wikipedia-search", error);
    return null;
  }
}

/**
 * Fetch the REST summary for an exact article title. Disambiguation pages return
 * null so callers never surface ambiguous blurbs.
 */
export async function fetchWikipediaSummary(title: string, lang = DEFAULT_LANG): Promise<WikipediaSummary | null> {
  const cleaned = title.trim();
  if (!cleaned) return null;

  const url = `${apiBase(lang)}/api/rest_v1/page/summary/${encodeURIComponent(cleaned)}`;
  try {
    recordProviderCall("wikipedia", "summary");
    const response = await fetchWithTimeout(url, {
      cache: "no-store",
      headers: baseHeaders(),
      timeoutMs: REQUEST_TIMEOUT_MS,
      timeoutMessage: "Wikipedia summary timed out."
    });
    if (!response.ok) return null;

    const data = (await response.json()) as RestSummaryResponse;
    if (data.type === "disambiguation") return null;

    const extract = typeof data.extract === "string" ? data.extract.trim() : "";
    const resolvedTitle = typeof data.title === "string" ? data.title.trim() : cleaned;
    if (!extract) return null;

    const pageUrl =
      data.content_urls?.desktop?.page ||
      data.content_urls?.mobile?.page ||
      `${apiBase(lang)}/wiki/${encodeURIComponent(resolvedTitle.replace(/ /g, "_"))}`;

    return {
      title: resolvedTitle,
      extract,
      description: typeof data.description === "string" ? data.description.trim() : undefined,
      url: pageUrl,
      thumbnailUrl: typeof data.thumbnail?.source === "string" ? data.thumbnail.source : undefined
    };
  } catch (error) {
    logApiError("wikipedia-summary", error);
    return null;
  }
}

/**
 * One-shot helper: resolve a place name (optionally disambiguated by locality)
 * to a short contextual blurb. Returns null if nothing relevant is found.
 */
export async function getPlaceSummary(query: PlaceSummaryQuery): Promise<WikipediaSummary | null> {
  const lang = query.lang ?? DEFAULT_LANG;
  const name = query.name.trim();
  if (!name) return null;

  const searchTerm = query.locality ? `${name} ${query.locality}` : name;
  const title = await searchWikipediaTitle(searchTerm, lang);
  if (!title) return null;

  return fetchWikipediaSummary(title, lang);
}

export const wikipediaProvider = {
  searchWikipediaTitle,
  fetchWikipediaSummary,
  getPlaceSummary
};
