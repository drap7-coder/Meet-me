import type { CurrentLocationContext } from "@/lib/currentLocation";
import type { SearchHalfwayRequest } from "@/lib/types";

/**
 * Destination-mode searches geocode against a temporary landmark/venue string.
 * That value must stay on the API payload only — never in session form state
 * or localStorage (home location is set only via PersistentLocationBar → Change).
 */
export type SearchSubmitOptions = {
  preserveSavedHomeLocation?: boolean;
};

export function formForSessionAfterSearch(
  searchForm: SearchHalfwayRequest,
  savedHome: CurrentLocationContext,
  options?: SearchSubmitOptions
): SearchHalfwayRequest {
  if (!options?.preserveSavedHomeLocation) return searchForm;

  return {
    ...searchForm,
    locationA: savedHome.locationA ?? "",
    locationAPlaceId: savedHome.locationAPlaceId,
    locationACoordinates: savedHome.locationACoordinates
  };
}

/**
 * Returns true when a form edit should update the user's saved home location.
 * Search submits must never pass through this path with a destination string.
 */
export function shouldPersistHomeLocationUpdate(
  nextLocationA: string,
  previousLocationA: string,
  options?: { allowPersist?: boolean }
): boolean {
  if (options?.allowPersist === false) return false;
  const next = nextLocationA.trim();
  const prev = previousLocationA.trim();
  if (!next || next === prev) return false;
  return true;
}
