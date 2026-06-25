import { computeTravelModeAdjustment, scoreVenue } from "@/lib/scoring";
import {
  DEFAULT_TRAVEL_MODE,
  getSavedTravelMode,
  isTravelMode,
  travelModeChipLabel,
  travelRankingStrategy
} from "@/lib/travelMode";
import {
  applyEvEnrichment,
  defaultEvEnrichmentProvider,
  getEvEnrichmentProvider,
  resetEvEnrichmentProvider,
  setEvEnrichmentProvider
} from "@/lib/providers/evEnrichment";
import { hasOpenChargeMapApiKey } from "@/lib/providers/openChargeMap";
import { openChargeMapEnrichmentProvider } from "@/lib/providers/openChargeMapEnrichment";
import type { RouteLeg, ScoredVenue, TravelMode, VenueCandidate } from "@/lib/types";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function leg(distanceMeters: number | null, durationMinutes: number | null): RouteLeg {
  return { distanceMeters, durationMinutes, status: "OK" };
}

function candidate(distanceMeters: number | null, durationMinutes = 10): VenueCandidate & {
  travelFromA: RouteLeg;
  travelFromB: RouteLeg;
} {
  const trip = leg(distanceMeters, durationMinutes);
  return {
    id: "v1",
    name: "Test Spot",
    category: "restaurant",
    address: "123 Main St",
    location: { lat: 40, lng: -75 },
    rating: 4.5,
    reviewCount: 200,
    openNow: true,
    googleMapsUri: "https://maps.google.com",
    travelFromA: trip,
    travelFromB: trip
  };
}

// --- type guard + helpers ---
assert(DEFAULT_TRAVEL_MODE === "auto", "default travel mode is auto");
assert(isTravelMode("ev") && isTravelMode("walk") && !isTravelMode("teleport"), "isTravelMode validates ids");
assert(travelModeChipLabel("drive") === "🚗 Drive", "drive chip label");
assert(travelModeChipLabel("ev") === "⚡ EV Charging", "ev chip label");

// --- strategy mapping: auto/drive/ev/transit -> drive; walk/bike distinct ---
const driveLike: TravelMode[] = ["auto", "drive", "ev", "transit"];
assert(driveLike.every((mode) => travelRankingStrategy(mode) === "drive"), "auto/drive/ev/transit map to drive");
assert(travelRankingStrategy("walk") === "walk", "walk strategy");
assert(travelRankingStrategy("bike") === "bike", "bike strategy");

// --- drive/ev/auto/transit leave fairnessScore unchanged ---
const near = candidate(800);
const baseScore = scoreVenue(near, [], "auto").fairnessScore;
for (const mode of driveLike) {
  assert(scoreVenue(near, [], mode).fairnessScore === baseScore, `${mode} ranking unchanged vs base`);
}
// EV explicitly equals drive for now.
assert(scoreVenue(near, [], "ev").fairnessScore === scoreVenue(near, [], "drive").fairnessScore, "ev == drive");

// --- walk: near is boosted, far is penalized; closer ranks higher ---
const walkNear = scoreVenue(candidate(600), [], "walk").fairnessScore;
const walkFar = scoreVenue(candidate(4000), [], "walk").fairnessScore;
assert(walkNear > baseScore, "walk boosts very close results");
assert(walkFar < baseScore, "walk penalizes long distances");
assert(walkNear > walkFar, "walk prefers closer results");

// --- bike: more lenient than walk for mid distances ---
const bikeMid = computeTravelModeAdjustment("bike", candidate(4000));
const walkMid = computeTravelModeAdjustment("walk", candidate(4000));
assert(bikeMid > walkMid, "bike is more lenient than walk at 4km");
assert(computeTravelModeAdjustment("bike", candidate(3000)) > 0, "short bike ride gets a small boost");
assert(computeTravelModeAdjustment("drive", candidate(50_000)) === 0, "drive never adjusts");

// --- missing distance data => neutral (no penalty) for walk/bike ---
assert(computeTravelModeAdjustment("walk", candidate(null)) === 0, "walk neutral without distance data");
assert(computeTravelModeAdjustment("bike", candidate(null)) === 0, "bike neutral without distance data");

// --- EV enrichment extension point: default is passthrough; only runs for ev ---
async function run() {
  const venues = [scoreVenue(candidate(1000), [], "ev")] as ScoredVenue[];

  assert(getEvEnrichmentProvider().id === "noop", "default provider is noop");

  const unchangedDrive = await applyEvEnrichment(venues, {
    travelMode: "drive",
    origin: { lat: 40, lng: -75 },
    query: "coffee",
    category: "coffee"
  });
  assert(unchangedDrive === venues, "non-ev mode skips enrichment entirely");

  const unchangedEv = await applyEvEnrichment(venues, {
    travelMode: "ev",
    origin: { lat: 40, lng: -75 },
    query: "coffee",
    category: "coffee"
  });
  assert(unchangedEv.length === venues.length, "default ev enrichment returns same results");

  // A future provider can be registered without UI/flow changes.
  let called = false;
  setEvEnrichmentProvider({
    id: "test",
    async enrich(input) {
      called = true;
      return input;
    }
  });
  await applyEvEnrichment(venues, {
    travelMode: "ev",
    origin: null,
    query: "coffee",
    category: "coffee"
  });
  assert(called, "registered ev provider is invoked in ev mode");
  resetEvEnrichmentProvider();
  assert(getEvEnrichmentProvider() === defaultEvEnrichmentProvider, "reset restores default provider");

  // Open Charge Map provider self-gates on OPENCHARGEMAP_API_KEY. Without the key
  // (as in tests/dev), it must pass results through untouched and never call OCM.
  assert(openChargeMapEnrichmentProvider.id === "open-charge-map", "ocm provider id");
  assert(!hasOpenChargeMapApiKey(), "no OCM key configured in test env");
  const ocmPassthrough = await openChargeMapEnrichmentProvider.enrich(venues, {
    travelMode: "ev",
    origin: { lat: 40, lng: -75 },
    query: "coffee",
    category: "coffee"
  });
  assert(ocmPassthrough === venues, "ocm provider is a no-op without an API key");

  // getSavedTravelMode is SSR-safe (no window) and returns the default.
  assert(getSavedTravelMode() === DEFAULT_TRAVEL_MODE, "getSavedTravelMode defaults without window");

  console.log("PASS travel mode ranking, persistence, and EV enrichment");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
