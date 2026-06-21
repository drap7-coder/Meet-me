import type { CurrentLocationContext } from "@/lib/currentLocation";

export const SAVED_USER_LOCATION_KEY = "meetMeHalfway.savedUserLocation.v1";

export type SavedUserLocation = CurrentLocationContext;

function isCoordinates(value: unknown): value is NonNullable<SavedUserLocation["locationACoordinates"]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const coords = value as { lat?: unknown; lng?: unknown };
  return typeof coords.lat === "number" && typeof coords.lng === "number";
}

function isSavedUserLocation(value: unknown): value is SavedUserLocation {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const location = value as Partial<SavedUserLocation>;
  return typeof location.locationA === "string" && location.locationA.trim().length > 0;
}

export function getSavedUserLocation(): SavedUserLocation | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(SAVED_USER_LOCATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isSavedUserLocation(parsed)) return null;
    return {
      locationA: parsed.locationA.trim(),
      locationAPlaceId: typeof parsed.locationAPlaceId === "string" ? parsed.locationAPlaceId : undefined,
      locationACoordinates: isCoordinates(parsed.locationACoordinates) ? parsed.locationACoordinates : undefined
    };
  } catch {
    return null;
  }
}

export function saveUserLocation(location: SavedUserLocation) {
  if (typeof window === "undefined") return;
  if (!location.locationA?.trim()) return;

  const next: SavedUserLocation = {
    locationA: location.locationA.trim(),
    ...(location.locationAPlaceId ? { locationAPlaceId: location.locationAPlaceId } : {}),
    ...(location.locationACoordinates ? { locationACoordinates: location.locationACoordinates } : {})
  };

  window.localStorage.setItem(SAVED_USER_LOCATION_KEY, JSON.stringify(next));
}

export function mergeSavedUserLocation(update: SavedUserLocation) {
  const current = getSavedUserLocation();
  saveUserLocation({
    locationA: update.locationA?.trim() || current?.locationA || "",
    locationAPlaceId: update.locationAPlaceId ?? current?.locationAPlaceId,
    locationACoordinates: update.locationACoordinates ?? current?.locationACoordinates
  });
}

export function clearSavedUserLocation() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SAVED_USER_LOCATION_KEY);
}
