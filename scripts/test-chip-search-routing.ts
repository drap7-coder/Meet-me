import { buildPlaceQuery, type BuilderState } from "../app/components/SearchPromptAssist";
import { shouldRouteFilterSearchToFreeform } from "../lib/searchIntent";
import { isTeamSpecificSportsQuery } from "../lib/localEventIntent";
import { resolveKoiBotMode } from "../lib/watchEvents";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

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
assert(resolveKoiBotMode(yankeesQuery) === "events", "yankees resolves to events");
assert(isTeamSpecificSportsQuery(yankeesQuery), "yankees is nationwide team search");
assert(
  shouldRouteFilterSearchToFreeform(yankeesQuery, { routeViaFreeform: true, category: "events" }),
  "sports chip sets routeViaFreeform"
);
assert(
  shouldRouteFilterSearchToFreeform(yankeesQuery, { category: "events" }),
  "yankees query routes to freeform via bot mode"
);
assert(
  !shouldRouteFilterSearchToFreeform("Restaurants near me", { category: "restaurant" }),
  "restaurant chip stays on places path"
);

const concertsState: BuilderState = {
  ...yankeesState,
  exploreCategory: "events",
  typeId: "concerts",
  sportsTeamId: null
};
const concertsQuery = buildPlaceQuery(concertsState);
assert(concertsQuery === "Concerts near me", `concerts query: ${concertsQuery}`);
assert(shouldRouteFilterSearchToFreeform(concertsQuery, { routeViaFreeform: true }), "events chip routes to freeform");

console.log("PASS chip search routing");
