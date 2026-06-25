import { EVENT_TYPE_REFINEMENTS, SPORT_TYPE_REFINEMENTS } from "@/lib/eventBuilderOptions";
import type { BuilderRefinement } from "@/lib/searchBuilderOptions";
import type { VenueCategory } from "@/lib/types";

/** Top-level concierge mode — Streaming stays separate from local discovery. */
export type ExploreMode = "streaming" | "explore";

export type ExploreCategory =
  | "food_drink"
  | "nightlife"
  | "events"
  | "sports"
  | "activities"
  | "outdoors";

export type ProviderKey =
  | "google_places"
  | "ticketmaster"
  | "eventbrite"
  | "opentripmap"
  | "openstreetmap"
  | "national_parks"
  | "tmdb";

export type ExploreCategoryConfig = {
  key: ExploreCategory;
  label: string;
  emoji: string;
  description: string;
  noun: string;
  providers: ProviderKey[];
  defaultVenueCategory: VenueCategory;
  subtypeLabel: string;
  refinements: BuilderRefinement[];
  vibeRefinements?: BuilderRefinement[];
};

export type NormalizedExploreIntent = {
  mode: ExploreMode;
  category: ExploreCategory | null;
  subcategoryId: string | null;
  query: string;
  providers: ProviderKey[];
  venueCategory: VenueCategory;
  routeViaTicketmaster: boolean;
  preferOpenTripMap: boolean;
  timeAwareExplore: boolean;
};

const FOOD_DRINK_REFINEMENTS: BuilderRefinement[] = [
  { id: "restaurants", label: "Restaurants", group: "type", noun: "restaurants", category: "restaurant" },
  { id: "coffee", label: "Coffee", group: "type", noun: "coffee shops", category: "coffee" },
  { id: "brunch", label: "Brunch", group: "type", noun: "brunch spots", category: "brunch" },
  { id: "bars", label: "Bars", group: "type", noun: "bars", category: "bar" },
  { id: "breweries", label: "Breweries", group: "type", noun: "breweries", category: "breweries" },
  { id: "dessert", label: "Dessert", group: "type", noun: "dessert spots", category: "dessert" },
  { id: "italian", label: "Italian", group: "type", prefix: "Italian", category: "italian" },
  { id: "sushi", label: "Sushi", group: "type", noun: "sushi restaurants", category: "sushi" },
  { id: "pizza", label: "Pizza", group: "type", noun: "pizza places", category: "pizza" },
  { id: "mexican", label: "Mexican", group: "type", prefix: "Mexican", category: "mexican" }
];

const NIGHTLIFE_REFINEMENTS: BuilderRefinement[] = [
  { id: "cocktail_bars", label: "Cocktail bars", group: "type", noun: "cocktail bars", category: "cocktail_bars" },
  { id: "live_music", label: "Live music", group: "type", noun: "live music venues", category: "events" },
  { id: "dancing", label: "Dancing", group: "type", noun: "dance clubs", category: "activities" },
  { id: "lounges", label: "Lounges", group: "type", noun: "lounges", category: "lounges" },
  { id: "late_night_food", label: "Late-night food", group: "type", noun: "late night food", category: "restaurant" },
  { id: "rooftop", label: "Rooftop bars", group: "type", noun: "rooftop bars", category: "rooftop_bars" },
  { id: "wine_bars", label: "Wine bars", group: "type", noun: "wine bars", category: "wine_bars" }
];

const EVENTS_REFINEMENTS: BuilderRefinement[] = [
  ...EVENT_TYPE_REFINEMENTS.map((item) => ({ ...item, label: item.label.replace(/^[^\s]+\s/, "") })),
  { id: "festivals", label: "Festivals", group: "type", noun: "festivals" },
  { id: "family_events", label: "Family events", group: "type", noun: "family events" }
];

