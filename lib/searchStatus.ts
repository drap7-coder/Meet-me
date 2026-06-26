import type { SearchHalfwayResponse, WatchEventsResult } from "@/lib/types";

export type SearchErrorKind =
  | "INVALID_LOCATION"
  | "NO_RESULTS"
  | "PROVIDER_ERROR"
  | "NETWORK_ERROR"
  | "NEEDS_LOCATION";

export type SearchError = {
  kind: SearchErrorKind;
  message: string;
};

export type SearchStatus = "idle" | "loading" | "success" | "empty" | "error" | "invalid";

export const SEARCH_ERROR_MESSAGES: Record<SearchErrorKind, string> = {
  INVALID_LOCATION: "I couldn't find that place. Try a city, address, or nearby landmark.",
  NO_RESULTS: "I couldn't find anything useful for that. Try a place, activity, show, or event.",
  PROVIDER_ERROR: "I couldn't find anything useful for that. Try a place, activity, show, or event.",
  NETWORK_ERROR: "I couldn't find anything useful for that. Try a place, activity, show, or event.",
  NEEDS_LOCATION: "Add your location to search nearby."
};

export function isSearchError(value: unknown): value is SearchError {
  if (!value || typeof value !== "object") return false;
  const candidate = value as SearchError;
  return (
    typeof candidate.kind === "string" &&
    typeof candidate.message === "string" &&
    candidate.kind in SEARCH_ERROR_MESSAGES
  );
}

export function searchError(kind: SearchErrorKind, message = SEARCH_ERROR_MESSAGES[kind]): SearchError {
  return { kind, message };
}

export function classifySearchError(input: unknown): SearchError {
  if (isSearchError(input)) {
    return {
      kind: input.kind,
      message: SEARCH_ERROR_MESSAGES[input.kind] ?? input.message
    };
  }

  const raw =
    input instanceof Error
      ? input.message
      : typeof input === "string"
        ? input
        : typeof input === "object" && input && "message" in input && typeof (input as { message: unknown }).message === "string"
          ? (input as { message: string }).message
          : "Search failed.";
  const lower = raw.toLowerCase();

  if (
    lower.includes("geocod") ||
    lower.includes("could not reverse geocode") ||
    lower.includes("could not find that place") ||
    lower.includes("could not find that location")
  ) {
    return searchError("INVALID_LOCATION");
  }

  if (
    lower.includes("add your location") ||
    lower.includes("enter a location") ||
    lower.includes("enter both locations") ||
    lower.includes("needs location") ||
    lower.includes("search near that kind of place") ||
    lower.includes("turn on location") ||
    lower.includes("where should koi search")
  ) {
    return searchError("NEEDS_LOCATION");
  }

  if (lower.includes("could not understand") || lower.includes("couldn't understand")) {
    return searchError("NO_RESULTS");
  }

  if (
    lower.includes("network") ||
    lower.includes("failed to fetch") ||
    lower.includes("connection") ||
    lower.includes("offline")
  ) {
    return searchError("NETWORK_ERROR");
  }

  if (lower.includes("no results") || lower.includes("no matches") || lower.includes("no great spots")) {
    return searchError("NO_RESULTS");
  }

  if (raw.startsWith("Could not ") || raw.includes('Could not geocode "')) {
    return searchError("INVALID_LOCATION");
  }

  return searchError("PROVIDER_ERROR");
}

export function isLocationSearchError(error: SearchError | null | undefined): boolean {
  return error?.kind === "INVALID_LOCATION" || error?.kind === "NEEDS_LOCATION";
}

export function shouldShowInlineSearchError(error: SearchError | null | undefined): boolean {
  if (!error) return false;
  return error.kind !== "NEEDS_LOCATION";
}

export function statusForSearchError(error: SearchError): SearchStatus {
  if (error.kind === "NO_RESULTS") return "invalid";
  if (error.kind === "NEEDS_LOCATION" || error.kind === "INVALID_LOCATION") return "invalid";
  return "error";
}

/** Recoverable ask failures that should keep the search box in place with a retry message. */
export function isRecoverableSearchError(error: SearchError | null | undefined): boolean {
  return shouldShowInlineSearchError(error);
}

export function isEmptyPlacesResults(data: SearchHalfwayResponse): boolean {
  return data.venues.length === 0 && !(data.events?.length ?? 0);
}

export function isEmptyWatchResults(data: WatchEventsResult): boolean {
  if (data.preview) return true;
  return data.recommendations.length === 0;
}
