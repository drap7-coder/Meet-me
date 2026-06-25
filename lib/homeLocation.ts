import type { CurrentLocationContext } from "@/lib/currentLocation";
import { shortLocationLabel } from "@/lib/geolocation";
import { formatLocationStatusLabel, parseLocationStatusLabel, type LocationUiState } from "@/lib/locationInput";
import { getSavedUserLocation } from "@/lib/savedUserLocation";

export function readStoredLocationSnapshot() {
  const stored = getSavedUserLocation();
  if (!stored?.locationA?.trim()) {
    return {
      savedLocation: { locationA: "" } as CurrentLocationContext,
      savedUserAddress: "",
      locationStatus: ""
    };
  }

  const address = stored.locationA.trim();
  if (stored.locationACoordinates) {
    return {
      savedLocation: {
        locationA: address,
        locationAPlaceId: stored.locationAPlaceId,
        locationACoordinates: stored.locationACoordinates
      },
      savedUserAddress: address,
      locationStatus: formatLocationStatusLabel(shortLocationLabel(address))
    };
  }

  return {
    savedLocation: {
      locationA: address,
      locationAPlaceId: stored.locationAPlaceId
    },
    savedUserAddress: address,
    locationStatus: formatLocationStatusLabel(shortLocationLabel(address))
  };
}

export function restoreStoredLocation(setters: {
  setSavedLocation: (value: CurrentLocationContext) => void;
  setSavedUserAddress: (value: string) => void;
  setLocationStatus: (value: string) => void;
}) {
  const snapshot = readStoredLocationSnapshot();
  setters.setSavedLocation(snapshot.savedLocation);
  setters.setSavedUserAddress(snapshot.savedUserAddress);
  if (snapshot.locationStatus) setters.setLocationStatus(snapshot.locationStatus);
}

export function resolveLocationChipLabel(
  savedLocation: CurrentLocationContext,
  savedUserAddress: string,
  locationStatus: string,
  locationUiState: LocationUiState
) {
  const raw = savedLocation.locationA?.trim() || savedUserAddress.trim();
  if (raw) {
    const label = shortLocationLabel(raw);
    if (label && label !== "you") return label;
    if (locationUiState === "browser_success" || savedLocation.locationACoordinates) {
      return "Current location";
    }
  }

  if (locationStatus) {
    const parsed = parseLocationStatusLabel(locationStatus);
    if (parsed && parsed !== "you") return parsed;
  }

  if (locationUiState === "browser_success" || savedLocation.locationACoordinates) {
    return "Current location";
  }

  return "";
}

export function hasHomeLocationSaved(
  locationContext: CurrentLocationContext,
  savedUserAddress: string,
  savedLocation: CurrentLocationContext,
  formLocationA: string
) {
  if (locationContext.locationACoordinates) return true;

  return Boolean(
    savedUserAddress.trim() ||
      savedLocation.locationA?.trim() ||
      formLocationA.trim()
  );
}
