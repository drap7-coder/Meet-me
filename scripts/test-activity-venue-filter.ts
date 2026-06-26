import {
  filterActivitySearchVenues,
  filterGenericCivicRecreationVenues,
  isGenericCivicRecreationVenue
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

const coffeeShop = {
  id: "4",
  name: "Corner Coffee",
  category: "coffee",
  address: "12 Bean St",
  types: ["cafe"]
};

assert(isGenericCivicRecreationVenue(communityCenter), "community center is generic civic recreation");
assert(isGenericCivicRecreationVenue(sportsActivityCenter), "sports activity center is generic civic recreation");
assert(!isGenericCivicRecreationVenue(miniGolf), "mini golf venue is not generic civic recreation");
assert(!isGenericCivicRecreationVenue(coffeeShop), "coffee shop is not generic civic recreation");

const filteredMiniGolf = filterActivitySearchVenues("mini golf near me", { category: "activities", subcategoryId: "mini_golf" }, [
  communityCenter,
  sportsActivityCenter,
  miniGolf
]);

assert(filteredMiniGolf.length === 1 && filteredMiniGolf[0]?.id === "3", "mini golf search drops civic recreation venues");

const filteredCoffee = filterActivitySearchVenues("coffee near me", { category: "food_drink", subcategoryId: "coffee" }, [
  communityCenter,
  coffeeShop
]);

assert(filteredCoffee.length === 1 && filteredCoffee[0]?.id === "4", "coffee search also drops civic recreation venues");

assert(
  filterGenericCivicRecreationVenues([communityCenter, sportsActivityCenter, miniGolf, coffeeShop]).length === 2,
  "global civic recreation filter keeps non-civic venues only"
);

console.log("PASS activity venue filter");
