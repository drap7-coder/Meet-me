import type { SearchHalfwayRequest } from "@/lib/types";

export type CurrentLocationContext = Pick<
  SearchHalfwayRequest,
  "locationA" | "locationAPlaceId" | "locationACoordinates"
>;

export function looksLikeCurrentLocationQuery(query: string) {
  return (
    /\b(?:near|around|by|close to)\s+(?:me|my location|current location|here)\b/i.test(query) ||
    /\bnearby\b/i.test(query)
  );
}

export function isCurrentLocationReference(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;

  return (
    normalized === "me" ||
    normalized === "near me" ||
    normalized === "my location" ||
    normalized === "current location" ||
    normalized === "my current location" ||
    normalized === "here" ||
    normalized === "nearby" ||
    /^near\s+me\b/.test(normalized) ||
    /^around\s+me\b/.test(normalized)
  );
}

export function resolveCurrentLocationInForm(
  nextForm: SearchHalfwayRequest,
  context?: CurrentLocationContext
): SearchHalfwayRequest {
  if (!isCurrentLocationReference(nextForm.locationA)) return nextForm;

  if (context?.locationACoordinates) {
    const contextLabel = typeof context.locationA === "string" ? context.locationA.trim() : "";
    return {
      ...nextForm,
      locationA: contextLabel || nextForm.locationA.trim() || "Current location",
      locationAPlaceId: context.locationAPlaceId ?? nextForm.locationAPlaceId,
      locationACoordinates: context.locationACoordinates,
      searchMode: "single"
    };
  }

  return {
    ...nextForm,
    locationA: "me",
    searchMode: "single"
  };
}

/** True when an event search can resolve an origin (coords or geocodable address). */
export function eventSearchLocationReady(form: SearchHalfwayRequest): boolean {
  if (form.locationACoordinates) return true;
  const address = form.locationA.trim();
  return Boolean(address) && !isCurrentLocationReference(address);
}

export function needsCurrentLocationResolution(form: SearchHalfwayRequest) {
  return isCurrentLocationReference(form.locationA) && !form.locationACoordinates;
}
