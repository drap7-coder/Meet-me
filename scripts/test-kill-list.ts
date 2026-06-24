import {
  deriveKillSignals,
  formatTelemetryReport,
  summarizeTelemetry,
  type KillSignalInput,
  type TelemetryRecord
} from "@/lib/searchKillList";

let failed = 0;
function check(name: string, ok: boolean, detail?: string) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : detail ? `  -> ${detail}` : ""}`);
  if (!ok) failed += 1;
}

function input(overrides: Partial<KillSignalInput> = {}): KillSignalInput {
  return {
    durationMs: 500,
    status: 200,
    ok: true,
    resultCount: 5,
    searchKind: "freeform",
    resolvedKind: "places",
    providerCalls: [{ provider: "google", operation: "places_text_search" }],
    providerErrors: [],
    discardedProviders: [],
    cache: null,
    topPickPresent: true,
    eventsReturned: null,
    ...overrides
  };
}

// --- Healthy search: no flags ---
const healthy = deriveKillSignals(input());
check("healthy search has no kill reasons", healthy.reasons.length === 0, healthy.reasons.join(","));

// --- Zero result ---
const zero = deriveKillSignals(input({ resultCount: 0 }));
check("zero result flagged", zero.zeroResult && zero.reasons.includes("zero_result"));

// --- Slow ---
const slow = deriveKillSignals(input({ durationMs: 4000 }));
check("slow search flagged", slow.slow && slow.reasons.includes("slow"));

// --- Provider failure (graceful) ---
const degraded = deriveKillSignals(input({ providerErrors: [{ provider: "ticketmaster", operation: "search_events" }] }));
check("provider error flagged", degraded.providerFailure);

// --- Provider failure (5xx) ---
const server5xx = deriveKillSignals(input({ ok: false, status: 500, resultCount: null }));
check("5xx flagged as provider failure", server5xx.providerFailure);

// --- No top pick ---
const noPick = deriveKillSignals(input({ topPickPresent: false }));
check("no top pick flagged", noPick.noTopPick && noPick.reasons.includes("no_top_pick"));
check("unknown top pick not flagged", deriveKillSignals(input({ topPickPresent: null })).noTopPick === false);

// --- Event intent, no events returned ---
const eventFail = deriveKillSignals(input({ resolvedKind: "events", eventsReturned: 0, resultCount: 0 }));
check("event intent w/ no events flagged", eventFail.eventIntentNoResults);
const eventOk = deriveKillSignals(input({ resolvedKind: "events", eventsReturned: 3, resultCount: 3 }));
check("event intent w/ events not flagged", eventOk.eventIntentNoResults === false);

// --- Google discarded (explicit) ---
const discarded = deriveKillSignals(input({ discardedProviders: ["google"] }));
check("explicit google discard flagged", discarded.googleDiscarded);
// --- Google discarded (heuristic: google called, events returned, no venues) ---
const wasteful = deriveKillSignals(
  input({ resolvedKind: "events", eventsReturned: 4, resultCount: 0, providerCalls: [{ provider: "google", operation: "routes" }] })
);
check("google wasted on event shell flagged", wasteful.googleDiscarded);

// --- Duplicate via response-cache hit ---
const dup = deriveKillSignals(input({ cache: { koi_response: { hits: 1, misses: 0 } } }));
check("response-cache hit flagged as duplicate", dup.duplicate);

// --- High cost ---
const expensive = deriveKillSignals(
  input({
    providerCalls: [
      { provider: "google", operation: "geocode" },
      { provider: "google", operation: "places_text_search" },
      { provider: "google", operation: "routes" },
      { provider: "ticketmaster", operation: "search_events" }
    ]
  })
);
check("high provider-call count flagged", expensive.highCost);

// --- Report aggregation ---
function record(overrides: Partial<TelemetryRecord> = {}): TelemetryRecord {
  return {
    event: "search_telemetry",
    queryCategory: "restaurant",
    durationMs: 800,
    providerCallCount: 2,
    resultCount: 3,
    status: 200,
    ok: true,
    killList: {},
    ...overrides
  };
}

const records: TelemetryRecord[] = [
  record({ queryCategory: "events_intent", durationMs: 3200, providerCallCount: 1, killList: { zeroResult: true, eventIntentNoResults: true, reasons: ["zero_result", "event_intent_no_results"] } }),
  record({ queryCategory: "events_intent", durationMs: 4100, providerCallCount: 1, killList: { eventIntentNoResults: true, reasons: ["event_intent_no_results"] } }),
  record({ queryCategory: "restaurant", durationMs: 600, providerCallCount: 5, killList: { highCost: true, googleDiscarded: true, reasons: ["high_cost", "google_discarded"] } }),
  record({ queryCategory: "places_intent", durationMs: 900, providerCallCount: 3, killList: { noTopPick: true, reasons: ["no_top_pick"] } }),
  record({ queryCategory: "restaurant", durationMs: 700, providerCallCount: 2, killList: { duplicate: true, reasons: ["duplicate"] } }),
  { event: "other_log", queryCategory: "should_ignore" } as TelemetryRecord
];

const report = summarizeTelemetry(records);
check("report ignores non-telemetry lines", report.totalSearches === 5, String(report.totalSearches));
check("report counts flagged", report.flagged === 5, String(report.flagged));
check("report top zero-result category", report.zeroResultCategories[0]?.category === "events_intent");
check("report event failures aggregated", report.eventFailures[0]?.count === 2, JSON.stringify(report.eventFailures));
check("report slowest is events_intent", report.slowestCategories[0]?.category === "events_intent");
check("report highest cost is restaurant", report.highestCostCategories[0]?.category === "restaurant");
check("report duplicates counted", report.duplicates === 1, String(report.duplicates));
check("formatted report is non-empty string", formatTelemetryReport(report).includes("kill-list"));

console.log(failed === 0 ? "\nAll kill-list tests passed." : `\n${failed} test(s) failed.`);
if (failed > 0) process.exit(1);
