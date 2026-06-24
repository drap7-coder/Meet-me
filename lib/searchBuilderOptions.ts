import { EVENT_TYPE_REFINEMENTS, SPORT_TYPE_REFINEMENTS } from "@/lib/eventBuilderOptions";
import type { VenueCategory } from "@/lib/types";

export type SearchBuilderMode = "near_me" | "halfway" | "destination";
export type RadiusOption = "10 min" | "20 min" | "30 min" | "Flexible";
export type ResultMode = "best" | "more";

export type LocalChipCategoryId =
  | "food"
  | "drinks"
  | "coffee"
  | "activities"
  | "events"
  | "sports"
  | "thrift_vintage"
  | "shopping";

/** @deprecated Use LocalChipCategoryId */
export type BuilderCategoryGroup = LocalChipCategoryId;

export type LocalChipCategory = {
  id: LocalChipCategoryId;
  label: string;
  noun: string;
  defaultVenueCategory: VenueCategory;
  subtypeLabel: string;
};

export type BuilderRefinement = {
  id: string;
  label: string;
  group: "type" | "extra";
  prefix?: string;
  noun?: string;
  suffix?: string;
  category?: VenueCategory;
};

export const LOCAL_CHIP_CATEGORIES: LocalChipCategory[] = [
  {
    id: "food",
    label: "🍔 Food",
    noun: "restaurants",
    defaultVenueCategory: "restaurant",
    subtypeLabel: "🍽️ Cuisine"
  },
  {
    id: "drinks",
    label: "🍺 Drinks",
    noun: "cocktail bars",
    defaultVenueCategory: "cocktail_bars",
    subtypeLabel: "🍸 Type"
  },
  {
    id: "coffee",
    label: "☕ Coffee",
    noun: "coffee shops",
    defaultVenueCategory: "coffee",
    subtypeLabel: "☕ Style"
  },
  {
    id: "activities",
    label: "🎯 Activities",
    noun: "things to do",
    defaultVenueCategory: "activities",
    subtypeLabel: "🎯 Type"
  },
  {
    id: "events",
    label: "🎟️ Events",
    noun: "events and live shows",
    defaultVenueCategory: "events",
    subtypeLabel: "🎟️ Type"
  },
  {
    id: "sports",
    label: "🏟️ Sports",
    noun: "live sports",
    defaultVenueCategory: "events",
    subtypeLabel: "🏆 Sport"
  },
  {
    id: "thrift_vintage",
    label: "♻️ Thrift & Vintage",
    noun: "thrift and vintage shops",
    defaultVenueCategory: "thrifting",
    subtypeLabel: "♻️ Type"
  },
  {
    id: "shopping",
    label: "🛍️ Shopping",
    noun: "shopping",
    defaultVenueCategory: "shopping",
    subtypeLabel: "🛍️ Type"
  }
];

const FOOD_CUISINES: BuilderRefinement[] = [
  { id: "italian", label: "🍝 Italian", group: "type", prefix: "Italian", category: "italian" },
  { id: "sushi", label: "🍣 Sushi", group: "type", noun: "sushi restaurants", category: "sushi" },
  { id: "steakhouse", label: "🥩 Steakhouse", group: "type", noun: "steakhouses", category: "steakhouse" },
  { id: "mexican", label: "🌮 Mexican", group: "type", prefix: "Mexican", category: "mexican" },
  { id: "pizza", label: "🍕 Pizza", group: "type", noun: "pizza places", category: "pizza" },
  { id: "bbq", label: "🍖 BBQ", group: "type", noun: "BBQ restaurants", category: "bbq" },
  { id: "chinese", label: "🥡 Chinese", group: "type", prefix: "Chinese", category: "asian" }
];

const DRINKS_CUISINES: BuilderRefinement[] = [
  { id: "cocktails", label: "🍸 Cocktails", group: "type", noun: "cocktail bars", category: "cocktail_bars" },
  { id: "wine", label: "🍷 Wine Bars", group: "type", noun: "wine bars", category: "wine_bars" },
  { id: "breweries", label: "🍻 Breweries", group: "type", noun: "breweries", category: "breweries" },
  { id: "rooftop", label: "🌆 Rooftop", group: "type", noun: "rooftop bars", category: "rooftop_bars" },
  { id: "sports", label: "🏈 Sports Bar", group: "type", noun: "sports bars", category: "sports_bars" }
];

const COFFEE_CUISINES: BuilderRefinement[] = [
  { id: "espresso", label: "☕ Espresso Bar", group: "type", noun: "espresso bars" }
];

