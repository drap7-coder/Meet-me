import {
  detectStrictIntent,
  filterByStrictIntent,
  isVagueDiscoveryQuery,
  matchesStrictIntent,
  type SearchResult
} from "../lib/strictIntentFilters";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function venue(name: string, extra: Partial<SearchResult> = {}): SearchResult {
  return {
    name,
    category: extra.category ?? "activities",
    types: extra.types,
    description: extra.description,
    ...extra
  };
}

function assertRejected(query: string, result: SearchResult) {
  const intent = detectStrictIntent(query);
  assert(Boolean(intent), `${query} should detect strict intent`);
  assert(!matchesStrictIntent(result, intent!), `${query} should reject ${result.name}`);
}

function assertAccepted(query: string, result: SearchResult) {
  const intent = detectStrictIntent(query);
  assert(Boolean(intent), `${query} should detect strict intent`);
  assert(matchesStrictIntent(result, intent!), `${query} should accept ${result.name}`);
}

assertRejected(
  "mini golf near me",
  venue("Kids Empire Indoor Playground", { types: ["indoor playground", "amusement_center"] })
);
assertAccepted("mini golf near me", venue("Glow Putt Mini Golf", { types: ["mini_golf_course"] }));

assertRejected("pickleball near me", venue("Riverview Tennis Courts", { category: "sports", types: ["tennis_court"] }));
assertAccepted("pickleball near me", venue("Community Pickleball Courts", { types: ["pickleball_court"] }));

assertRejected("dog park near me", venue("Riverside Park", { category: "park", types: ["park"] }));
assertAccepted("dog park near me", venue("Spruce Street Dog Park", { types: ["dog_park"] }));

assertRejected("farmers market near me", venue("Fresh Grocer Supermarket", { types: ["grocery_store", "supermarket"] }));
assertAccepted("farmers market near me", venue("Rittenhouse Farmers Market", { types: ["market"] }));

assertRejected(
  "sports bar to watch Phillies",
  venue("The Velvet Room Cocktail Bar", { category: "cocktail_bars", types: ["bar"] })
);
assertAccepted("sports bar to watch Phillies", venue("Champions Sports Bar", { types: ["sports_bar", "bar"] }));

assertRejected("coffee near me", venue("Harbor House Restaurant", { category: "restaurant", types: ["restaurant"] }));
assertAccepted("coffee near me", venue("Daily Grind Coffee", { category: "coffee", types: ["cafe", "coffee_shop"] }));

assertRejected("EV charger near me", venue("Shell Gas Station", { types: ["gas_station"] }));
assertAccepted("EV charger near me", venue("ChargePoint DC Fast Charging Station", { types: ["electric_vehicle_charging_station"] }));

assertRejected("vegan dinner", venue("Tony's Italian Restaurant", { category: "restaurant", types: ["restaurant"] }));
assertAccepted("vegan dinner", venue("Green Garden Vegan Kitchen", { types: ["vegan_restaurant", "restaurant"] }));

assertRejected("gluten free pizza", venue("Mario's Pizza", { category: "restaurant", types: ["pizza_restaurant"] }));
assertAccepted("gluten free pizza", venue("Gluten Free Pizza Co", { types: ["pizza_restaurant"] }));

assert(!detectStrictIntent("fun things with kids"), "vague family discovery stays broad");
assert(!detectStrictIntent("date night near me"), "vague date night stays broad");
assert(isVagueDiscoveryQuery("fun things with kids"), "vague query helper");

const miniGolfFiltered = filterByStrictIntent("mini golf near me", [
  venue("Kids Empire Indoor Playground"),
  venue("Par-King Mini Golf")
]);
assert(miniGolfFiltered.length === 1 && miniGolfFiltered[0]?.name === "Par-King Mini Golf", "filterByStrictIntent keeps exact matches");

assert(detectStrictIntent("near me", "mini_golf") === "mini_golf", "chip subcategory activates strict intent");

console.log("PASS strict intent filters");
