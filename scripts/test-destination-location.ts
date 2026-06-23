import { formForSessionAfterSearch, shouldPersistHomeLocationUpdate } from "@/lib/searchLocation";
import type { SearchHalfwayRequest } from "@/lib/types";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const savedHome = {
  locationA: "Wyndmoor, PA",
  locationAPlaceId: "home-place-id",
  locationACoordinates: { lat: 40.0812, lng: -75.2034 }
};

const destinationSearch: SearchHalfwayRequest = {
  locationA: "Citizens Bank Park",
  locationB: "",
  category: "cocktail_bars",
  searchMode: "single",
  meetupMode: "single",
  customQuery: "Bars near Citizens Bank Park within 20 min"
};

const sessionForm = formForSessionAfterSearch(destinationSearch, savedHome, {
  preserveSavedHomeLocation: true
});

assert(sessionForm.locationA === "Wyndmoor, PA", "session form should keep saved home locationA");
assert(
  sessionForm.locationAPlaceId === "home-place-id",
  "session form should keep saved home place id"
);
assert(
  sessionForm.locationACoordinates?.lat === 40.0812,
  "session form should keep saved home coordinates"
);
assert(
  destinationSearch.locationA === "Citizens Bank Park",
  "API/search payload must still use the destination"
);
assert(
  sessionForm.customQuery?.includes("Citizens Bank Park") === true,
  "session form should retain destination query text"
);

assert(
  !shouldPersistHomeLocationUpdate("Citizens Bank Park", "Wyndmoor, PA", { allowPersist: false }),
  "destination submit path must not qualify for home-location persistence"
);
assert(
  shouldPersistHomeLocationUpdate("Blue Bell, PA", "Wyndmoor, PA"),
  "explicit home edits should still persist"
);

console.log("PASS destination location separation");