const ACTIVITY_SUBTYPES: BuilderRefinement[] = [
  { id: "parks", label: "🌳 Parks", group: "type", noun: "parks", category: "park" },
  { id: "museums", label: "🏛️ Museums", group: "type", noun: "museums", category: "museums" },
  { id: "zoos_aquariums", label: "🐘 Zoos & Aquariums", group: "type", noun: "zoos and aquariums", category: "zoos" },
  {
    id: "family_friendly",
    label: "👨‍👩‍👧 Family Friendly",
    group: "type",
    noun: "family friendly activities",
    category: "family"
  },
  { id: "hiking", label: "🥾 Hiking", group: "type", noun: "hiking trails", category: "hiking" },
  { id: "mini_golf", label: "⛳ Mini Golf", group: "type", noun: "mini golf", category: "activities" },
  { id: "arcades", label: "🕹️ Arcades", group: "type", noun: "arcades", category: "arcades" },
  { id: "bowling", label: "🎳 Bowling", group: "type", noun: "bowling alleys", category: "bowling" },
  { id: "gardens", label: "🌸 Gardens", group: "type", noun: "gardens", category: "gardens" },
  { id: "driving_ranges", label: "🏌️ Driving Ranges", group: "type", noun: "driving ranges", category: "driving_range" }
];

const THRIFT_SUBTYPES: BuilderRefinement[] = [
  { id: "thrift_stores", label: "🛒 Thrift Stores", group: "type", noun: "thrift stores", category: "thrifting" },
  { id: "restores", label: "🔨 ReStores", group: "type", noun: "Habitat ReStore shops", category: "thrifting" },
  { id: "vintage_clothing", label: "👗 Vintage Clothing", group: "type", noun: "vintage clothing shops", category: "vintage" },
  { id: "antiques", label: "🏺 Antiques", group: "type", noun: "antique shops", category: "antiques" },
  {
    id: "architectural_salvage",
    label: "🪵 Architectural Salvage",
    group: "type",
    noun: "architectural salvage stores",
    category: "antiques"
  },
  { id: "record_stores", label: "💿 Record Stores", group: "type", noun: "record stores", category: "bookstore" },
  { id: "used_books", label: "📚 Used Books", group: "type", noun: "used bookstores", category: "bookstore" }
];

const SHOPPING_SUBTYPES: BuilderRefinement[] = [
  {
    id: "main_streets",
    label: "🏘️ Main Streets",
    group: "type",
    noun: "main street shopping",
    category: "walkable_main_streets"
  },
  {
    id: "shopping_districts",
    label: "🏬 Shopping Districts",
    group: "type",
    noun: "shopping districts",
    category: "downtowns"
  },
  { id: "malls", label: "🛍️ Malls", group: "type", noun: "shopping malls", category: "malls" },
  { id: "boutiques", label: "👛 Boutiques", group: "type", noun: "boutiques", category: "shopping" },
  { id: "farmers_markets", label: "🧺 Farmers Markets", group: "type", noun: "farmers markets", category: "farmers_markets" }
];

export const BUILDER_TYPE_REFINEMENTS: Partial<Record<LocalChipCategoryId, BuilderRefinement[]>> = {
  food: FOOD_CUISINES,
  drinks: DRINKS_CUISINES,
  coffee: COFFEE_CUISINES,
  activities: ACTIVITY_SUBTYPES,
  events: EVENT_TYPE_REFINEMENTS,
  sports: SPORT_TYPE_REFINEMENTS,
  thrift_vintage: THRIFT_SUBTYPES,
  shopping: SHOPPING_SUBTYPES
};

export const BUILDER_VIBES: Partial<Record<LocalChipCategoryId, BuilderRefinement[]>> = {
  food: [
    { id: "upscale", label: "✨ Upscale", group: "extra", prefix: "upscale" },
    { id: "date_night", label: "💕 Date Night", group: "extra", prefix: "date night" },
    { id: "outdoor", label: "🌿 Outdoor", group: "extra", suffix: "with outdoor seating" }
  ],
  drinks: [
    { id: "upscale", label: "✨ Upscale", group: "extra", prefix: "upscale" },
    { id: "outdoor", label: "🌿 Outdoor", group: "extra", suffix: "with outdoor seating" }
  ],
  coffee: [
    { id: "quiet", label: "🤫 Quiet", group: "extra", prefix: "quiet" },
    { id: "work", label: "💻 Good for Work", group: "extra", suffix: "good for working" },
    { id: "outdoor", label: "🌿 Outdoor", group: "extra", suffix: "with outdoor seating" }
  ]
};

export const RADIUS_OPTIONS: RadiusOption[] = ["10 min", "20 min", "30 min", "Flexible"];

const DRINKS_VENUE_CATEGORIES = new Set<VenueCategory>([
  "cocktail_bars",
  "breweries",
  "wine_bars",
  "lounges",
  "pubs",
  "rooftop_bars",
  "sports_bars",
  "bar",
  "distilleries"
]);

