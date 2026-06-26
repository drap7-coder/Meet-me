import {
  filterActivitySearchVenues,
  filterGenericCivicRecreationVenues,
  isGenericCivicRecreationVenue,
  shouldFilterGenericCivicRecreationVenues
} from "../lib/activityVenueFilter";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const communityCenter = {
  id: "1",
  name: "Springfield Community Center",
  category: "activities",
  address: "123 Main St",
  types: ["community_center"]
};

const sportsActivityCenter = {
  id: "2",
  name: "Regional Sports Activity Center",
  category: "activities",
  address: "456 Oak Ave",
  types: ["sports_complex"]
};

const miniGolf = {
  id: "3",
  name: "Glow Putt Mini Golf",
  category: "activities",
  address: "789 Fun Ln",
  types: ["amusement_center"]
};

assert(isGenericCivicRecreationVenue(communityCenter), "community center is generic civic recreation");
assert(isGenericCivicRecreationVenue(sportsActivityCenter), "sports activity center is generic civic recreation");
assert(!isGenericCivicRecreationVenue(miniGolf), "mini golf venue is not generic civic recreation");

assert(
  shouldFilterGenericCivicRecreationVenues("mini golf near me"),
  "mini golf query enables civic recreation filtering"
);
assert(
  !shouldFilterGenericCivicRecreationVenues("coffee near me"),
  "coffee query does not enable civic recreation filtering"
);

const filtered = filterActivitySearchVenues("mini golf near me", { category: "activities", subcategoryId: "mini_golf" }, [
  communityCenter,
  sportsActivityCenter,
  miniGolf
]);

assert(filtered.length === 1 && filtered[0]?.id === "3", "mini golf search drops civic recreation venues");

assert(
  filterGenericCivicRecreationVenues([communityCenter, sportsActivityCenter, miniGolf]).length === 1,
  "generic civic filter keeps only real activity venues"
);

console.log("PASS activity venue filter");
