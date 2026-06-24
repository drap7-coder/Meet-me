import { searchLocalEvents, isEventDiscoveryConfigured } from "@/lib/eventDiscovery";
import { buildLiveEventsFromPlaces, canUseLiveEventsSearch } from "@/lib/eventsPlaces";
import { detectLocalHappeningsSubcategory, getLocalHappeningsOption } from "@/lib/localHappenings";
import { classifyLocalEventProfile } from "@/lib/localEventIntent";
import { eventResultsToWatchRecommendations } from "@/lib/placesWithEvents";
import type { SearchHalfwayRequest, WatchEventsRecommendation, WatchEventsResult } from "@/lib/types";
import { EVENTS_DESCRIPTION } from "@/lib/watchBrowse";
import {
  EVENTS_LIVE_MESSAGE,
  EVENTS_PREVIEW_MESSAGE,
  EVENTS_TITLE,
  classifyEventsIntent,
  extractWatchEventsLocation,
  extractWatchEventsTimeframe,
  extractWatchEventsTopic,
  buildEventsPreviewRecommendations
} from "@/lib/watchEvents";

export async function buildEventsResult(
  query: string,
  locationContext?: SearchHalfwayRequest
): Promise<WatchEventsResult> {
  const trimmed = query.trim();
  const intent = classifyEventsIntent(trimmed);
  const extractedLocation = extractWatchEventsLocation(trimmed);
  const formLocation = readFormLocation(locationContext);
  const location = extractedLocation || formLocation;
  const timeframe = extractWatchEventsTimeframe(trimmed);
  const topic = extractWatchEventsTopic(trimmed, intent);
  const localSubcategory = detectLocalHappeningsSubcategory(trimmed);
  const profile = classifyLocalEventProfile(trimmed);

  let liveRecommendations: WatchEventsRecommendation[] | null = null;

  if (locationContext && isEventDiscoveryConfigured()) {
    try {
      const geocoded = await resolveSearchCoordinates(locationContext);
      if (geocoded) {
        const ticketmasterEvents = await searchLocalEvents({
          query: trimmed,
          latitude: geocoded.lat,
          longitude: geocoded.lng,
          profile
        });
        if (ticketmasterEvents.length) {
          liveRecommendations = eventResultsToWatchRecommendations(ticketmasterEvents, trimmed);
        }
      }
    } catch {
      // Fall through to venue-based live search or preview.
    }
  }

  if (!liveRecommendations?.length && locationContext && canUseLiveEventsSearch(locationContext)) {
    liveRecommendations = await buildLiveEventsFromPlaces({
      query: trimmed,
      intent,
      topic,
      timeframe,
      locationContext
    });
  }

  const isLive = Boolean(liveRecommendations?.length);
  const recommendations =
    liveRecommendations ??
    buildEventsPreviewRecommendations({
      query: trimmed,
      intent,
      location,
      timeframe,
      topic
    });

  return {
    botMode: "events",
    query: trimmed,
    title: EVENTS_TITLE,
    description: EVENTS_DESCRIPTION,
    message: isLive ? EVENTS_LIVE_MESSAGE : EVENTS_PREVIEW_MESSAGE,
    intent,
    intentLabel: intentLabel(intent, localSubcategory),
    location,
    timeframe,
    topic,
    contextSummary: buildEventsContextSummary(location, timeframe, topic, isLive),
    resultCount: recommendations.length,
    recommendations,
    futureProviders: isLive ? ["Ticketmaster"] : ["Ticketmaster", "SeatGeek", "ESPN", "SportsDataIO"],
    preview: !isLive,
    hasMore: false
  };
}

async function resolveSearchCoordinates(locationContext: SearchHalfwayRequest) {
  const { googlePlacesProvider } = await import("@/lib/providers/googlePlacesProvider");
  const locationA = locationContext.locationA.trim();
  if (!locationA) return null;

  if (locationContext.locationACoordinates) {
    return locationContext.locationACoordinates;
  }

  const geocoded = await googlePlacesProvider.geocodeAddress(locationA, locationContext.locationAPlaceId);
  return geocoded.location;
}

function readFormLocation(form?: SearchHalfwayRequest) {
  if (!form) return "";
  const searchMode = form.searchMode ?? "midpoint";
  const locationA = form.locationA.trim();
  const locationB = form.locationB.trim();
  if (searchMode === "midpoint" && locationA && locationB) {
    return `${locationA} and ${locationB}`;
  }
  return locationA;
}

function intentLabel(
  intent: WatchEventsResult["intent"],
  localSubcategory: ReturnType<typeof detectLocalHappeningsSubcategory> = null
) {
  if (localSubcategory) {
    return getLocalHappeningsOption(localSubcategory).label;
  }

  switch (intent) {
    case "sports":
      return "Sports";
    case "live_event":
      return "Live events";
    case "things_to_do":
      return "Local happenings";
    default:
      return "Events";
  }
}

function buildEventsContextSummary(location: string, timeframe: string, topic: string, isLive: boolean) {
  const parts = [isLive ? "Live events" : "Location-based"];
  if (topic) parts.push(topic);
  if (location) parts.push(location);
  if (timeframe) parts.push(timeframe);
  return parts.join(" · ");
}
