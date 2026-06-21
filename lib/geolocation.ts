import type { LatLng } from "@/lib/types";

export async function getCurrentPosition(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    const geolocation = window.navigator?.geolocation;
    if (!geolocation) {
      reject(new Error("Geolocation is not supported"));
      return;
    }

    geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      reject,
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  });
}

export async function reverseGeocodeCoordinates(coordinates: LatLng) {
  const fallbackLabel = `Current location: ${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`;
  try {
    const response = await fetch("/api/geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coordinates)
    });
    const data = await response.json();
    if (response.ok) {
      return {
        locationA: (data.formattedAddress as string) || fallbackLabel,
        locationAPlaceId: data.placeId as string | undefined
      };
    }
  } catch {
    // fall through
  }
  return { locationA: fallbackLabel, locationAPlaceId: undefined };
}

export async function geocodeManualLocation(input: string) {
  const trimmed = input.trim();
  const response = await fetch("/api/geocode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address: trimmed })
  });
  const data = (await response.json()) as {
    formattedAddress?: string;
    placeId?: string;
    location?: LatLng;
    lat?: number;
    lng?: number;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "Geocoding failed.");
  }

  const lat = data.location?.lat ?? data.lat;
  const lng = data.location?.lng ?? data.lng;
  if (typeof lat !== "number" || typeof lng !== "number") {
    throw new Error("Geocoding failed.");
  }

  return {
    locationA: data.formattedAddress?.trim() || trimmed,
    locationAPlaceId: data.placeId,
    locationACoordinates: { lat, lng } satisfies LatLng
  };
}

export function shortLocationLabel(address: string) {
  const trimmed = address.trim();
  if (!trimmed) return "you";
  const first = trimmed.split(",")[0]?.trim();
  return first || trimmed;
}
