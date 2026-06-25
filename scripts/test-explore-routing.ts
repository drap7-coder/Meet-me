import { buildPlaceQuery, type BuilderState } from "../app/components/SearchPromptAssist";
import {
  EXPLORE_CATEGORIES,
  exploreCategoryConfig,
  inferExploreCategoryFromQuery,
  isExploreCategory
} from "../lib/exploreIntent";
import {
  normalizeExploreIntent,
  selectProvidersForExplore,
  validateExploreBuilderIsolation
} from "../lib/exploreRouting";
import { shouldRouteFilterSearchToFreeform } from "../lib/searchIntent";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

assert(EXPLORE_CATEGORIES.length === 6, "six explore categories");
assert(
  EXPLORE_CATEGORIES.every((item) => isExploreCategory(item.key)),
  "all explore category keys valid"
);
assert(
  !EXPLORE_CATEGORIES.some((item) => item.label.toLowerCase().includes("things to do")),
  "no Things to Do label"
);

process.env.OPENTRIPMAP_API_KEY = "test-key";

const yankeesState: BuilderState = {
  selectedMode: "explore",
  exploreCategory: "sports",
  typeId: "baseball",
  sportsTeamId: "yankees",
  musicArtistId: null,
  extras: new Set(),
  where: "near",
  streamingType: null,
  streamingVibe: null,
  genre: null,
  streamingServices: new Set(),
  eventWhen: null,
  eventDate: null
};

const yankeesQuery = buildPlaceQuery(yankeesState);
assert(yankeesQuery === "Yankees games", `yankees query: ${yankeesQuery}`);

const yankeesIntent = normalizeExploreIntent({
  query: yankeesQuery,
  mode: "explore",
  category: "sports",
  subcategoryId: "baseball",
  structured: true
});
assert(yankeesIntent.routeViaTicketmaster, "yankees routes to ticketmaster");
assert(
  shouldRouteFilterSearchToFreeform(yankeesQuery, {
    routeViaFreeform: true,
    exploreIntent: { mode: "explore", category: "sports", subcategoryId: "baseball" }
  }),
  "yankees chip uses freeform path"
);

const sportsBarIntent = normalizeExploreIntent({
  query: "Sports bars near me",
  mode: "explore",
  category: "sports",
  subcategoryId: "sports_bars",
  structured: true
});
assert(!sportsBarIntent.routeViaTicketmaster, "sports bars use places not ticketmaster");
assert(sportsBarIntent.providers[0] === "google_places", "sports bars primary google");

const concertsState: BuilderState = {
  ...yankeesState,
  exploreCategory: "events",
  typeId: "concerts",
  sportsTeamId: null
};
const concertsQuery = buildPlaceQuery(concertsState);
assert(concertsQuery === "Concerts near me", `concerts query: ${concertsQuery}`);

const hikingIntent = normalizeExploreIntent({
  query: "easy hike with a waterfall near me",
  structured: false
});
assert(hikingIntent.category === "outdoors", "hiking query infers outdoors");
assert(hikingIntent.subcategoryId === "hiking", "hiking query infers hiking subcategory");
assert(hikingIntent.preferOpenTripMap, "hiking prefers OpenTripMap");
assert(exploreCategoryConfig("outdoors").providers.includes("opentripmap"), "outdoors config includes OTM");

const thriftIntent = normalizeExploreIntent({
  query: "thrift stores nearby",
  structured: false
});
assert(thriftIntent.category === "activities", "thrift infers activities not shopping");

const farmersIntent = normalizeExploreIntent({
  query: "farmers market near me this weekend",
  structured: false
});
assert(farmersIntent.category === "outdoors", "farmers market infers outdoors");
assert(farmersIntent.subcategoryId === "farmers_markets", "farmers market infers subcategory");
assert(farmersIntent.venueCategory === "farmers_markets", "farmers market venue category");
assert(!farmersIntent.routeViaTicketmaster, "farmers market does not route to ticketmaster");
assert(farmersIntent.providers[0] === "opentripmap", "farmers market primary is OpenTripMap");
assert(farmersIntent.providers.includes("google_places"), "farmers market includes places fallback");
assert(!farmersIntent.providers.includes("eventbrite"), "eventbrite omitted without food_market sources");

const foodProviders = selectProvidersForExplore("food_drink", null);
assert(foodProviders[0] === "google_places" && foodProviders.length === 1, "food & drink is places primary");

const sportsProviders = selectProvidersForExplore("sports", "baseball");
assert(sportsProviders.includes("ticketmaster") && sportsProviders.includes("google_places"), "sports is ticketmaster + places");
assert(!sportsProviders.includes("opentripmap"), "sports does not default to OTM");

const outdoorsProviders = selectProvidersForExplore("outdoors", "hiking");
assert(outdoorsProviders[0] === "opentripmap", "outdoors primary is OpenTripMap");
assert(outdoorsProviders.includes("google_places"), "outdoors includes places fallback");

const activitiesProviders = selectProvidersForExplore("activities", null);
assert(activitiesProviders[0] === "opentripmap", "activities primary is OpenTripMap");
assert(activitiesProviders.includes("google_places"), "activities includes places fallback");

assert(
  validateExploreBuilderIsolation({
    selectedMode: "streaming",
    hasStreamingSelections: true,
    hasExploreCategory: false
  }),
  "streaming mode isolates explore"
);
assert(
  validateExploreBuilderIsolation({
    selectedMode: "explore",
    hasStreamingSelections: false,
    hasExploreCategory: true
  }),
  "explore mode isolates streaming"
);
assert(
  !validateExploreBuilderIsolation({
    selectedMode: "explore",
    hasStreamingSelections: true,
    hasExploreCategory: true
  }),
  "no duplicate streaming+explore chips"
);

console.log("PASS explore routing");
