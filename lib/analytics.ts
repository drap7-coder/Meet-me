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
  | "weather_viewed";

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
