import { buildPlaceQuery, buildStreamQuery } from "../app/components/SearchPromptAssist";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function includesPhrase(query: string, phrase: string) {
  return query.toLowerCase().includes(phrase.toLowerCase());
}

const stacked = {
  selectedMode: "explore" as const,
  exploreCategory: "food_drink" as const,
  typeId: "restaurants",
  subtypeId: "sushi",
  sportsTeamId: null,
  musicArtistId: null,
  extras: new Set(["date_night", "outdoor"]),
  where: "halfway" as const,
  streamingType: null,
  streamingVibe: null,
  genre: null,
  streamingServices: new Set<string>()
};

const query = buildPlaceQuery(stacked);
assert(includesPhrase(query, "date night"), `includes date night: ${query}`);
assert(buildPlaceQuery(stacked).includes("sushi"), `includes sushi: ${query}`);

const restaurantOnly = {
  selectedMode: "explore" as const,
  exploreCategory: "food_drink" as const,
  typeId: "restaurants",
  subtypeId: null,
  sportsTeamId: null,
  musicArtistId: null,
  extras: new Set<string>(),
  where: "near" as const,
  streamingType: null,
  streamingVibe: null,
  genre: null,
  streamingServices: new Set<string>()
};
assert(buildPlaceQuery(restaurantOnly) === "Restaurants near me", "restaurants without subtype");

const restaurantItalian = {
  ...restaurantOnly,
  subtypeId: "italian"
};
assert(includesPhrase(buildPlaceQuery(restaurantItalian), "italian"), "restaurant cuisine refines query");

const restaurantSeafood = {
  ...restaurantOnly,
  subtypeId: "seafood"
};
assert(includesPhrase(buildPlaceQuery(restaurantSeafood), "seafood"), "restaurant cuisine with noun refines query");

assert(includesPhrase(query, "outdoor seating"), `includes outdoor: ${query}`);
assert(includesPhrase(query, "halfway between us"), `includes halfway: ${query}`);
assert(!includesPhrase(query, "tonight"), "excludes timeframe wording");
assert(!includesPhrase(query, "open now"), "excludes timeframe wording");

const minimal = {
  selectedMode: "explore" as const,
  exploreCategory: "food_drink" as const,
  typeId: null,
  subtypeId: null,
  sportsTeamId: null,
  musicArtistId: null,
  extras: new Set<string>(),
  where: "near" as const,
  streamingType: null,
  streamingVibe: null,
  genre: null,
  streamingServices: new Set<string>()
};

assert(buildPlaceQuery(minimal) === "Restaurants near me", "minimal query has no implicit tonight");

const drinksStacked = {
  selectedMode: "explore" as const,
  exploreCategory: "nightlife" as const,
  typeId: "wine_bars",
  sportsTeamId: null,
  musicArtistId: null,
  extras: new Set<string>(),
  where: "near" as const,
  streamingType: null,
  streamingVibe: null,
  genre: null,
  streamingServices: new Set<string>()
};

const drinksQuery = buildPlaceQuery(drinksStacked);
assert(includesPhrase(drinksQuery, "wine bars"), `includes wine bars: ${drinksQuery}`);
assert(!includesPhrase(drinksQuery, "open now"), "excludes timeframe wording");

const moviesBase = {
  selectedMode: "streaming" as const,
  exploreCategory: null,
  typeId: null,
  sportsTeamId: null,
  musicArtistId: null,
  extras: new Set<string>(),
  where: "near" as const,
  streamingType: "movies" as const,
  streamingVibe: null,
  genre: null,
  streamingServices: new Set<string>()
};

assert(
  buildStreamQuery(moviesBase) === "What movie should I watch?",
  "movies base query"
);

const moviesComedy = { ...moviesBase, genre: "comedy" };
assert(
  buildStreamQuery(moviesComedy) === "What comedy movie should I watch?",
  "movies + comedy refines query"
);

const trendingComedy = {
  ...moviesBase,
  streamingVibe: "trending" as const,
  genre: "comedy"
};
assert(
  buildStreamQuery(trendingComedy) === "Trending comedy movies",
  "trending + comedy refines query"
);

const yankeesSports = {
  selectedMode: "explore" as const,
  exploreCategory: "sports" as const,
  typeId: "baseball",
  sportsTeamId: "yankees",
  musicArtistId: null,
  extras: new Set<string>(),
  where: "near" as const,
  streamingType: null,
  streamingVibe: null,
  genre: null,
  streamingServices: new Set<string>()
};
assert(buildPlaceQuery(yankeesSports) === "Yankees games", "sports team builds nationwide (no near me) query");

const baseballNearby = {
  ...yankeesSports,
  sportsTeamId: null
};
assert(
  buildPlaceQuery(baseballNearby) === "Baseball games near me",
  "sport without team builds geo query"
);

const rockConcerts = {
  selectedMode: "explore" as const,
  exploreCategory: "events" as const,
  typeId: "concerts",
  sportsTeamId: null,
  extras: new Set<string>(),
  where: "near" as const,
  streamingType: null,
  streamingVibe: null,
  genre: null,
  musicGenres: new Set<string>(["rock"]),
  streamingServices: new Set<string>()
};
assert(buildPlaceQuery(rockConcerts) === "Rock concerts near me", "concerts + single genre");

const multiGenreConcerts = { ...rockConcerts, musicGenres: new Set<string>(["rock", "jazz"]) };
const multiGenreQuery = buildPlaceQuery(multiGenreConcerts);
assert(includesPhrase(multiGenreQuery, "rock"), `multi-genre includes rock: ${multiGenreQuery}`);
assert(includesPhrase(multiGenreQuery, "jazz"), `multi-genre includes jazz: ${multiGenreQuery}`);
assert(includesPhrase(multiGenreQuery, "concerts"), `multi-genre keeps concerts noun: ${multiGenreQuery}`);

const concertsNoGenre = { ...rockConcerts, musicGenres: new Set<string>() };
assert(buildPlaceQuery(concertsNoGenre) === "Concerts near me", "concerts without genre");

console.log("PASS prompt builder stacking");
