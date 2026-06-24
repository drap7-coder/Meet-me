import type { ProviderCallRecord } from "@/lib/searchTelemetryRuntime";

/**
 * The "kill-list": privacy-safe heuristics that flag searches where Koi is weak,
 * slow, expensive, or confusing. Everything here works off telemetry metadata
 * (hashes, counts, durations) — never raw query text.
 */

export const SLOW_SEARCH_MS = 2500;
export const HIGH_COST_PROVIDER_CALLS = 4;

export type CacheStats = Record<string, { hits: number; misses: number }>;

export type KillSignalInput = {
  durationMs: number;
  status: number;
  ok: boolean;
  resultCount: number | null;
  searchKind: string;
  resolvedKind?: string;
  providerCalls: ProviderCallRecord[];
  providerErrors: ProviderCallRecord[];
  discardedProviders: string[];
  cache?: CacheStats | null;
  topPickPresent?: boolean | null;
  eventsReturned?: number | null;
};

export type KillSignals = {
  zeroResult: boolean;
  slow: boolean;
  providerFailure: boolean;
  noTopPick: boolean;
  eventIntentNoResults: boolean;
  googleDiscarded: boolean;
  duplicate: boolean;
  highCost: boolean;
  reasons: string[];
};

function isEventIntent(input: KillSignalInput): boolean {
  return input.resolvedKind === "events" || input.searchKind === "events";
}

function hasProvider(calls: ProviderCallRecord[], provider: string): boolean {
  return calls.some((call) => call.provider === provider);
}

function cacheHits(cache: CacheStats | null | undefined, layer: string): number {
  return cache?.[layer]?.hits ?? 0;
}

export function deriveKillSignals(input: KillSignalInput): KillSignals {
  const zeroResult = input.ok && input.resultCount === 0;
  const slow = input.durationMs >= SLOW_SEARCH_MS;
  const providerFailure = input.providerErrors.length > 0 || (!input.ok && input.status >= 500);
  const noTopPick = input.topPickPresent === false;

  const eventIntent = isEventIntent(input);
  const eventsReturned = input.eventsReturned;
  const eventIntentNoResults =
    eventIntent && (eventsReturned === 0 || (eventsReturned == null && input.resultCount === 0));

  const googleDiscarded =
    input.discardedProviders.includes("google") ||
    (hasProvider(input.providerCalls, "google") && eventIntent && (eventsReturned ?? 0) > 0 && (input.resultCount ?? 0) === 0);

  // A response-cache hit means we served a repeat of a recent identical search.
  const duplicate = cacheHits(input.cache, "koi_response") > 0;
  const highCost = input.providerCalls.length >= HIGH_COST_PROVIDER_CALLS;

  const reasons: string[] = [];
  if (zeroResult) reasons.push("zero_result");
  if (slow) reasons.push("slow");
  if (providerFailure) reasons.push("provider_failure");
  if (noTopPick) reasons.push("no_top_pick");
  if (eventIntentNoResults) reasons.push("event_intent_no_results");
  if (googleDiscarded) reasons.push("google_discarded");
  if (duplicate) reasons.push("duplicate");
  if (highCost) reasons.push("high_cost");

  return {
    zeroResult,
    slow,
    providerFailure,
    noTopPick,
    eventIntentNoResults,
    googleDiscarded,
    duplicate,
    highCost,
    reasons
  };
}

// --- Weekly report aggregation ---------------------------------------------

export type TelemetryRecord = {
  event?: string;
  queryCategory?: string;
  durationMs?: number;
  resultCount?: number | null;
  providerCallCount?: number;
  status?: number;
  ok?: boolean;
  killList?: Partial<KillSignals>;
};

type CategoryStat = {
  category: string;
  count: number;
};

type SlowStat = {
  category: string;
  count: number;
  avgMs: number;
  maxMs: number;
};

type CostStat = {
  category: string;
  searches: number;
  avgProviderCalls: number;
  totalProviderCalls: number;
};

export type TelemetryReport = {
  totalSearches: number;
  flagged: number;
  zeroResultCategories: CategoryStat[];
  slowestCategories: SlowStat[];
  highestCostCategories: CostStat[];
  eventFailures: CategoryStat[];
  noTopPickCategories: CategoryStat[];
  providerFailures: CategoryStat[];
  googleDiscarded: CategoryStat[];
  duplicates: number;
};

function topN<T extends { count?: number; searches?: number }>(items: T[], n: number, key: (item: T) => number): T[] {
  return [...items].sort((a, b) => key(b) - key(a)).slice(0, n);
}

