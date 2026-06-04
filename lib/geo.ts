import type { LatLng } from "@/lib/types";

export function calculateMidpoint(a: LatLng, b: LatLng): LatLng {
  return {
    lat: (a.lat + b.lat) / 2,
    lng: (a.lng + b.lng) / 2
  };
}

export function haversineMiles(a: LatLng, b: LatLng) {
  const earthRadiusMiles = 3958.8;
  const lat1 = degreesToRadians(a.lat);
  const lat2 = degreesToRadians(b.lat);
  const deltaLat = degreesToRadians(b.lat - a.lat);
  const deltaLng = degreesToRadians(b.lng - a.lng);
  const h =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return 2 * earthRadiusMiles * Math.asin(Math.sqrt(h));
}

export function estimateSearchRadiusMeters(a: LatLng, b: LatLng) {
  const milesApart = haversineMiles(a, b);
  const radiusMiles = Math.min(Math.max(milesApart * 0.18, 3), 18);
  return Math.round(radiusMiles * 1609.34);
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}