const SPORTS_REFINEMENTS: BuilderRefinement[] = [
  { id: "live_sports", label: "Live sports", group: "type", noun: "live sports games" },
  ...SPORT_TYPE_REFINEMENTS.map((item) => ({ ...item, label: item.label.replace(/^[^\s]+\s/, "") })),
  { id: "sports_bars", label: "Sports bars", group: "type", noun: "sports bars", category: "sports_bars" },
  { id: "golf", label: "Golf", group: "type", noun: "golf courses", category: "driving_range" },
  { id: "pickleball", label: "Pickleball", group: "type", noun: "pickleball courts", category: "pickleball" },
  { id: "batting_cages", label: "Batting cages", group: "type", noun: "batting cages", category: "activities" }
];

const ACTIVITIES_REFINEMENTS: BuilderRefinement[] = [
  { id: "bowling", label: "Bowling", group: "type", noun: "bowling alleys", category: "bowling" },
  { id: "mini_golf", label: "Mini golf", group: "type", noun: "mini golf", category: "activities" },
  { id: "arcades", label: "Arcades", group: "type", noun: "arcades", category: "arcades" },
  { id: "axe_throwing", label: "Axe throwing", group: "type", noun: "axe throwing", category: "activities" },
  { id: "museums", label: "Museums", group: "type", noun: "museums", category: "museums" },
  { id: "public_art", label: "Public art", group: "type", noun: "public art", category: "custom" },
  { id: "spas", label: "Spas", group: "type", noun: "spas", category: "activities" },
  { id: "landmarks", label: "Landmarks", group: "type", noun: "landmarks", category: "activities" },
  { id: "thrift_stores", label: "Thrift stores", group: "type", noun: "thrift stores", category: "thrifting" },
  { id: "vintage", label: "Vintage shops", group: "type", noun: "vintage clothing shops", category: "vintage" },
  { id: "record_stores", label: "Record stores", group: "type", noun: "record stores", category: "bookstore" },
  { id: "escape_rooms", label: "Escape rooms", group: "type", noun: "escape rooms", category: "escape_rooms" }
];

const OUTDOORS_REFINEMENTS: BuilderRefinement[] = [
  { id: "parks", label: "Parks", group: "type", noun: "parks", category: "park" },
  { id: "hiking", label: "Hiking", group: "type", noun: "hiking trails", category: "hiking" },
  { id: "trails", label: "Trails", group: "type", noun: "trails and greenways", category: "trails" },
  { id: "gardens", label: "Gardens", group: "type", noun: "gardens", category: "gardens" },
  { id: "waterfront", label: "Waterfront", group: "type", noun: "waterfront spots", category: "waterfronts" },
  { id: "farmers_markets", label: "Farmers markets", group: "type", noun: "farmers markets", category: "farmers_markets" },
  { id: "scenic_drives", label: "Scenic drives", group: "type", noun: "scenic drives", category: "scenic_spots" },
  { id: "overlooks", label: "Overlooks", group: "type", noun: "scenic overlooks", category: "scenic_spots" },
  { id: "nature_preserves", label: "Nature preserves", group: "type", noun: "nature preserves", category: "nature_preserves" },
  { id: "historic_sites", label: "Historic sites", group: "type", noun: "historic sites", category: "activities" }
];

const FOOD_VIBES: BuilderRefinement[] = [
  { id: "upscale", label: "Upscale", group: "extra", prefix: "upscale" },
  { id: "date_night", label: "Date night", group: "extra", prefix: "date night" },
  { id: "outdoor", label: "Outdoor seating", group: "extra", suffix: "with outdoor seating" }
];

