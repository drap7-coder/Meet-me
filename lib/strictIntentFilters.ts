export type StrictIntentKey =
  | "mini_golf"
  | "pickleball"
  | "dog_park"
  | "farmers_market"
  | "sports_bar"
  | "coffee_shop"
  | "ice_cream"
  | "arcade"
  | "bowling"
  | "hiking_trail"
  | "ev_charger"
  | "vegan"
  | "gluten_free";

export type SearchResult = {
  name?: string;
  title?: string;
  description?: string;
  category?: string;
  primaryCategory?: string;
  categories?: string[];
  types?: string[];
  tags?: string[];
};

export const STRICT_INTENT_NO_RESULTS_MESSAGE =
  "No exact matches found for that. Try a nearby area or a slightly broader ask.";

const VAGUE_DISCOVERY_QUERY =
  /\b(?:things to do|fun things|something to do|what should we|where should we|date night|something outdoors|weekend ideas|tonight ideas|what(?:'s| is) happening|family fun|for kids|with kids|where should we go tonight)\b/i;

const STRICT_INTENT_ORDER: StrictIntentKey[] = [
  "gluten_free",
  "vegan",
  "ev_charger",
  "mini_golf",
  "pickleball",
  "dog_park",
  "farmers_market",
  "sports_bar",
  "ice_cream",
  "bowling",
  "arcade",
  "hiking_trail",
  "coffee_shop"
];

const STRICT_INTENT_PATTERNS: Record<StrictIntentKey, RegExp[]> = {
  mini_golf: [/mini[-\s]?golf/i, /miniature golf/i, /putt[-\s]?putt/i],
  pickleball: [/pickleball/i],
  dog_park: [/dog park/i, /off[-\s]?leash/i],
  farmers_market: [/farmers?\s+market/i, /farmer'?s\s+market/i],
  sports_bar: [/sports bar/i, /watch.*game/i, /bar.*game/i],
  coffee_shop: [/coffee shop/i, /\bcoffee\b/i, /\bcafe\b/i, /café/i],
  ice_cream: [/ice cream/i, /gelato/i, /soft serve/i],
  arcade: [/arcade/i, /game room/i],
  bowling: [/bowling/i, /bowling alley/i],
  hiking_trail: [/\bhiking\b/i, /\btrail(?:head|s)?\b/i, /\bgreenway/i, /\brail trail/i],
  ev_charger: [/ev charger/i, /charging station/i, /charge my car/i, /\bev\b.*charg/i, /charg.*\bev\b/i],
  vegan: [/\bvegan\b/i, /plant[-\s]?based/i],
  gluten_free: [/gluten[-\s]?free/i, /\bgf\b/i]
};

const SUBCATEGORY_TO_STRICT: Record<string, StrictIntentKey> = {
  mini_golf: "mini_golf",
  pickleball: "pickleball",
  dog_parks: "dog_park",
  farmers_markets: "farmers_market",
  sports_bars: "sports_bar",
  coffee: "coffee_shop",
  bowling: "bowling",
  arcades: "arcade",
  hiking: "hiking_trail",
  trails: "hiking_trail"
};

const POSITIVE_SIGNALS: Record<StrictIntentKey, string[]> = {
  mini_golf: ["mini golf", "mini-golf", "miniature golf", "putt putt", "putt-putt", "putting course"],
  pickleball: ["pickleball"],
  dog_park: ["dog park", "off-leash", "off leash", "dog run"],
  farmers_market: ["farmers market", "farmer's market", "farm market", "produce market"],
  sports_bar: ["sports bar", "watch the game", "game day", "tv screens", "nfl", "nba", "mlb", "nhl"],
  coffee_shop: ["coffee", "espresso", "cafe", "café", "coffee shop"],
  ice_cream: ["ice cream", "gelato", "soft serve", "frozen custard"],
  arcade: ["arcade", "game room", "video games", "pinball"],
  bowling: ["bowling", "bowling alley", "lanes"],
  hiking_trail: ["hiking", "trail", "trailhead", "walking trail", "greenway", "rail trail"],
  ev_charger: [
    "ev charger",
    "charging station",
    "electric vehicle charging",
    "dc fast charger",
    "level 2 charger",
    "supercharger"
  ],
  vegan: ["vegan", "plant-based", "plant based"],
  gluten_free: ["gluten free", "gluten-free", "gf menu"]
};

const NEGATIVE_SIGNALS: Record<StrictIntentKey, string[]> = {
  mini_golf: ["indoor playground", "kids gym", "trampoline", "daycare", "kids empire", "play place", "playplace"],
  pickleball: ["tennis only", "tennis court"],
  dog_park: ["playground"],
  farmers_market: ["grocery store", "supermarket", "grocery", "supermarket"],
  sports_bar: ["cocktail bar", "wine bar", "brewery only"],
  coffee_shop: ["restaurant", "diner", "bar"],
  ice_cream: ["bakery"],
  arcade: ["trampoline", "indoor playground"],
  bowling: ["arcade only", "family entertainment center", "family entertainment"],
  hiking_trail: ["playground", "sports field"],
  ev_charger: ["gas station", "auto repair"],
  vegan: ["vegetarian friendly"],
  gluten_free: ["gluten friendly"]
};

export function resultText(result: SearchResult): string {
  return [
    result.name,
    result.title,
    result.description,
    result.category,
    result.primaryCategory,
    ...(result.categories ?? []),
    ...(result.types ?? []),
    ...(result.tags ?? [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function nameText(result: SearchResult): string {
  return `${result.name ?? ""} ${result.title ?? ""}`.toLowerCase();
}

function includesSignal(text: string, signal: string): boolean {
  const normalized = signal.toLowerCase();
  if (normalized.includes(" ")) return text.includes(normalized);
  const pattern = new RegExp(`\\b${normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  return pattern.test(text);
}

function matchedSignals(text: string, signals: string[]): string[] {
  return signals.filter((signal) => includesSignal(text, signal));
}

function hasStrongPositive(result: SearchResult, intent: StrictIntentKey): boolean {
  const text = nameText(result);
  return POSITIVE_SIGNALS[intent].some((signal) => includesSignal(text, signal));
}

export function detectStrictIntent(query: string, subcategoryId?: string | null): StrictIntentKey | null {
  const value = query.trim();
  if (!value && !subcategoryId) return null;

  if (subcategoryId && SUBCATEGORY_TO_STRICT[subcategoryId]) {
    return SUBCATEGORY_TO_STRICT[subcategoryId];
  }

  for (const intent of STRICT_INTENT_ORDER) {
    if (STRICT_INTENT_PATTERNS[intent].some((pattern) => pattern.test(value))) {
      return intent;
    }
  }

  return null;
}

export function matchesStrictIntent(result: SearchResult, intent: StrictIntentKey): boolean {
  const text = resultText(result);
  const positives = matchedSignals(text, POSITIVE_SIGNALS[intent]);
  if (positives.length === 0) return false;

  const negatives = matchedSignals(text, NEGATIVE_SIGNALS[intent]);
  if (negatives.length === 0) return true;
  if (hasStrongPositive(result, intent)) return true;

  switch (intent) {
    case "pickleball":
      return includesSignal(text, "pickleball");
    case "dog_park":
      return (
        includesSignal(text, "dog park") ||
        includesSignal(text, "off-leash") ||
        includesSignal(text, "off leash") ||
        includesSignal(text, "dog run")
      );
    case "farmers_market":
      return positives.some((signal) =>
        ["farmers market", "farmer's market", "farm market", "produce market"].includes(signal)
      );
    case "coffee_shop":
      return positives.some((signal) => ["coffee", "espresso", "cafe", "café", "coffee shop"].includes(signal));
    case "hiking_trail":
      return (
        includesSignal(text, "hiking") ||
        includesSignal(text, "trailhead") ||
        includesSignal(text, "walking trail") ||
        includesSignal(text, "greenway") ||
        (includesSignal(text, "trail") && !includesSignal(text, "playground"))
      );
    case "ev_charger":
      return positives.some((signal) =>
        ["ev charger", "charging station", "electric vehicle charging", "dc fast charger", "level 2 charger", "supercharger"].includes(
          signal
        )
      );
    case "sports_bar":
      return (
        includesSignal(text, "sports bar") ||
        includesSignal(text, "watch the game") ||
        includesSignal(text, "game day") ||
        ["nfl", "nba", "mlb", "nhl"].some((league) => includesSignal(text, league))
      );
    case "vegan":
      return includesSignal(text, "vegan") || includesSignal(text, "plant-based") || includesSignal(text, "plant based");
    case "gluten_free":
      return includesSignal(text, "gluten free") || includesSignal(text, "gluten-free") || includesSignal(text, "gf menu");
    default:
      return false;
  }
}

export function filterByStrictIntent<T extends SearchResult>(query: string, results: T[], subcategoryId?: string | null): T[] {
  const intent = detectStrictIntent(query, subcategoryId);
  if (!intent) return results;
  return results.filter((result) => matchesStrictIntent(result, intent));
}

export function applyStrictIntentFilter<T extends SearchResult>(
  query: string,
  results: T[],
  subcategoryId?: string | null
): { results: T[]; strictIntent: StrictIntentKey | null } {
  const strictIntent = detectStrictIntent(query, subcategoryId);
  if (!strictIntent) return { results, strictIntent: null };
  return {
    results: results.filter((result) => matchesStrictIntent(result, strictIntent)),
    strictIntent
  };
}

export function venueToSearchResult(venue: {
  name: string;
  category: string;
  address?: string;
  types?: string[];
}): SearchResult {
  return {
    name: venue.name,
    category: venue.category,
    primaryCategory: venue.category,
    description: venue.address,
    categories: venue.types,
    types: venue.types,
    tags: venue.types
  };
}

export function postProcessVenues<T extends { name: string; category: string; address?: string; types?: string[] }>(
  query: string,
  venues: T[],
  subcategoryId?: string | null
): { venues: T[]; strictIntent: StrictIntentKey | null } {
  const strictIntent = detectStrictIntent(query, subcategoryId);
  if (!strictIntent) return { venues, strictIntent: null };
  return {
    venues: venues.filter((venue) => matchesStrictIntent(venueToSearchResult(venue), strictIntent)),
    strictIntent
  };
}

export function finalizeSearchVenues<T extends { name: string; category: string; address?: string; types?: string[] }>(
  query: string,
  venues: T[],
  subcategoryId?: string | null
): { venues: T[]; strictIntentApplied?: StrictIntentKey } {
  const { venues: filteredVenues, strictIntent } = postProcessVenues(query, venues, subcategoryId);
  return {
    venues: filteredVenues,
    ...(strictIntent ? { strictIntentApplied: strictIntent } : {})
  };
}

export function isVagueDiscoveryQuery(query: string): boolean {
  return VAGUE_DISCOVERY_QUERY.test(query.trim());
}
