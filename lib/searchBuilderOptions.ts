import type { VenueCategory } from "@/lib/types";

export type SearchBuilderMode = "near_me" | "halfway" | "destination";
export type RadiusOption = "10 min" | "20 min" | "30 min" | "Flexible";
export type ResultMode = "best" | "more";

export type BuilderCategoryGroup =
  | "restaurant"
  | "drinks"
  | "coffee"
  | "activities"
  | "events"
  | "anything";

export type BuilderCategory = {
  id: VenueCategory;
  label: string;
  noun: string;
  group: BuilderCategoryGroup;
};

export type BuilderCuisine = {
  id: string;
  label: string;
  prefix?: string;
  noun?: string;
  category?: VenueCategory;
};

export const BUILDER_CATEGORIES: BuilderCategory[] = [
  { id: "restaurant", label: "Restaurants", noun: "restaurants", group: "restaurant" },
  { id: "cocktail_bars", label: "Bars", noun: "bars", group: "drinks" },
  { id: "coffee", label: "Coffee", noun: "coffee shops", group: "coffee" },
  { id: "activities", label: "Activities", noun: "things to do", group: "activities" },
  { id: "events", label: "Events", noun: "events", group: "events" },
  { id: "custom", label: "Anything", noun: "places", group: "anything" }
];

export const BUILDER_CUISINES: Partial<Record<BuilderCategoryGroup, BuilderCuisine[]>> = {
  restaurant: [
    { id: "any", label: "Any cuisine" },
    { id: "italian", label: "Italian", prefix: "Italian", category: "italian" },
    { id: "sushi", label: "Sushi", noun: "sushi restaurants", category: "sushi" },
    { id: "steakhouse", label: "Steakhouse", noun: "steakhouses", category: "steakhouse" },
    { id: "mexican", label: "Mexican", prefix: "Mexican", category: "mexican" },
    { id: "pizza", label: "Pizza", noun: "pizza places", category: "pizza" }
  ],
  drinks: [
    { id: "any", label: "Any type" },
    { id: "cocktails", label: "Cocktails", noun: "cocktail bars", category: "cocktail_bars" },
    { id: "wine", label: "Wine Bars", noun: "wine bars", category: "wine_bars" },
    { id: "breweries", label: "Breweries", noun: "breweries", category: "breweries" },
    { id: "rooftop", label: "Rooftop", noun: "rooftop bars", category: "rooftop_bars" },
    { id: "sports", label: "Sports Bar", noun: "sports bars", category: "sports_bars" }
  ],
  coffee: [
    { id: "any", label: "Any style" },
    { id: "espresso", label: "Espresso Bar", noun: "espresso bars" }
  ]
};

export const RADIUS_OPTIONS: RadiusOption[] = ["10 min", "20 min", "30 min", "Flexible"];

export function categoryGroupFor(category: VenueCategory): BuilderCategoryGroup {
  if (category === "coffee") return "coffee";
  if (category === "activities") return "activities";
  if (category === "events") return "events";
  if (category === "custom") return "anything";
  if (
    ["cocktail_bars", "breweries", "wine_bars", "lounges", "pubs", "rooftop_bars", "sports_bars", "bar"].includes(
      category
    )
  ) {
    return "drinks";
  }
  return "restaurant";
}

export function resolveBuilderCategory(category: VenueCategory): BuilderCategory {
  const group = categoryGroupFor(category);
  return BUILDER_CATEGORIES.find((item) => item.group === group) ?? BUILDER_CATEGORIES[0];
}

export function cuisineOptionsForGroup(group: BuilderCategoryGroup): BuilderCuisine[] {
  return BUILDER_CUISINES[group] ?? [];
}

export function groupHasCuisineOptions(group: BuilderCategoryGroup): boolean {
  return cuisineOptionsForGroup(group).length > 0;
}

export function resolveBuilderCuisine(category: VenueCategory, cuisineId: string | null): BuilderCuisine | null {
  const group = categoryGroupFor(category);
  const options = cuisineOptionsForGroup(group);
  if (!cuisineId || cuisineId === "any") return null;
  return options.find((item) => item.id === cuisineId) ?? null;
}

export function venueCategoryForBuilder(categoryId: VenueCategory, cuisineId: string | null): VenueCategory {
  const group = categoryGroupFor(categoryId);
  const cuisine = resolveBuilderCuisine(categoryId, cuisineId);
  if (cuisine?.category) return cuisine.category;
  const base = BUILDER_CATEGORIES.find((item) => item.group === group);
  return base?.id ?? "restaurant";
}

export function buildStructuredQuery(input: {
  mode: SearchBuilderMode;
  category: VenueCategory;
  cuisineId: string | null;
  radius: RadiusOption;
  locationA?: string;
  locationB?: string;
}): string {
  const baseCategory = resolveBuilderCategory(input.category);
  const cuisine = resolveBuilderCuisine(input.category, input.cuisineId);
  const noun =
    cuisine?.noun ??
    (cuisine?.prefix ? `${cuisine.prefix.toLowerCase()} ${baseCategory.noun}` : baseCategory.noun);

  const parts: string[] = [];
  if (cuisine?.prefix && !cuisine.noun) parts.push(cuisine.prefix.toLowerCase());
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
