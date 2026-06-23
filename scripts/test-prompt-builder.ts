import { buildPlaceQuery } from "../app/components/SearchPromptAssist";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function includesPhrase(query: string, phrase: string) {
  return query.toLowerCase().includes(phrase.toLowerCase());
}

const stacked = {
  what: "restaurant" as const,
  typeId: "sushi",
  extras: new Set(["date_night", "outdoor"]),
  when: "tonight" as const,
  where: "halfway" as const,
  watchType: "movies" as const,
  genre: null
};

const query = buildPlaceQuery(stacked);
assert(includesPhrase(query, "date night"), `includes date night: ${query}`);
assert(includesPhrase(query, "sushi"), `includes sushi: ${query}`);
assert(includesPhrase(query, "outdoor seating"), `includes outdoor: ${query}`);
assert(includesPhrase(query, "halfway between us"), `includes halfway: ${query}`);
assert(includesPhrase(query, "tonight"), `includes tonight: ${query}`);
assert(!includesPhrase(query, "open now"), "excludes unselected when");

const minimal = {
  what: "restaurant" as const,
  typeId: null,
  extras: new Set<string>(),
  when: null,
  where: "near" as const,
  watchType: "movies" as const,
  genre: null
};

assert(buildPlaceQuery(minimal) === "Restaurants near me", "minimal query has no implicit tonight");

const drinksStacked = {
  what: "drinks" as const,
  typeId: "wine",
  extras: new Set(["upscale"]),
  when: "open_now" as const,
  where: "near" as const,
  watchType: "movies" as const,
  genre: null
};

const drinksQuery = buildPlaceQuery(drinksStacked);
assert(includesPhrase(drinksQuery, "upscale"), `includes upscale: ${drinksQuery}`);
assert(includesPhrase(drinksQuery, "wine"), `includes wine: ${drinksQuery}`);
assert(includesPhrase(drinksQuery, "open now"), `includes open now: ${drinksQuery}`);

console.log("PASS prompt builder stacking");
