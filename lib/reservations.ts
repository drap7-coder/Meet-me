import type { ScoredVenue, VenueCategory } from "@/lib/types";

const RESTAURANT_RESERVATION_CATEGORIES = new Set<VenueCategory>([
  "restaurant",
  "italian",
  "steakhouse",
  "sushi",
  "seafood",
  "mexican",
  "thai",
  "indian",
  "mediterranean",
  "brunch",
  "american",
  "asian",
  "bbq",
  "pizza",
  "vegan",
  "breakfast",
  "dessert"
]);

const RESTAURANT_PLACE_TYPES = new Set([
  "restaurant",
  "fine_dining_restaurant",
  "steak_house",
  "sushi_restaurant",
  "indian_restaurant",
  "mexican_restaurant",
  "italian_restaurant",
  "seafood_restaurant",
  "brunch_restaurant",
  "breakfast_restaurant",
  "american_restaurant",
  "chinese_restaurant",
  "japanese_restaurant",
  "thai_restaurant",
  "french_restaurant",
  "mediterranean_restaurant",
  "bar_and_grill",
  "diner"
]);

const RESTAURANT_FALLBACK_TERMS = [
  "restaurant",
  "italian",
  "steakhouse",
  "sushi",
  "seafood",
  "mexican",
  "thai",
  "chinese",
  "japanese",
  "indian",
  "french",
  "mediterranean",
  "brunch",
  "dinner",
  "lunch"
];

export function buildReservationSearchQuery(name: string, address: string) {
  const city = extractCityFromAddress(address);
  const location = city || address.trim();
  return [name.trim(), location].filter(Boolean).join(" ");
}

export function buildOpenTableSearchUrl(name: string, address: string) {
  const query = buildReservationSearchQuery(name, address);
  return `https://www.opentable.com/s?term=${encodeURIComponent(query)}`;
}

export function buildResySearchUrl(name: string, address: string) {
  const query = buildReservationSearchQuery(name, address);
  return `https://resy.com/find?query=${encodeURIComponent(query)}`;
}

export function isRestaurantReservationEligible(
  searchCategory: VenueCategory,
  venue: Pick<ScoredVenue, "category" | "types">
) {
  const placeTypes = venue.types ?? [];
  const haystack = [venue.category, ...placeTypes].join(" ").toLowerCase();
  const isCoffeeLike = /\bcoffee_shop\b|\bcafe\b/.test(haystack) && !/\brestaurant\b/.test(haystack);

  if (searchCategory === "coffee") {
    return (
      !isCoffeeLike &&
      (placeTypes.some((type) => RESTAURANT_PLACE_TYPES.has(type)) || /\brestaurant\b/.test(haystack))
    );
  }

  if (RESTAURANT_RESERVATION_CATEGORIES.has(searchCategory)) return true;
  if (placeTypes.some((type) => RESTAURANT_PLACE_TYPES.has(type))) return true;
  if (isCoffeeLike) return false;

  return RESTAURANT_FALLBACK_TERMS.some((term) => haystack.includes(term));
}

function extractCityFromAddress(address: string) {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length <= 1) return parts[0] ?? "";
  const withoutCountry =
    parts[parts.length - 1].match(/^(USA|United States)$/i) ? parts.slice(0, -1) : parts;
  if (withoutCountry.length >= 3) return withoutCountry[1];
  if (withoutCountry.length === 2) return withoutCountry[0];
  return withoutCountry[0];
}