export const EXPLORE_CATEGORIES: ExploreCategoryConfig[] = [
  {
    key: "food_drink",
    label: "Food & Drink",
    emoji: "🍽️",
    description: "Restaurants, coffee, brunch, bars, breweries, dessert",
    noun: "restaurants",
    providers: ["google_places"],
    defaultVenueCategory: "restaurant",
    subtypeLabel: "Type",
    refinements: FOOD_DRINK_REFINEMENTS,
    vibeRefinements: FOOD_VIBES
  },
  {
    key: "nightlife",
    label: "Nightlife",
    emoji: "🌙",
    description: "Cocktails, live music, dancing, lounges, late-night food",
    noun: "nightlife spots",
    providers: ["google_places"],
    defaultVenueCategory: "cocktail_bars",
    subtypeLabel: "Type",
    refinements: NIGHTLIFE_REFINEMENTS
  },
  {
    key: "events",
    label: "Events",
    emoji: "🎟️",
    description: "Concerts, comedy, theater, festivals, family events",
    noun: "events and live shows",
    providers: ["ticketmaster", "eventbrite"],
    defaultVenueCategory: "events",
    subtypeLabel: "Type",
    refinements: EVENTS_REFINEMENTS
  },
  {
    key: "sports",
    label: "Sports",
    emoji: "🏟️",
    description: "Live sports, sports bars, golf, pickleball, places to play",
    noun: "live sports",
    providers: ["ticketmaster", "google_places"],
    defaultVenueCategory: "events",
    subtypeLabel: "Type",
    refinements: SPORTS_REFINEMENTS
  },
  {
    key: "activities",
    label: "Activities",
    emoji: "🎯",
    description: "Bowling, mini golf, arcades, thrift stores, spas, museums",
    noun: "things to do",
    providers: ["opentripmap", "google_places"],
    defaultVenueCategory: "activities",
    subtypeLabel: "Type",
    refinements: ACTIVITIES_REFINEMENTS
  },
  {
    key: "outdoors",
    label: "Outdoors",
    emoji: "🌲",
    description: "Parks, hikes, gardens, waterfronts, scenic places",
    noun: "outdoor places",
    providers: ["opentripmap", "google_places"],
    defaultVenueCategory: "park",
    subtypeLabel: "Type",
    refinements: OUTDOORS_REFINEMENTS
  }
];

const EXPLORE_CATEGORY_SET = new Set<ExploreCategory>(EXPLORE_CATEGORIES.map((item) => item.key));

export function isExploreCategory(value: unknown): value is ExploreCategory {
  return typeof value === "string" && EXPLORE_CATEGORY_SET.has(value as ExploreCategory);
}

export function exploreCategoryConfig(category: ExploreCategory): ExploreCategoryConfig {
  return EXPLORE_CATEGORIES.find((item) => item.key === category) ?? EXPLORE_CATEGORIES[0];
}

export function exploreRefinementsFor(category: ExploreCategory): BuilderRefinement[] {
  return exploreCategoryConfig(category).refinements;
}

export function exploreVibesFor(category: ExploreCategory): BuilderRefinement[] {
  return exploreCategoryConfig(category).vibeRefinements ?? [];
}

export function exploreHasVibes(category: ExploreCategory): boolean {
  return exploreVibesFor(category).length > 0;
}

export function resolveExploreRefinement(
  category: ExploreCategory,
  subcategoryId: string | null
): BuilderRefinement | null {
  if (!subcategoryId) return null;
  return exploreRefinementsFor(category).find((item) => item.id === subcategoryId) ?? null;
}

export function venueCategoryForExplore(category: ExploreCategory, subcategoryId: string | null): VenueCategory {
  const refinement = resolveExploreRefinement(category, subcategoryId);
  if (refinement?.category) return refinement.category;
  return exploreCategoryConfig(category).defaultVenueCategory;
}

/** Structured chip/search payload passed from builder → API. */
export type ExploreIntentPayload = {
  mode?: ExploreMode;
  category?: ExploreCategory;
  subcategoryId?: string | null;
  providers?: ProviderKey[];
};

export {
  classifyExploreQuery,
  inferExploreCategoryFromQuery,
  inferExploreSubcategoryFromQuery,
  isOpenTripMapFriendlyQuery,
  type QueryClassification
} from "@/lib/exploreQueryClassification";

export function ticketmasterSubcategoryIds(): Set<string> {
  return new Set([
    "concerts",
    "comedy",
    "theater",
    "weekend",
    "festivals",
    "family_events",
    "live_sports",
    ...SPORT_TYPE_REFINEMENTS.map((item) => item.id)
  ]);
}

export function isTicketmasterExploreSubcategory(category: ExploreCategory, subcategoryId: string | null): boolean {
  if (category === "events") return true;
  if (category !== "sports") return false;
  if (!subcategoryId) return true;
  if (subcategoryId === "sports_bars" || subcategoryId === "golf" || subcategoryId === "pickleball" || subcategoryId === "batting_cages") {
    return false;
  }
  return true;
}
