import { searchLocalEvents } from "@/lib/eventDiscovery";
import type { EventResult } from "@/lib/eventResult";
import { classifyLocalEventProfile, shouldFetchTicketmasterEvents } from "@/lib/localEventIntent";
import type { SearchHalfwayRequest, SearchHalfwayResponse } from "@/lib/types";

export async function enrichPlacesResponseWithEvents(
  response: SearchHalfwayResponse,
  query: string,
  request: SearchHalfwayRequest
): Promise<SearchHalfwayResponse> {
  if (!shouldFetchTicketmasterEvents(query, request.category)) {
    return response;
  }

  try {
    const profile = classifyLocalEventProfile(query);
    const events = await searchLocalEvents({
      query,
      latitude: response.originA.location.lat,
      longitude: response.originA.location.lng,
      profile
    });

    if (!events.length) return response;

    return {
      ...response,
      events,
      eventProfile: profile
    };
  } catch {
    return response;
  }
}

export function eventResultsToWatchRecommendations(events: EventResult[], query: string) {
  return events.map((event, index) => ({
    id: `${event.source}-${event.id}`,
    rank: index + 1,
    title: event.title,
    subtitle: [formatEventWhen(event.startTime), event.venue, event.city].filter(Boolean).join(" · "),
    kind: "live_event" as const,
    badge: index === 0 ? "Top event pick" : "Event option",
    explanation: `Koi found a live ${event.category.toLowerCase()} option that matches your ask for “${query}”.`,
    tags: [event.category, event.city, event.state].filter(Boolean),
    meta: [
      { label: "When", value: formatEventWhen(event.startTime) },
      { label: "Venue", value: event.venue },
      { label: "Category", value: event.category },
      ...(event.distance != null ? [{ label: "Distance", value: `${event.distance.toFixed(1)} mi` }] : [])
    ],
    actionLabel: event.ticketUrl ? "Get tickets" : "View details",
    actionUrl: event.ticketUrl || "",
    provider: event.source === "ticketmaster" ? "Ticketmaster" : event.source,
    preview: false,
    posterUrl: event.imageUrl
  }));
}

function formatEventWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}
