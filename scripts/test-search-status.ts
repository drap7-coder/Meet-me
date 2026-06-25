import {
  classifySearchError,
  isEmptyPlacesResults,
  isEmptyWatchResults,
  isSearchError,
  isRecoverableSearchError,
  searchError,
  SEARCH_ERROR_MESSAGES,
  shouldShowInlineSearchError
} from "../lib/searchStatus";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const geocode = classifySearchError('Could not geocode "EV".');
assert(geocode.kind === "INVALID_LOCATION", "geocode maps to INVALID_LOCATION");
assert(
  geocode.message === SEARCH_ERROR_MESSAGES.INVALID_LOCATION,
  "geocode uses friendly message"
);

const needsLocation = classifySearchError("Add your location to search nearby.");
assert(needsLocation.kind === "NEEDS_LOCATION", "needs location maps correctly");
assert(!shouldShowInlineSearchError(needsLocation), "needs location is not inline");

const network = classifySearchError(new TypeError("Failed to fetch"));
assert(network.kind === "NETWORK_ERROR", "fetch failure maps to NETWORK_ERROR");

const structured = searchError("PROVIDER_ERROR");
assert(isSearchError(structured), "searchError helper produces SearchError");
assert(classifySearchError(structured).kind === "PROVIDER_ERROR", "structured errors pass through");
assert(isRecoverableSearchError(structured), "provider errors stay on the search box");
assert(!isRecoverableSearchError(needsLocation), "needs location is not recoverable inline");

assert(
  isEmptyPlacesResults({
    venues: [],
    events: [],
    originA: { input: "A", formattedAddress: "A", location: { lat: 0, lng: 0 } },
    originB: { input: "B", formattedAddress: "B", location: { lat: 0, lng: 0 } },
    midpoint: { lat: 0, lng: 0 },
    category: "restaurant",
    searchMode: "single",
    meetupMode: "single",
    preferences: [],
    query: "blah"
  }),
  "no venues or events is empty"
);

assert(
  !isEmptyPlacesResults({
    venues: [],
    events: [{ id: "1", title: "Show", category: "Music", venue: "Hall", startTime: "2026-01-01T19:00:00Z", city: "Philly", state: "PA", source: "test" }],
    originA: { input: "A", formattedAddress: "A", location: { lat: 0, lng: 0 } },
    originB: { input: "B", formattedAddress: "B", location: { lat: 0, lng: 0 } },
    midpoint: { lat: 0, lng: 0 },
    category: "restaurant",
    searchMode: "single",
    meetupMode: "single",
    preferences: [],
    query: "concerts near me"
  }),
  "events-only places response is not empty"
);

assert(
  isEmptyWatchResults({
    botMode: "watch",
    query: "blah",
    title: "Watch",
    description: "",
    message: "",
    intent: "stream",
    intentLabel: "Watch",
    location: "",
    timeframe: "",
    topic: "",
    contextSummary: "",
    resultCount: 0,
    recommendations: [],
    futureProviders: [],
    preview: false
  }),
  "no watch recommendations is empty"
);

console.log("PASS search status");
