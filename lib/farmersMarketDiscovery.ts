import type { EventResult } from "@/lib/eventResult";
import { formatEventDistanceChip, haversineMilesBetween } from "@/lib/eventDistance";
import {
  farmersMarketCardFromEvent,
  isFarmersMarketEvent,
  pickFarmersMarketEvent
} from "@/lib/eventbriteFarmersMarket";
import { searchPlacesNearMidpoint } from "@/lib/google";
import { fetchEventbriteFoodMarketEvents } from "@/lib/providers/eventbriteEventProvider";
import {
  openTripMapProvider,
  type OpenTripMapCategory,
  type OpenTripMapPlace
} from "@/lib/providers/openTripMapProvider";
import { hasEventbriteFoodMarketSources } from "@/src/config/eventbriteSources";
import { logApiError } from "@/lib/serverLog";
import type { TrendingNearYouCard } from "@/lib/trendingNearYouTypes";
import type { VenueCandidate } from "@/lib/types";

const FARMERS_MARKET_NAME_RE =
  /\b(?:farmers? markets?|farm market|produce market|public market|fresh market|market day|bazaar)\b/i;

const OTM_FARMERS_CATEGORIES: OpenTripMapCategory[] = ["interesting_places", "cultural", "natural"];
const OTM_RADIUS_METERS = 15_000;
const PLACES_RADIUS_METERS = 24_000;

export function isFarmersMarketPlaceName(name: string): boolean {
  return FARMERS_MARKET_NAME_RE.test(name);
}

export function filterOpenTripMapFarmersMarkets(places: OpenTripMapPlace[]): OpenTripMapPlace[] {
  const matches = places.filter(
    (place) =>
      isFarmersMarketPlaceName(place.name) ||
      place.kinds.some((kind) => /\b(?:foods|shops|market)\b/i.test(kind))
  );
  return matches.length ? matches : places.filter((place) => isFarmersMarketPlaceName(place.name));
}

function rankOpenTripMapFarmersMarkets(places: OpenTripMapPlace[]): OpenTripMapPlace[] {
  return places.slice().sort((a, b) => {
    const aNamed = isFarmersMarketPlaceName(a.name) ? 1 : 0;
    const bNamed = isFarmersMarketPlaceName(b.name) ? 1 : 0;
    if (bNamed !== aNamed) return bNamed - aNamed;
    const aRating = a.rating ?? 0;
    const bRating = b.rating ?? 0;
    if (bRating !== aRating) return bRating - aRating;
    const aDist = a.distanceMeters ?? Number.MAX_SAFE_INTEGER;
    const bDist = b.distanceMeters ?? Number.MAX_SAFE_INTEGER;
    return aDist - bDist;
  });
}

function weekendSubtitle(): string {
  return "Worth a visit this weekend";
}

function cardFromOpenTripMap(place: OpenTripMapPlace, latitude: number, longitude: number): TrendingNearYouCard {
  const distanceMiles =
    place.distanceMeters != null
      ? Math.round((place.distanceMeters / 1609.34) * 10) / 10
      : haversineMilesBetween(latitude, longitude, place.lat, place.lng);
  const distanceLabel = formatEventDistanceChip(distanceMiles);

  return {
    id: `farmers-otm-${place.xid}`,
    kind: "farmers_market",
    title: place.name,
    subtitle: [weekendSubtitle(), distanceLabel].filter(Boolean).join(" · "),
    badge: "Farmers Market",
    actionUrl: place.sourceUrl ?? `https://opentripmap.com/en/card/${place.xid}`,
    searchQuery: "Farmers markets near me this weekend"
  };
}

function cardFromPlacesVenue(venue: VenueCandidate): TrendingNearYouCard {
  return {
    id: `farmers-places-${venue.id}`,
    kind: "farmers_market",
    title: venue.name,
    subtitle: [weekendSubtitle(), venue.address.split(",").slice(0, 2).join(", ").trim()]
      .filter(Boolean)
      .join(" · "),
    badge: "Farmers Market",
    actionUrl: venue.googleMapsUri,
    searchQuery: "Farmers markets near me this weekend"
  };
}

