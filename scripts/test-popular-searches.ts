import { getSeasonalPopularSearches } from "../src/config/popularSearches";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const winter = getSeasonalPopularSearches(new Date("2026-01-15"));
const summer = getSeasonalPopularSearches(new Date("2026-07-15"));

assert(winter.length === 4, "four winter popular searches");
assert(summer.length === 4, "four summer popular searches");
assert(winter[0]?.id !== summer[0]?.id, "seasonal rotation changes lead chip");
assert(winter.every((item) => item.query.trim() && item.label.trim()), "winter items have copy");
assert(summer.some((item) => /weekend|events/i.test(item.query)), "summer includes events");

console.log("PASS seasonal popular searches");
