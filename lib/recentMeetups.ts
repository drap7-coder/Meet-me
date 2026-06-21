import { getCategoryLabel } from "@/lib/categories";
import { shortLocationLabel } from "@/lib/geolocation";
import type { MeetupMode, Preference, SearchHalfwayRequest, SearchHalfwayResponse, SearchMode, VenueCategory } from "@/lib/types";

export const RECENT_MEETUPS_KEY = "meetMeHalfway.recentMeetups.v1";

export type RecentMeetup = {
  id: string;
  originA: string;
  originAPlaceId?: string;
  originB: string;
  originBPlaceId?: string;
  category: VenueCategory;
  searchMode?: SearchMode;
  meetupMode?: MeetupMode;
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

export function buildMeetupKey(meetup: Pick<RecentMeetup, "originA" | "originB" | "category"> & { searchMode?: SearchMode; meetupMode?: MeetupMode }) {
  return [meetup.originA, meetup.originB, meetup.category, meetup.searchMode ?? "midpoint", meetup.meetupMode ?? "single"]
    .map((value) => value.trim().toLowerCase())
    .join("|");
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
    id: `${buildMeetupKey({ originA, originB, category: results.category, searchMode: results.searchMode, meetupMode: results.meetupMode })}-${timestamp}`,
    originA,
    originAPlaceId: form.locationAPlaceId ?? results.originA.placeId,
    originB,
    originBPlaceId: form.locationBPlaceId ?? results.originB.placeId,
    category: results.category,
    searchMode: results.searchMode,
    meetupMode: results.meetupMode,
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
    searchMode: meetup.searchMode ?? "midpoint",
    meetupMode: meetup.meetupMode,
    customQuery: meetup.customQuery ?? "",
    preferences: meetup.preferences ?? []
  };
}

export function getRecentMeetupCategoryLabel(meetup: RecentMeetup) {
  if (meetup.category === "custom") return meetup.customQuery?.trim() || "Something else";
  return getCategoryLabel(meetup.category);
}

export type RecentMeetupCardDisplay = {
  icon: string;
  title: string;
  subtitle: string;
};

const RECENT_MEETUP_ICONS: Partial<Record<VenueCategory, string>> = {
  american: "🍔",
  antiques: "🏺",
  arcades: "🕹️",
  activities: "🎯",
  aquariums: "🐠",
  asian: "🥡",
  bar: "🍺",
  bbq: "🍖",
  bookstore: "📚",
  bowling: "🎳",
  breakfast: "🥞",
  breweries: "🍺",
  brunch: "🥞",
  business_finance: "💼",
  childrens_museums: "🧒",
  cigar_lounges: "🚬",
  cocktail_bars: "🍸",
  coffee: "☕",
  college_towns: "🏘️",
  colleges: "🎓",
  custom: "✨",
  dessert: "🍰",
  distilleries: "🥃",
  dog_parks: "🐕",
  downtowns: "🏙️",
  driving_range: "⛳",
  engineering_stem: "🔬",
  escape_rooms: "🔐",
  events: "🎟️",
  family: "👨‍👩‍👧",
  farmers_markets: "🧺",
  gardens: "🌸",
  golf: "⛳",
  health_pre_med: "🩺",
  hiking: "🥾",
  home_design: "🛋️",
  hotels: "🏨",
  indian: "🍛",
  italian: "🍝",
  liberal_arts: "📖",
  lounges: "🛋️",
  malls: "🛍️",
  mediterranean: "🥙",
  mexican: "🌮",
  museums: "🏛️",
  nature_preserves: "🌲",
  outlets: "🛍️",
  park: "🌳",
  pickleball: "🏓",
  picnic_areas: "🧺",
  pizza: "🍕",
  playgrounds: "🛝",
  pubs: "🍺",
  restaurant: "🍽️",
  rooftop_bars: "🌆",
  scenic_spots: "📸",
  scenic_walks: "🚶",
  seafood: "🦞",
  shopping: "🛍️",
  small_towns: "🏡",
  sports: "🏀",
  sports_bars: "📺",
  steakhouse: "🥩",
  sushi: "🍣",
  thai: "🍜",
  thrifting: "👕",
  trails: "🥾",
  universities: "🎓",
  urban_campuses: "🏫",
  vegan: "🥗",
  vintage: "👗",
  walkable_main_streets: "🚶",
  waterfronts: "🌊",
  wine_bars: "🍷",
  zoos: "🦁"
};

function inferRecentMeetupIconFromQuery(query: string) {
  const value = query.toLowerCase();
  if (/\b(coffee|espresso|latte|cafe)\b/.test(value)) return "☕";
  if (/\b(pizza|pizzeria)\b/.test(value)) return "🍕";
  if (/\b(brewer|beer|bar|pub|drink)\b/.test(value)) return "🍺";
  if (/\b(wine|cocktail|distiller)\b/.test(value)) return "🍷";
  if (/\b(restaurant|food|dinner|lunch|brunch|eat)\b/.test(value)) return "🍽️";
  if (/\b(shop|mall|store)\b/.test(value)) return "🛍️";
  if (/\b(park|hike|trail|outdoor|garden)\b/.test(value)) return "🌳";
  if (/\b(movie|stream|watch|tv|show)\b/.test(value)) return "📺";
  if (/\b(sport|game)\b/.test(value)) return "🏈";
  if (/\b(hotel|stay)\b/.test(value)) return "🏨";
  if (/\b(halfway|between|meetup|midpoint)\b/.test(value)) return "🤝";
  return undefined;
}

function getRecentMeetupIcon(meetup: RecentMeetup) {
  const categoryIcon = RECENT_MEETUP_ICONS[meetup.category];
  if (categoryIcon) return categoryIcon;

  const queryIcon = inferRecentMeetupIconFromQuery(meetup.customQuery ?? "");
  if (queryIcon) return queryIcon;

  if (meetup.searchMode !== "single") return "🤝";
  return "📍";
}

export function getRecentMeetupCardDisplay(meetup: RecentMeetup): RecentMeetupCardDisplay {
  const title =
    meetup.searchMode === "single"
      ? `Near ${shortLocationLabel(meetup.originA)}`
      : `${shortLocationLabel(meetup.originA)} ↔ ${shortLocationLabel(meetup.originB)}`;

  const modeLabel = "Single place";
  const subtitle = `${getRecentMeetupCategoryLabel(meetup)} · ${modeLabel} · ${formatRecentMeetupDate(meetup.timestamp)}`;

  return {
    icon: getRecentMeetupIcon(meetup),
    title,
    subtitle
  };
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
