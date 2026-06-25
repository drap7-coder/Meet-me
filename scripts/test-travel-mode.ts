import { scoreVenue } from "@/lib/scoring";
import {
  DEFAULT_TRAVEL_MODE,
  getSavedTravelMode,
  isTravelMode,
  travelModeChipLabel
} from "@/lib/travelMode";
import {
  applyExploreTravelModeRanking,
  getExploreModeDistanceAdjustment,
  getExploreModeBoosts,
  getExploreModeQueryHints,
  getExploreModeRadiusMultiplier,
  shouldFavorNearby,
  shouldFavorOpenChargeMap,
  shouldFavorOutdoorDiscovery
} from "@/lib/exploreModeRanking";
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

// --- helper contract ---
assert(getExploreModeQueryHints("auto").length === 0, "auto has no query hints");
assert(getExploreModeQueryHints("walk").includes("walkable"), "walk has walkable hint");
assert(getExploreModeQueryHints("bike").includes("rail trail"), "bike has rail-trail hint");
assert(getExploreModeBoosts("walk").terms.includes("public art"), "walk boosts public art");
assert(getExploreModeBoosts("bike").terms.includes("greenway"), "bike boosts greenways");
assert(shouldFavorNearby("walk") && shouldFavorNearby("bike") && shouldFavorNearby("transit"), "nearby-favoring modes");
assert(!shouldFavorNearby("drive"), "drive does not force nearby ranking");
assert(shouldFavorOpenChargeMap("ev") && !shouldFavorOpenChargeMap("drive"), "EV favors Open Charge Map");
assert(shouldFavorOutdoorDiscovery("walk") && shouldFavorOutdoorDiscovery("bike"), "walk/bike favor outdoor discovery");
assert(getExploreModeRadiusMultiplier("auto") === 1, "auto radius unchanged");
assert(getExploreModeRadiusMultiplier("drive") > 1, "drive broadens radius");
assert(getExploreModeRadiusMultiplier("walk") < 1, "walk narrows radius");

// --- base venue scoring is travel-mode neutral; mode ranking happens in exploreModeRanking ---
const near = candidate(800);
const baseScore = scoreVenue(near, []).fairnessScore;
assert(scoreVenue(near, []).fairnessScore === baseScore, "base score is stable");

// --- walk: near is boosted, far is penalized; closer ranks higher ---
const walkNear = baseScore + getExploreModeDistanceAdjustment(candidate(600), "walk");
const walkFar = baseScore + getExploreModeDistanceAdjustment(candidate(4000), "walk");
assert(walkNear > baseScore, "walk ranking boosts very close results");
assert(walkFar < baseScore, "walk ranking penalizes long distances");
assert(walkNear > walkFar, "walk prefers closer results");

// --- bike: more lenient than walk for mid distances ---
const bikeMid = getExploreModeDistanceAdjustment(candidate(4000), "bike");
const walkMid = getExploreModeDistanceAdjustment(candidate(4000), "walk");
assert(bikeMid > walkMid, "bike is more lenient than walk at 4km");
assert(getExploreModeDistanceAdjustment(candidate(3000), "bike") > 0, "short bike ride gets a small boost");
assert(getExploreModeDistanceAdjustment(candidate(50_000), "drive") === 0, "drive never adjusts");

// --- transit: graceful fallback, modestly favors dense nearby hubs without hard filtering ---
const transitNear = baseScore + getExploreModeDistanceAdjustment(candidate(1500), "transit");
const transitFar = baseScore + getExploreModeDistanceAdjustment(candidate(20_000), "transit");
assert(transitNear > transitFar, "transit falls back to nearby dense-area ranking");
assert(transitFar < baseScore, "transit can softly reduce far drive-first results");

// --- missing distance data => neutral (no penalty) for walk/bike ---
assert(getExploreModeDistanceAdjustment(candidate(null), "walk") === 0, "walk neutral without distance data");
assert(getExploreModeDistanceAdjustment(candidate(null), "bike") === 0, "bike neutral without distance data");

// --- applyExploreTravelModeRanking: content boosts without changing Auto ---
const cafe = scoreVenue({ ...candidate(1800), id: "cafe", name: "Main Street Cafe", category: "coffee" }, []);
const distantRestaurant = scoreVenue({ ...candidate(1800), id: "dinner", name: "Drive-Up Dinner", category: "restaurant" }, []);
const autoOrder = applyExploreTravelModeRanking([distantRestaurant, cafe], "auto", { query: "things to do" });
assert(autoOrder[0]?.id === "dinner", "auto preserves current order");
const walkOrder = applyExploreTravelModeRanking([distantRestaurant, cafe], "walk", { query: "things to do" });
assert(walkOrder[0]?.id === "cafe", "walk boosts walkable cafe style results");

const railTrail = scoreVenue({ ...candidate(5000), id: "trail", name: "Greenway Rail Trail", category: "trails" }, []);
const plainPark = scoreVenue({ ...candidate(5000), id: "park", name: "Plain Park", category: "park" }, []);
const bikeOrder = applyExploreTravelModeRanking([plainPark, railTrail], "bike", { query: "bike ride" });
assert(bikeOrder[0]?.id === "trail", "bike boosts rail trails and greenways");

const chargerEnriched = { ...distantRestaurant, id: "ev", evCharging: { nearbyCount: 2, nearestDistanceMeters: 200, fastChargingAvailable: true } };
const evOrder = applyExploreTravelModeRanking([cafe, chargerEnriched], "ev", { query: "dinner with EV charging nearby" });
assert(evOrder[0]?.id === "ev", "EV ranks enriched normal destinations higher");

// --- EV enrichment extension point: default is passthrough; only runs for ev ---
async function run() {
  const venues = [scoreVenue(candidate(1000), [])] as ScoredVenue[];

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
