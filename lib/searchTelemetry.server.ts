import "server-only";

import { AsyncLocalStorage } from "async_hooks";
import { createHash } from "crypto";
import { resolveSearchCategoryFromQuery } from "@/lib/categories";
import { deriveKillSignals } from "@/lib/searchKillList";
import type { KoiSearchApiResponse } from "@/lib/searchIntent";
import {
  registerSearchTelemetryBackend,
  SearchTelemetryCollector,
  type SearchTelemetryKind
} from "@/lib/searchTelemetryRuntime";
import { logSearchInfo } from "@/lib/serverLog";
import type { SearchHalfwayResponse, WatchEventsResult } from "@/lib/types";
import { resolveKoiBotMode } from "@/lib/watchEvents";

export type { SearchTelemetryKind } from "@/lib/searchTelemetryRuntime";

export type SearchTelemetryOutcome = {
  endpoint: string;
  searchKind: SearchTelemetryKind;
  resolvedKind?: SearchTelemetryKind | "needs_location";
  query?: string;
  categoryHint?: string;
  status: number;
  resultCount: number | null;
  startedAt: number;
  errorMessage?: string;
  /** Kill-list inputs that only the caller can know (computed from the result body). */
  topPickPresent?: boolean | null;
  eventsReturned?: number | null;
};

const storage = new AsyncLocalStorage<SearchTelemetryCollector>();

registerSearchTelemetryBackend({
  getCollector: () => storage.getStore() ?? null
});

export async function executeInSearchTelemetry<T>(
  fn: () => Promise<T>
): Promise<{ result: T; collector: SearchTelemetryCollector }> {
  const existing = storage.getStore();
  if (existing) {
    return { result: await fn(), collector: existing };
  }

  const collector = new SearchTelemetryCollector();
  const result = await storage.run(collector, fn);
  return { result, collector };
}

export function hashSearchQuery(query: string): string {
  const normalized = query.trim().toLowerCase().replace(/\s+/g, " ");
  return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

export function categorizeSearchQuery(query: string): string {
  const trimmed = query.trim();
  const mode = resolveKoiBotMode(trimmed);
  if (mode === "watch") return "watch_intent";
  if (mode === "events") return "events_intent";
  return resolveSearchCategoryFromQuery(trimmed).category || "places_intent";
}

export function summarizeSearchQuery(query: string | undefined, categoryHint?: string) {
  const trimmed = (query ?? "").trim();
  if (!trimmed) {
    return {
      hash: null as string | null,
      category: categoryHint?.trim() || "form_driven"
    };
  }

  return {
    hash: hashSearchQuery(trimmed),
    category: categoryHint?.trim() || categorizeSearchQuery(trimmed)
  };
}

export function countPlacesResults(body: unknown): number | null {
  if (!body || typeof body !== "object") return null;
  const venues = (body as SearchHalfwayResponse).venues;
  return Array.isArray(venues) ? venues.length : null;
}

export function countWatchEventsResults(body: unknown): number | null {
  if (!body || typeof body !== "object") return null;
  const record = body as WatchEventsResult;
  if (typeof record.resultCount === "number") return record.resultCount;
  return Array.isArray(record.recommendations) ? record.recommendations.length : null;
}

export function countKoiSearchResult(result: KoiSearchApiResponse): number {
  if (result.kind === "needs_location") return 0;
  if (result.kind === "places") return result.data.venues.length;
  return countWatchEventsResults(result.data) ?? 0;
}

export function finalizeSearchTelemetry(
  outcome: SearchTelemetryOutcome,
  collector: SearchTelemetryCollector = storage.getStore() ?? new SearchTelemetryCollector()
) {
  const queryMeta = summarizeSearchQuery(outcome.query, outcome.categoryHint);
  const providerCalls = collector.getProviderCalls();
  const providerErrors = collector.getProviderErrors();
  const discardedProviders = collector.getDiscardedProviders();
  const cache = collector.getCacheStats();
  const durationMs = Math.max(0, Date.now() - outcome.startedAt);
  const ok = outcome.status >= 200 && outcome.status < 400;

  const killList = deriveKillSignals({
    durationMs,
    status: outcome.status,
    ok,
    resultCount: outcome.resultCount,
    searchKind: outcome.searchKind,
    resolvedKind: outcome.resolvedKind,
    providerCalls,
    providerErrors,
    discardedProviders,
    cache,
    topPickPresent: outcome.topPickPresent,
    eventsReturned: outcome.eventsReturned
  });

  logSearchInfo({
    endpoint: outcome.endpoint,
    searchKind: outcome.searchKind,
    ...(outcome.resolvedKind ? { resolvedKind: outcome.resolvedKind } : {}),
    queryHash: queryMeta.hash,
    queryCategory: queryMeta.category,
    llmUsed: collector.llmUsed,
    providerCalls,
    providerCallCount: providerCalls.length,
    ...(providerErrors.length ? { providerErrors } : {}),
    ...(discardedProviders.length ? { discardedProviders } : {}),
    ...(cache ? { cache } : {}),
    durationMs,
    resultCount: outcome.resultCount,
    ...(outcome.topPickPresent != null ? { topPickPresent: outcome.topPickPresent } : {}),
    ...(outcome.eventsReturned != null ? { eventsReturned: outcome.eventsReturned } : {}),
    status: outcome.status,
    ok,
    killList,
    ...(killList.reasons.length ? { killReasons: killList.reasons } : {}),
    ...(outcome.errorMessage ? { errorMessage: outcome.errorMessage } : {})
  });
}
