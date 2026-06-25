import {
  classifySearchError,
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

console.log("PASS search status");