function tally(records: TelemetryRecord[], predicate: (record: TelemetryRecord) => boolean): CategoryStat[] {
  const counts = new Map<string, number>();
  for (const record of records) {
    if (!predicate(record)) continue;
    const category = record.queryCategory || "unknown";
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return [...counts.entries()].map(([category, count]) => ({ category, count }));
}

export function summarizeTelemetry(records: TelemetryRecord[], limit = 8): TelemetryReport {
  const searches = records.filter((record) => record.event === "search_telemetry");

  const zeroResultCategories = topN(tally(searches, (r) => Boolean(r.killList?.zeroResult)), limit, (s) => s.count);
  const eventFailures = topN(tally(searches, (r) => Boolean(r.killList?.eventIntentNoResults)), limit, (s) => s.count);
  const noTopPickCategories = topN(tally(searches, (r) => Boolean(r.killList?.noTopPick)), limit, (s) => s.count);
  const providerFailures = topN(tally(searches, (r) => Boolean(r.killList?.providerFailure)), limit, (s) => s.count);
  const googleDiscarded = topN(tally(searches, (r) => Boolean(r.killList?.googleDiscarded)), limit, (s) => s.count);

  // Slowest categories: average + max duration, only over searches with a duration.
  const slowAgg = new Map<string, { total: number; count: number; max: number }>();
  for (const record of searches) {
    if (typeof record.durationMs !== "number") continue;
    const category = record.queryCategory || "unknown";
    const entry = slowAgg.get(category) ?? { total: 0, count: 0, max: 0 };
    entry.total += record.durationMs;
    entry.count += 1;
    entry.max = Math.max(entry.max, record.durationMs);
    slowAgg.set(category, entry);
  }
  const slowestCategories = topN(
    [...slowAgg.entries()].map(([category, entry]) => ({
      category,
      count: entry.count,
      avgMs: Math.round(entry.total / entry.count),
      maxMs: entry.max
    })),
    limit,
    (s) => s.avgMs
  );

  // Highest-cost provider patterns: average provider calls per category.
  const costAgg = new Map<string, { total: number; count: number }>();
  for (const record of searches) {
    if (typeof record.providerCallCount !== "number") continue;
    const category = record.queryCategory || "unknown";
    const entry = costAgg.get(category) ?? { total: 0, count: 0 };
    entry.total += record.providerCallCount;
    entry.count += 1;
    costAgg.set(category, entry);
  }
  const highestCostCategories = topN(
    [...costAgg.entries()].map(([category, entry]) => ({
      category,
      searches: entry.count,
      avgProviderCalls: Math.round((entry.total / entry.count) * 10) / 10,
      totalProviderCalls: entry.total
    })),
    limit,
    (s) => s.avgProviderCalls
  );

  const flagged = searches.filter((r) => (r.killList?.reasons?.length ?? 0) > 0).length;
  const duplicates = searches.filter((r) => Boolean(r.killList?.duplicate)).length;

  return {
    totalSearches: searches.length,
    flagged,
    zeroResultCategories,
    slowestCategories,
    highestCostCategories,
    eventFailures,
    noTopPickCategories,
    providerFailures,
    googleDiscarded,
    duplicates
  };
}

export function formatTelemetryReport(report: TelemetryReport): string {
  const lines: string[] = [];
  const section = (title: string) => {
    lines.push("");
    lines.push(title);
    lines.push("-".repeat(title.length));
  };
  const list = (rows: string[]) => {
    if (rows.length === 0) {
      lines.push("  (none)");
      return;
    }
    rows.forEach((row) => lines.push(`  ${row}`));
  };

  lines.push("Koi search kill-list — weekly summary");
  lines.push("=====================================");
  lines.push(`Total searches: ${report.totalSearches}`);
  lines.push(`Flagged (>=1 kill signal): ${report.flagged}`);
  lines.push(`Duplicate/repeated (served from cache): ${report.duplicates}`);

  section("Top zero-result categories");
  list(report.zeroResultCategories.map((s) => `${s.category}: ${s.count}`));

  section("Slowest query categories (avg / max ms)");
  list(report.slowestCategories.map((s) => `${s.category}: ${s.avgMs}ms avg, ${s.maxMs}ms max (${s.count} searches)`));

  section("Highest-cost provider patterns (avg provider calls)");
  list(
    report.highestCostCategories.map(
      (s) => `${s.category}: ${s.avgProviderCalls} avg, ${s.totalProviderCalls} total (${s.searches} searches)`
    )
  );

  section("Event intent fired but no events returned");
  list(report.eventFailures.map((s) => `${s.category}: ${s.count}`));

  section("Searches with no confident recommendation");
  list(report.noTopPickCategories.map((s) => `${s.category}: ${s.count}`));

  section("Provider failures (degraded)");
  list(report.providerFailures.map((s) => `${s.category}: ${s.count}`));

  section("Google called but results discarded");
  list(report.googleDiscarded.map((s) => `${s.category}: ${s.count}`));

  return lines.join("\n");
}
