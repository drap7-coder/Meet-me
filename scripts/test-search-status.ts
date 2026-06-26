import {
  classifySearchError,
  isEmptyPlacesResults,
  isEmptyWatchResults,
  isSearchError,
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

const vagueQuery = classifySearchError("Where should Koi search? Try: coffee near Hoboken.");
assert(vagueQuery.kind === "NEEDS_LOCATION", "vague query without saved location maps to NEEDS_LOCATION");

const gibberish = classifySearchError("I couldn't understand that search. Try: coffee near Hoboken.");
assert(gibberish.kind === "NO_RESULTS", "gibberish query stays inline on the hero");
assert(gibberish.message.includes("Try a place, activity, show, or event"), "gibberish uses inline guidance copy");

const network = classifySearchError(new TypeError("Failed to fetch"));
assert(network.kind === "NETWORK_ERROR", "fetch failure maps to NETWORK_ERROR");
assert(shouldShowInlineSearchError(network), "network failures stay on the search box");

const structured = searchError("PROVIDER_ERROR");
assert(isSearchError(structured), "searchError helper produces SearchError");
assert(classifySearchError(structured).kind === "PROVIDER_ERROR", "structured errors pass through");
assert(shouldShowInlineSearchError(structured), "provider errors stay on the search box");
assert(!shouldShowInlineSearchError(needsLocation), "needs location is not recoverable inline");

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
    resultCount: 3,
    recommendations: [{
      id: "preview-1",
      rank: 1,
      title: "Preview",
      subtitle: "",
      kind: "stream",
      badge: "Preview",
      explanation: "",
      tags: [],
      meta: [],
      actionLabel: "Preview",
      actionUrl: "",
      provider: "koi",
      preview: true
    }],
    futureProviders: [],
    preview: true
  }),
  "preview watch results stay off the results page"
);

console.log("PASS search status");
