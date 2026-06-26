import { classifyExploreQuery } from "../lib/exploreQueryClassification";
import { normalizeExploreIntent } from "../lib/exploreRouting";
import { detectLocalHappeningsSubcategory } from "../lib/localHappenings";
import {
  filterLocalHappeningVenues,
  isLocalHappeningVenue,
  localHappeningsSubcategoryForVenueFilter
} from "../lib/localHappeningsVenueFilter";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

process.env.OPENTRIPMAP_API_KEY = "test-key";

assert(detectLocalHappeningsSubcategory("annual Italian festival near me") === "festivals", "annual Italian festival is a festival");
assert(detectLocalHappeningsSubcategory("punk rock flea market") === "flea_markets", "punk rock flea market is a flea market");
assert(detectLocalHappeningsSubcategory("street fairs this weekend") === "street_fairs", "street fairs are street fairs");
assert(classifyExploreQuery("street art in Philadelphia")?.subcategoryId === "public_art", "street art stays public art discovery");

const italianFestivalIntent = normalizeExploreIntent({ query: "annual Italian festival near me", structured: false });
assert(italianFestivalIntent.category === "events", "annual Italian festival is events");
assert(italianFestivalIntent.subcategoryId === "festivals", "annual Italian festival subcategory is festivals");
assert(!italianFestivalIntent.routeViaTicketmaster, "local festivals do not route Ticketmaster-only");

const fleaMarketIntent = normalizeExploreIntent({ query: "punk rock flea market", structured: false });
assert(fleaMarketIntent.category === "events", "punk rock flea market is event-like");
assert(!fleaMarketIntent.routeViaTicketmaster, "flea markets do not route Ticketmaster-only");

assert(
  isLocalHappeningVenue("festivals", { name: "Annual Italian Festival", category: "events", types: ["festival"] }),
  "recognizes annual festival venue"
);
assert(
  !isLocalHappeningVenue("festivals", { name: "Tony's Italian Restaurant", category: "restaurant", types: ["restaurant"] }),
  "rejects restaurant for festival query"
);
assert(
  isLocalHappeningVenue("flea_markets", { name: "Punk Rock Flea Market", category: "events", types: ["market"] }),
  "recognizes punk rock flea market"
);
assert(
  !isLocalHappeningVenue("flea_markets", { name: "ACME Markets", category: "shopping", types: ["grocery_store"] }),
  "rejects grocery store for flea market query"
);
assert(
  isLocalHappeningVenue("street_fairs", { name: "South Street Festival", category: "events", types: ["street_festival"] }),
  "recognizes street festival"
);
assert(
  isLocalHappeningVenue("art_walks", { name: "First Friday Art Walk", category: "events", types: ["art_gallery"] }),
  "recognizes art walk"
);

const filtered = filterLocalHappeningVenues("festivals", [
  { name: "Annual Italian Festival", category: "events", types: ["festival"] },
  { name: "Italian Market Grocery", category: "shopping", types: ["grocery_store"] },
  { name: "Tony's Italian Restaurant", category: "restaurant", types: ["restaurant"] }
]);
assert(filtered.length === 1 && filtered[0]?.name === "Annual Italian Festival", "festival filter removes generic businesses");

assert(localHappeningsSubcategoryForVenueFilter("punk rock flea market") === "flea_markets", "filter detects flea market query");

console.log("PASS local happenings venue filter");