const ACTIVITY_VENUE_CATEGORIES = new Set<VenueCategory>([
  "activities",
  "park",
  "museums",
  "childrens_museums",
  "zoos",
  "aquariums",
  "family",
  "hiking",
  "trails",
  "arcades",
  "bowling",
  "gardens",
  "driving_range",
  "escape_rooms",
  "pickleball",
  "playgrounds",
  "dog_parks",
  "nature_preserves",
  "scenic_spots",
  "sports"
]);

const THRIFT_VENUE_CATEGORIES = new Set<VenueCategory>(["thrifting", "vintage", "antiques"]);

const SHOPPING_VENUE_CATEGORIES = new Set<VenueCategory>([
  "shopping",
  "malls",
  "outlets",
  "walkable_main_streets",
  "downtowns",
  "farmers_markets",
  "small_towns",
  "waterfronts"
]);

/**
 * Categories that are still fully supported via natural-language search and intent
 * detection, but are intentionally hidden as top-level builder chips to simplify the UI.
 */
export const HIDDEN_PRIMARY_CHIP_CATEGORIES: LocalChipCategoryId[] = ["shopping", "thrift_vintage"];

/** Primary categories surfaced as selectable chips in the builder UI. */
export const VISIBLE_LOCAL_CHIP_CATEGORIES: LocalChipCategory[] = LOCAL_CHIP_CATEGORIES.filter(
  (item) => !HIDDEN_PRIMARY_CHIP_CATEGORIES.includes(item.id)
);

export function localChipCategoryById(id: LocalChipCategoryId): LocalChipCategory {
  return LOCAL_CHIP_CATEGORIES.find((item) => item.id === id) ?? LOCAL_CHIP_CATEGORIES[0];
}

export function typeRefinementsFor(group: LocalChipCategoryId): BuilderRefinement[] {
  return BUILDER_TYPE_REFINEMENTS[group] ?? [];
}

export function vibeRefinementsFor(group: LocalChipCategoryId): BuilderRefinement[] {
  return BUILDER_VIBES[group] ?? [];
}

export function groupHasCuisineOptions(group: LocalChipCategoryId): boolean {
  return group === "food" || group === "drinks" || group === "coffee";
}

export function groupHasVibeOptions(group: LocalChipCategoryId): boolean {
  return groupHasCuisineOptions(group);
}

export function categoryGroupFor(category: VenueCategory): LocalChipCategoryId {
  if (category === "coffee") return "coffee";
  if (category === "events") return "events";
  if (ACTIVITY_VENUE_CATEGORIES.has(category)) return "activities";
  if (THRIFT_VENUE_CATEGORIES.has(category)) return "thrift_vintage";
  if (SHOPPING_VENUE_CATEGORIES.has(category)) return "shopping";
  if (category === "custom") return "food";
  if (DRINKS_VENUE_CATEGORIES.has(category)) return "drinks";
  return "food";
}

export function resolveBuilderCategory(category: VenueCategory): LocalChipCategory {
  return localChipCategoryById(categoryGroupFor(category));
}

export function resolveTypeRefinement(
  group: LocalChipCategoryId,
  typeId: string | null
): BuilderRefinement | null {
  if (!typeId) return null;
  return typeRefinementsFor(group).find((item) => item.id === typeId) ?? null;
}

export function venueCategoryForChip(group: LocalChipCategoryId, typeId: string | null): VenueCategory {
  const type = resolveTypeRefinement(group, typeId);
  if (type?.category) return type.category;
  return localChipCategoryById(group).defaultVenueCategory;
}

export function buildStructuredQuery(input: {
  mode: SearchBuilderMode;
  category: VenueCategory;
  cuisineId: string | null;
  radius: RadiusOption;
  locationA?: string;
  locationB?: string;
}): string {
  const group = categoryGroupFor(input.category);
  const baseCategory = localChipCategoryById(group);
  const type = resolveTypeRefinement(group, input.cuisineId);
  const noun = type?.noun ?? (type?.prefix ? `${type.prefix.toLowerCase()} ${baseCategory.noun}` : baseCategory.noun);

  const parts: string[] = [];
  if (type?.prefix && !type.noun) parts.push(type.prefix.toLowerCase());
  parts.push(noun);

  if (input.mode === "halfway") {
    const a = input.locationA?.trim() || "Location A";
    const b = input.locationB?.trim() || "Location B";
    parts.push(`halfway between ${a} and ${b}`);
  } else if (input.mode === "destination") {
    const dest = input.locationA?.trim() || "destination";
    parts.push(`near ${dest}`);
  } else {
    parts.push("near me");
  }

  if (input.radius !== "Flexible") parts.push(`within ${input.radius}`);

  const phrase = parts.join(" ");
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}
