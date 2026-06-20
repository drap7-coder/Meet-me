import { buildLiveEventsFromPlaces, canUseLiveEventsSearch } from "@/lib/eventsPlaces";
import type { SearchHalfwayRequest, WatchEventsResult } from "@/lib/types";
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
  const liveRecommendations =
    locationContext && canUseLiveEventsSearch(locationContext)
      ? await buildLiveEventsFromPlaces({
          query: trimmed,
          intent,
          topic,
          timeframe,
          locationContext
        })
      : null;
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
    intentLabel: intentLabel(intent),
    location,
    timeframe,
    topic,
    contextSummary: buildEventsContextSummary(location, timeframe, topic, isLive),
    resultCount: recommendations.length,
    recommendations,
    futureProviders: ["Ticketmaster", "SeatGeek", "ESPN", "SportsDataIO"],
    preview: !isLive,
    hasMore: false
  };
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

function intentLabel(intent: WatchEventsResult["intent"]) {
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
  const parts = [isLive ? "Live venues" : "Location-based"];
  if (topic) parts.push(topic);
  if (location) parts.push(location);
  if (timeframe) parts.push(timeframe);
  return parts.join(" · ");
}
