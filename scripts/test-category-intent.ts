import { getCategorySearchTerm, resolveSearchCategoryFromQuery } from "@/lib/categories";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const eatingQueries = [
  "What's worth eating tonight?",
  "What's worth eating near me tonight",
  "what should we eat tonight",
  "where should we eat near me"
];

for (const query of eatingQueries) {
  const resolved = resolveSearchCategoryFromQuery(query);
  assert(resolved.category === "restaurant", `${query} should resolve to restaurant, got ${resolved.category}`);
  assert(
    getCategorySearchTerm(resolved.category, resolved.customQuery).includes("restaurant"),
    `${query} should search restaurants, got ${getCategorySearchTerm(resolved.category, resolved.customQuery)}`
  );
}

const withBadParser = resolveSearchCategoryFromQuery("What's worth eating tonight?", "tailor");
assert(withBadParser.category === "restaurant", "food query should override bad parser category tailor");
assert(
  getCategorySearchTerm(withBadParser.category, withBadParser.customQuery) !== "tailor",
  "food query should not search for tailor"
);

const hinted = resolveSearchCategoryFromQuery("somewhere fun tonight", undefined, "restaurant");
assert(hinted.category === "restaurant", "restaurant hint should apply when query has no stronger category");

const shopping = resolveSearchCategoryFromQuery("where should we go shopping near me");
assert(shopping.category === "shopping", "shopping query should stay shopping");

console.log("PASS category intent");
