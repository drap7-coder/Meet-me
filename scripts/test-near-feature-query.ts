import { effectiveTravelModeForQuery } from "../lib/evSearchIntent";
import {
  exploreIntentFromNearRelation,
  isGenericNearTarget,
  mergeProvidersForNearRelation,
  parseNearFeatureQuery,
  sanitizeLocationForNearRelation,
  shouldUseEvEnrichmentForNearRelation
} from "../lib/nearFeatureQuery";
import { filterAvailableProviders, normalizeExploreIntent } from "../lib/exploreRouting";

process.env.OPENTRIPMAP_API_KEY = "test-key";
process.env.NPS_API_KEY = "test-key";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function assertNear(query: string, expected: {
  primaryQuery: string;
  relatedFeature: string | null;
  locationQuery: string | null;
}) {
  const parsed = parseNearFeatureQuery(query);
  assert(Boolean(parsed), `${query} should parse as a near relationship`);
  assert(parsed!.primaryQuery.toLowerCase().includes(expected.primaryQuery.toLowerCase()), `${query} primary -> ${parsed!.primaryQuery}`);
  assert(parsed!.relatedFeature === expected.relatedFeature, `${query} feature -> ${parsed!.relatedFeature} (expected ${expected.relatedFeature})`);
  assert(parsed!.locationQuery === expected.locationQuery, `${query} location -> ${parsed!.locationQuery} (expected ${expected.locationQuery})`);
}

assertNear("coffee shop near a trail", {
  primaryQuery: "coffee shop",
  relatedFeature: "trail",
  locationQuery: null
});
assertNear("coffee near an EV charger", {
  primaryQuery: "coffee",
  relatedFeature: "ev_charger",
  locationQuery: null
});
assertNear("coffee near EV", {
  primaryQuery: "coffee",
  relatedFeature: "ev_charger",
  locationQuery: null
});
assertNear("coffee near an EV", {
  primaryQuery: "coffee",
  relatedFeature: "ev_charger",
  locationQuery: null
});
assertNear("restaurant near a park", {
  primaryQuery: "restaurant",
  relatedFeature: "park",
  locationQuery: null
});
assertNear("brewery near a bike trail", {
  primaryQuery: "brewery",
  relatedFeature: "trail",
  locationQuery: null
});
assertNear("cafe near Wissahickon trail", {
  primaryQuery: "cafe",
  relatedFeature: "trail",
  locationQuery: null
});

assertNear("coffee near Edison", {
  primaryQuery: "coffee",
  relatedFeature: null,
  locationQuery: "Edison"
});
assertNear("pizza near Wyndmoor", {
  primaryQuery: "pizza",
  relatedFeature: null,
  locationQuery: "Wyndmoor"
});

assert(isGenericNearTarget("trail") === true, "trail is generic");
assert(isGenericNearTarget("EV charger") === true, "EV charger is generic");
assert(isGenericNearTarget("Edison") === false, "Edison is not generic");
assert(
  sanitizeLocationForNearRelation("trail", "coffee shop near a trail") === "me",
  "sanitizer replaces geocoded trail with me"
);
assert(
  sanitizeLocationForNearRelation("Edison", "coffee near Edison") === "Edison",
  "sanitizer keeps real locations"
);

const trailNear = parseNearFeatureQuery("coffee near a trail");
const trailIntent = exploreIntentFromNearRelation(trailNear, "coffee near a trail");
assert(trailIntent?.providers.includes("opentripmap") === true, "trail relation triggers OpenTripMap providers");

const coffeeIntent = normalizeExploreIntent({ query: "coffee near Edison", structured: false });
const merged = filterAvailableProviders(mergeProvidersForNearRelation(coffeeIntent.providers, parseNearFeatureQuery("coffee near Edison")));
assert(merged.includes("google_places"), "location-near coffee keeps Places provider");

const trailMerged = filterAvailableProviders(
  mergeProvidersForNearRelation(coffeeIntent.providers, trailNear)
);
assert(trailMerged.includes("opentripmap"), "merged trail relation adds OpenTripMap");

const evMode = effectiveTravelModeForQuery(
  shouldUseEvEnrichmentForNearRelation(parseNearFeatureQuery("coffee near an EV charger")) ? "ev" : "auto",
  "coffee near an EV charger"
);
assert(evMode === "ev", "EV relation triggers EV enrichment mode");

assert(parseNearFeatureQuery("coffee near a trail") !== null, "vague near trail parses without crashing");

console.log("PASS near feature query");
