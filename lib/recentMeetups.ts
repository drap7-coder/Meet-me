import { getCategoryLabel } from "@/lib/categories";
import type { Preference, SearchHalfwayRequest, SearchHalfwayResponse, VenueCategory } from "@/lib/types";

export const RECENT_MEETUPS_KEY = "meetMeHalfway.recentMeetups.v1";

export type RecentMeetup = {
  id: string;
  originA: string;
  originAPlaceId?: string;
  originB: string;
  originBPlaceId?: string;
  category: VenueCategory;
  customQuery?: string;
  preferences?: Preference[];
  timestamp: number;
  shareUrl: string;
};

export function getRecentMeetups() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(RECENT_MEETUPS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecentMeetup).slice(0, 10);
  } catch {
    return [];
  }
}

export function saveRecentMeetup(meetup: RecentMeetup) {
  if (typeof window === "undefined") return [];

  const meetupKey = buildMeetupKey(meetup);
  const next = [
    meetup,
    ...getRecentMeetups().filter((item) => buildMeetupKey(item) !== meetupKey)
  ].slice(0, 10);

  window.localStorage.setItem(RECENT_MEETUPS_KEY, JSON.stringify(next));
  return next;
}

export function clearRecentMeetups() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(RECENT_MEETUPS_KEY);
}

export function buildMeetupKey(meetup: Pick<RecentMeetup, "originA" | "originB" | "category">) {
  return [meetup.originA, meetup.originB, meetup.category].map((value) => value.trim().toLowerCase()).join("|");
}

export function formatRecentMeetupDate(timestamp: number) {
  const now = new Date();
  const date = new Date(timestamp);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const daysAgo = Math.max(0, Math.round((startOfToday - startOfDate) / 86_400_000));

  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  if (daysAgo < 7) return `${daysAgo} days ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function createRecentMeetup(
  form: SearchHalfwayRequest,
  results: SearchHalfwayResponse,
  shareUrl: string
): RecentMeetup {
  const originA = results.originA.formattedAddress;
  const originB = results.originB.formattedAddress;
  const timestamp = Date.now();

  return {
    id: `${buildMeetupKey({ originA, originB, category: results.category })}-${timestamp}`,
    originA,
    originAPlaceId: form.locationAPlaceId ?? results.originA.placeId,
    originB,
    originBPlaceId: form.locationBPlaceId ?? results.originB.placeId,
    category: results.category,
    customQuery: form.customQuery,
    preferences: form.preferences ?? [],
    timestamp,
    shareUrl
  };
}

export function recentMeetupToForm(meetup: RecentMeetup): SearchHalfwayRequest {
  return {
    locationA: meetup.originA,
    locationAPlaceId: meetup.originAPlaceId,
    locationB: meetup.originB,
    locationBPlaceId: meetup.originBPlaceId,
    category: meetup.category,
    customQuery: meetup.customQuery ?? "",
    preferences: meetup.preferences ?? []
  };
}

export function getRecentMeetupCategoryLabel(meetup: RecentMeetup) {
  if (meetup.category === "custom") return meetup.customQuery?.trim() || "Something else";
  return getCategoryLabel(meetup.category);
}

function isRecentMeetup(value: unknown): value is RecentMeetup {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<RecentMeetup>;
  return (
    typeof item.id === "string" &&
    typeof item.originA === "string" &&
    typeof item.originB === "string" &&
    typeof item.category === "string" &&
    typeof item.timestamp === "number" &&
    typeof item.shareUrl === "string"
  );
}
