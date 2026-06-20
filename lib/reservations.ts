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
  const trimmedName = name.trim();
  const { city } = extractCityStateFromAddress(address);
  const location = city || address.trim();
  const query = [trimmedName, location].filter(Boolean).join(" ");
  return query.trim();
}

export function buildOpenTableSearchUrl(name: string, address: string) {
  const query = buildReservationSearchQuery(name, address);
  if (!query) return null;

  const params = new URLSearchParams({
    covers: "2",
    dateTime: buildDefaultOpenTableDateTime(),
    term: query
  });

  return `https://www.opentable.com/s/?${params.toString()}`;
}

const RESY_METRO_FALLBACKS: Record<string, string> = {
  "hoboken-nj": "new-york-ny",
  "jersey-city-nj": "new-york-ny",
  "staten-island-ny": "new-york-ny",
  "brooklyn-ny": "new-york-ny",
  "queens-ny": "new-york-ny",
  "bronx-ny": "new-york-ny",
  "manhattan-ny": "new-york-ny"
};

export function buildResySearchUrl(name: string, address: string) {
  const trimmedName = name.trim();
  const { city, state } = extractCityStateFromAddress(address);
  const slug = buildResyCitySlug(city, state);
  const metroSlug = slug ? RESY_METRO_FALLBACKS[slug] ?? slug : "";
  if (!trimmedName || !metroSlug) return null;

  const params = new URLSearchParams({
    query: trimmedName,
    seats: "2",
    date: buildDefaultReservationDate()
  });

  return `https://resy.com/cities/${metroSlug}/search?${params.toString()}`;
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

function extractCityStateFromAddress(address: string) {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return { city: "", state: "" };

  const withoutCountry =
    parts[parts.length - 1].match(/^(USA|United States)$/i) ? parts.slice(0, -1) : parts;

  if (withoutCountry.length >= 3) {
    return {
      city: withoutCountry[1],
      state: extractStateAbbrev(withoutCountry[2])
    };
  }

  if (withoutCountry.length === 2) {
    return {
      city: withoutCountry[0],
      state: extractStateAbbrev(withoutCountry[1])
    };
  }

  return { city: withoutCountry[0], state: "" };
}

function extractStateAbbrev(value: string) {
  const match = value.match(/\b([A-Z]{2})\b/);
  return match?.[1]?.toLowerCase() ?? "";
}

function buildResyCitySlug(city: string, state: string) {
  const citySlug = city
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!citySlug) return "";
  return state ? `${citySlug}-${state}` : citySlug;
}

function buildDefaultReservationDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function buildDefaultOpenTableDateTime() {
  return `${buildDefaultReservationDate()}T19:00`;
}
