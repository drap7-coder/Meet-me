"use client";

import { track } from "@vercel/analytics";

type EventName =
  | "search_started"
  | "search_completed"
  | "place_card_viewed"
  | "place_selected"
  | "directions_clicked"
  | "share_link_created"
  | "share_link_opened"
  | "calendar_invite_created"
  | "venue_action_clicked"
  | "weather_viewed"
  | "watch_events_opened"
  | "watch_events_completed"
  | "watch_events_card_viewed"
  | "watch_events_card_expanded"
  | "watch_events_action_clicked"
  | "event_search_completed"
  | "event_card_viewed"
  | "event_card_clicked"
  | "weekend_trending_dismissed"
  | "weekend_trending_browse_all"
  | "weekend_trending_event_clicked"
  | "top_pick_primary_clicked"
  | "top_pick_secondary_clicked"
  | "halfway_mode_selected"
  | "spot_mode_selected"
  | "streaming_mode_selected"
  | "events_mode_selected"
  | "halfway_search_submitted"
  | "halfway_result_clicked"
  | "halfway_result_shared"
  | "halfway_share_opened"
  | "halfway_recipient_search_started"
  | "travel_mode_changed";

type EventProperties = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(name: EventName, properties: EventProperties = {}) {
  try {
    track(name, {
      ...stripEmpty(properties),
      deviceType: getDeviceType()
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[analytics] ${name} was not tracked.`, error);
    }
  }
}

function stripEmpty(properties: EventProperties) {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
}

function getDeviceType() {
  if (typeof window === "undefined") return "server";
  return window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop";
}
