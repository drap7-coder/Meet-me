import type { EventResult } from "@/lib/eventResult";
import type { LatLng } from "@/lib/types";

/**
 * Event distance policy (keep event cards cheap):
 *
 * - Show straight-line distance only on event cards, e.g. "4 mi away".
 * - Prefer Ticketmaster `distance` when the API returns it (latlong searches).
 * - Otherwise derive miles with Haversine from event venue coordinates.
 * - If neither is available, hide the distance chip.
 * - "Get directions" is an outbound Google Maps search link only — no Routes API.
 *
 * Google Routes / drive-time is reserved for places (restaurants, bars, coffee,
 * Meet Halfway). Never call Routes when rendering or ranking Ticketmaster events.
 */

export function haversineMilesBetween(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRad(destLat - originLat);
  const dLng = toRad(destLng - originLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(originLat)) * Math.cos(toRad(destLat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earthRadiusMiles * c * 10) / 10;
}

export function haversineMilesFromOrigin(origin: LatLng, destination: LatLng): number {
  return haversineMilesBetween(origin.lat, origin.lng, destination.lat, destination.lng);
}

/** Apply straight-line distance to an event without calling Google Routes. */
export function withEventStraightLineDistance(
  event: EventResult,
  originLat: number,
  originLng: number
): EventResult {
  if (event.distance != null) return event;
  if (event.latitude == null || event.longitude == null) return event;
  if (!Number.isFinite(originLat) || !Number.isFinite(originLng)) return event;

  return {
    ...event,
    distance: haversineMilesBetween(originLat, originLng, event.latitude, event.longitude)
  };
}

/** User-facing chip text for event cards; null when distance is unknown. */
export function formatEventDistanceChip(distanceMiles: number | null | undefined): string | null {
  if (typeof distanceMiles !== "number" || !Number.isFinite(distanceMiles)) return null;
  return distanceMiles < 1 ? "Under 1 mi" : `${Math.round(distanceMiles)} mi away`;
}
