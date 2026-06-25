import { isOpenTripMapFriendlyQuery } from "../lib/exploreQueryClassification";
import { normalizeExploreIntent, shouldUseOpenTripMapExplorePath, shouldUseTimeAwareExplorePath } from "../lib/exploreRouting";
import { shouldFetchTicketmasterEvents } from "../lib/localEventIntent";
import { shouldRouteFilterSearchToFreeform } from "../lib/searchIntent";
import { hasStreamingWatchContext } from "../lib/watchEvents";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

process.env.OPENTRIPMAP_API_KEY = "test-key";

const OTM_QUERIES: Array<{ query: string; category: string; subcategory?: string }> = [
  { query: "farmers markets near me", category: "outdoors", subcategory: "farmers_markets" },
  { query: "best scenic walk nearby", category: "outdoors", subcategory: "scenic_drives" },
  { query: "public art in Philadelphia", category: "activities", subcategory: "public_art" },
  { query: "historic places near Chestnut Hill", category: "outdoors", subcategory: "historic_sites" },
  { query: "gardens near me", category: "outdoors", subcategory: "gardens" },
  { query: "museums near Wyndmoor", category: "activities", subcategory: "museums" },
  { query: "landmarks nearby", category: "activities", subcategory: "landmarks" },
  { query: "scenic overlook nearby", category: "outdoors", subcategory: "overlooks" },
  { query: "botanical gardens", category: "outdoors", subcategory: "gardens" },
  { query: "family activities near me", category: "activities" },
  { query: "attractions near me", category: "activities" }
];

const PLACES_QUERIES: Array<{ query: string; venueCategory: string }> = [
  { query: "sushi near me", venueCategory: "sushi" },
  { query: "coffee near me", venueCategory: "coffee" },
  { query: "cocktail bar tonight", venueCategory: "cocktail_bars" },
  { query: "brunch near me", venueCategory: "brunch" }
];

const EVENT_QUERIES = ["concerts this weekend", "comedy shows tonight", "Phillies game"];

const TEMPORAL_EXPLORE_QUERIES = [
  "things to do this weekend",
  "fun this weekend",
  "events this weekend",
  "tonight",
  "outdoor activities this weekend",
  "farmers market near me this weekend"
];

const STREAMING_QUERIES = ["movie to stream tonight", "what should I watch on Netflix"];

for (const { query, category, subcategory } of OTM_QUERIES) {
  const intent = normalizeExploreIntent({ query, structured: false });
  assert(intent.category === category, `${query} -> category ${intent.category} (expected ${category})`);
  if (subcategory) {
    assert(intent.subcategoryId === subcategory, `${query} -> subcategory ${intent.subcategoryId} (expected ${subcategory})`);
  }
  assert(intent.preferOpenTripMap, `${query} prefers OpenTripMap primary`);
  assert(intent.providers[0] === "opentripmap", `${query} provider primary is OpenTripMap`);
  assert(shouldUseOpenTripMapExplorePath(intent), `${query} uses OTM explore path`);
  assert(isOpenTripMapFriendlyQuery(query), `${query} is OTM-friendly`);
  assert(!shouldFetchTicketmasterEvents(query), `${query} does not fetch Ticketmaster`);
  assert(shouldRouteFilterSearchToFreeform(query, {}), `${query} routes via freeform/koi-search`);
}

for (const { query, venueCategory } of PLACES_QUERIES) {
  const intent = normalizeExploreIntent({ query, structured: false });
  assert(intent.providers[0] === "google_places", `${query} -> places primary`);
  assert(intent.venueCategory === venueCategory, `${query} -> ${intent.venueCategory} (expected ${venueCategory})`);
  assert(!intent.preferOpenTripMap, `${query} does not prefer OpenTripMap`);
  assert(!isOpenTripMapFriendlyQuery(query), `${query} is not OTM-primary`);
}

for (const query of TEMPORAL_EXPLORE_QUERIES) {
  const intent = normalizeExploreIntent({ query, structured: false });
  assert(intent.timeAwareExplore, `${query} is time-aware explore`);
  assert(shouldUseTimeAwareExplorePath(intent), `${query} uses time-aware explore path`);
  assert(intent.providers[0] === "ticketmaster", `${query} checks event providers first`);
  assert(intent.providers.includes("opentripmap"), `${query} includes OpenTripMap before Places fallback`);
  assert(intent.providers.at(-1) === "google_places", `${query} keeps Places as final fallback`);
  assert(!shouldUseOpenTripMapExplorePath(intent), `${query} does not use Places-first OTM path`);
}

for (const query of EVENT_QUERIES) {
  const intent = normalizeExploreIntent({ query, structured: false });
  assert(intent.routeViaTicketmaster || intent.category === "events" || intent.category === "sports", `${query} is event/sports`);
  assert(shouldRouteFilterSearchToFreeform(query, {}), `${query} routes to Ticketmaster path`);
}

for (const query of STREAMING_QUERIES) {
  assert(hasStreamingWatchContext(query), `${query} stays on streaming path`);
  const intent = normalizeExploreIntent({ query, mode: "streaming", structured: false });
  assert(intent.category === null, `${query} does not enter Explore category`);
}

// Eventbrite absence must not block OTM routing for farmers markets.
delete process.env.Eventbrite_API_Key;
delete process.env.EVENTBRITE_API_KEY;
const farmersIntent = normalizeExploreIntent({ query: "farmers markets near me", structured: false });
assert(farmersIntent.preferOpenTripMap, "farmers markets still OTM-primary without Eventbrite");
assert(!farmersIntent.providers.includes("eventbrite"), "no Eventbrite provider without food_market sources");
assert(shouldUseOpenTripMapExplorePath(farmersIntent), "farmers markets still use OTM explore path");

console.log("PASS basic search routing");