async function loadOpenTripMapFarmersMarkets(latitude: number, longitude: number): Promise<OpenTripMapPlace[]> {
  if (!openTripMapProvider.isConfigured()) return [];
  try {
    const places = await openTripMapProvider.discoverNearby({
      origin: { lat: latitude, lng: longitude },
      categories: OTM_FARMERS_CATEGORIES,
      radiusMeters: OTM_RADIUS_METERS,
      limit: 24,
      minRating: 1
    });
    return rankOpenTripMapFarmersMarkets(filterOpenTripMapFarmersMarkets(places));
  } catch (error) {
    logApiError("farmers-market-opentripmap", error);
    return [];
  }
}

async function loadPlacesFarmersMarkets(latitude: number, longitude: number): Promise<VenueCandidate[]> {
  if (!process.env.GOOGLE_MAPS_API_KEY?.trim()) return [];
  try {
    const venues = await searchPlacesNearMidpoint({
      midpoint: { lat: latitude, lng: longitude },
      category: "farmers_markets",
      radiusMeters: PLACES_RADIUS_METERS
    });
    return venues
      .slice()
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.reviewCount - a.reviewCount);
  } catch (error) {
    logApiError("farmers-market-places-fallback", error);
    return [];
  }
}

/** Eventbrite is optional enrichment — never called unless food_markets sources are configured. */
async function loadEventbriteFarmersMarketEvents(
  latitude: number,
  longitude: number
): Promise<EventResult[]> {
  if (!hasEventbriteFoodMarketSources()) return [];
  try {
    const events = await fetchEventbriteFoodMarketEvents(latitude, longitude);
    return events.filter(isFarmersMarketEvent);
  } catch (error) {
    logApiError("farmers-market-eventbrite-enrichment", error);
    return [];
  }
}

export type FarmersMarketDiscoveryResult = {
  card: TrendingNearYouCard | null;
  /** True only when Eventbrite food_markets sources exist and a fetch was attempted. */
  eventbriteFetchAttempted: boolean;
};

/**
 * Farmers Markets discovery for Trending Near You and similar surfaces.
 * OpenTripMap primary → places fallback → Eventbrite enrichment when authorized.
 */
export async function discoverFarmersMarketPick(
  latitude: number,
  longitude: number
): Promise<FarmersMarketDiscoveryResult> {
  const eventbriteFetchAttempted = hasEventbriteFoodMarketSources();

  const [otmPlaces, eventbriteEvents] = await Promise.all([
    loadOpenTripMapFarmersMarkets(latitude, longitude),
    eventbriteFetchAttempted ? loadEventbriteFarmersMarketEvents(latitude, longitude) : Promise.resolve([])
  ]);

  const otmPick = otmPlaces[0] ?? null;
  if (otmPick) {
    return { card: cardFromOpenTripMap(otmPick, latitude, longitude), eventbriteFetchAttempted };
  }

  const eventPick = pickFarmersMarketEvent(eventbriteEvents);
  if (eventPick) {
    return { card: farmersMarketCardFromEvent(eventPick), eventbriteFetchAttempted };
  }

  const places = await loadPlacesFarmersMarkets(latitude, longitude);
  const placesPick = places[0] ?? null;
  if (placesPick) {
    return { card: cardFromPlacesVenue(placesPick), eventbriteFetchAttempted };
  }

  return { card: null, eventbriteFetchAttempted };
}

/** @deprecated Use discoverFarmersMarketPick — kept for callers that only need the card. */
export async function fetchFarmersMarketTrendingCard(
  latitude: number,
  longitude: number
): Promise<TrendingNearYouCard | null> {
  const result = await discoverFarmersMarketPick(latitude, longitude);
  return result.card;
}
