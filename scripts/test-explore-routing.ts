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
assert(exploreCategoryConfig("outdoors").providers.includes("opentripmap"), "outdoors config includes OTM");

const thriftIntent = normalizeExploreIntent({
  query: "thrift stores nearby",
  structured: false
});
assert(thriftIntent.category === "activities", "thrift infers activities not shopping");

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
