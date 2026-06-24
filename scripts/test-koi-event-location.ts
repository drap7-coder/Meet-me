import {
  eventSearchLocationReady,
  needsCurrentLocationResolution,
  resolveCurrentLocationInForm
} from "../lib/currentLocation";
import { resolveEventSearchForm } from "../lib/koiSearchExecute";
import type { SearchHalfwayRequest } from "../lib/types";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const emptyForm: SearchHalfwayRequest = {
  locationA: "",
  locationB: "",
  category: "restaurant",
  searchMode: "single",
  meetupMode: "single",
  customQuery: ""
};

const nycContext = {
  locationA: "Brooklyn, NY",
  locationACoordinates: { lat: 40.6782, lng: -73.9442 }
};

const concertsForm = resolveEventSearchForm("Concerts near me", emptyForm, nycContext);
assert(concertsForm.locationA === "Brooklyn, NY", "near-me merges context label");
assert(concertsForm.locationACoordinates?.lat === 40.6782, "near-me merges context coordinates");
assert(eventSearchLocationReady(concertsForm), "label + coords is ready");

const coordsOnlyContext = { locationA: "", locationACoordinates: { lat: 40.6782, lng: -73.9442 } };
const coordsOnlyForm = resolveCurrentLocationInForm(
  { ...emptyForm, locationA: "me" },
  coordsOnlyContext
);
assert(coordsOnlyForm.locationACoordinates?.lat === 40.6782, "coords-only context resolves");
assert(eventSearchLocationReady(coordsOnlyForm), "coords-only is ready");

const savedCityForm = resolveEventSearchForm("Concerts near me", emptyForm, {
  locationA: "Wyndmoor, PA"
});
assert(savedCityForm.locationA === "Wyndmoor, PA", "near-me uses saved city when GPS unavailable");
assert(eventSearchLocationReady(savedCityForm), "saved city is geocodable");
assert(!needsCurrentLocationResolution(savedCityForm), "saved city does not need GPS");

console.log("PASS koi event location");
