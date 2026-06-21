import type { VenueCategory, WatchEventsRecommendation } from "@/lib/types";

function buildGoogleSearchUrl(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export type LocalHappeningsSubcategory =
  | "street_fairs"
  | "festivals"
  | "farmers_markets"
  | "art_walks"
  | "flea_markets"
  | "pop_ups"
  | "food_drink_events"
  | "seasonal_markets";

export type LocalHappeningsOption = {
  id: LocalHappeningsSubcategory;
  label: string;
  query: string;
  accent: "events" | "market";
  schedule: "recurring" | "one_off";
};

export const LOCAL_HAPPENINGS_OPTIONS: LocalHappeningsOption[] = [
  {
    id: "street_fairs",
    label: "Street Fairs",
    query: "Street fairs near me this weekend",
    accent: "events",
    schedule: "one_off"
  },
  {
    id: "festivals",
    label: "Festivals",
    query: "Festivals near me this weekend",
    accent: "events",
    schedule: "one_off"
  },
  {
    id: "farmers_markets",
    label: "Farmers Markets",
    query: "Farmers markets near me today",
    accent: "market",
    schedule: "recurring"
  },
  {
    id: "art_walks",
    label: "Art Walks",
    query: "Art walks near me this month",
    accent: "events",
    schedule: "one_off"
  },
  {
    id: "flea_markets",
    label: "Flea Markets",
    query: "Flea markets open this Saturday",
    accent: "market",
    schedule: "recurring"
  },
  {
    id: "pop_ups",
    label: "Pop-Ups",
    query: "Pop-up events near me this weekend",
    accent: "events",
    schedule: "one_off"
  },
  {
    id: "food_drink_events",
    label: "Food & Drink Events",
    query: "Food festivals near Philadelphia",
    accent: "events",
    schedule: "one_off"
  },
  {
    id: "seasonal_markets",
    label: "Seasonal Markets",
    query: "Holiday markets near me",
    accent: "market",
    schedule: "recurring"
  }
];

export const LOCAL_HAPPENINGS_EXAMPLE_PROMPTS = LOCAL_HAPPENINGS_OPTIONS.map((option) => option.query);

const SUBCATEGORY_PATTERNS: Array<[LocalHappeningsSubcategory, RegExp]> = [
  ["farmers_markets", /\b(?:farmers? markets?|farm market|produce market)\b/i],
  ["flea_markets", /\b(?:flea markets?|swap meet|antique market)\b/i],
  ["seasonal_markets", /\b(?:holiday market|christmas market|seasonal market|winter market|summer market)\b/i],
  ["street_fairs", /\b(?:street fairs?|block party|community fair)\b/i],
  ["art_walks", /\b(?:art walks?|gallery walk|first friday)\b/i],
  ["pop_ups", /\b(?:pop[- ]?ups?|popup shop|temporary shop)\b/i],
  ["food_drink_events", /\b(?:food festivals?|food truck festival|tasting event|beer festival|wine festival|food and drink)\b/i],
  ["festivals", /\b(?:festival|festivals|fair|fairs)\b/i]
];

const LOCAL_HAPPENINGS_PATTERN =
  /\b(?:street fairs?|farmers? markets?|flea markets?|art walks?|pop[- ]?ups?|food festivals?|holiday markets?|seasonal markets?|community fairs?|block parties?|swap meets?|market day)\b/i;

export function isLocalHappeningsQuery(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return false;
  return LOCAL_HAPPENINGS_PATTERN.test(trimmed) || Boolean(detectLocalHappeningsSubcategory(trimmed));
}

export function detectLocalHappeningsSubcategory(query: string): LocalHappeningsSubcategory | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  for (const option of LOCAL_HAPPENINGS_OPTIONS) {
    if (option.query.trim().toLowerCase() === trimmed.toLowerCase()) {
      return option.id;
    }
  }

  for (const [subcategory, pattern] of SUBCATEGORY_PATTERNS) {
    if (pattern.test(trimmed)) return subcategory;
  }

  return null;
}

export function getLocalHappeningsOption(subcategory: LocalHappeningsSubcategory) {
  return LOCAL_HAPPENINGS_OPTIONS.find((option) => option.id === subcategory) ?? LOCAL_HAPPENINGS_OPTIONS[0];
}

export function isRecurringLocalHappenings(subcategory: LocalHappeningsSubcategory) {
  return getLocalHappeningsOption(subcategory).schedule === "recurring";
}

export function localHappeningsTopic(subcategory: LocalHappeningsSubcategory) {
  return getLocalHappeningsOption(subcategory).label.toLowerCase();
}

export function resolveLocalHappeningsPlacesSearch(
  subcategory: LocalHappeningsSubcategory
): { category: VenueCategory; customQuery?: string } {
  switch (subcategory) {
    case "farmers_markets":
      return { category: "farmers_markets" };
    case "flea_markets":
      return { category: "custom", customQuery: "flea market antique market" };
    case "street_fairs":
      return { category: "custom", customQuery: "street fair community festival" };
    case "art_walks":
      return { category: "custom", customQuery: "art walk gallery district" };
    case "pop_ups":
      return { category: "custom", customQuery: "pop up shop market event" };
    case "food_drink_events":
      return { category: "custom", customQuery: "food festival tasting event" };
    case "seasonal_markets":
      return { category: "custom", customQuery: "holiday market seasonal market" };
    case "festivals":
    default:
      return { category: "custom", customQuery: "festival fair outdoor event" };
  }
}

export function extractLocalHappeningsTimeframe(query: string, subcategory?: LocalHappeningsSubcategory | null) {
  const patterns: Array<[RegExp, string]> = [
    [/\bthis weekend\b/i, "This weekend"],
    [/\bnext weekend\b/i, "Next weekend"],
    [/\btonight\b/i, "Tonight"],
    [/\btoday\b/i, "Today"],
    [/\btomorrow\b/i, "Tomorrow"],
    [/\bevery saturday\b/i, "Every Saturday"],
    [/\bevery sunday\b/i, "Every Sunday"],
    [/\bthis saturday\b/i, "This Saturday"],
    [/\bthis sunday\b/i, "This Sunday"],
    [/\bopen this saturday\b/i, "This Saturday"],
    [/\bopen this sunday\b/i, "This Sunday"],
    [/\bsaturday\b/i, "Saturday"],
    [/\bsunday\b/i, "Sunday"],
    [/\bthis month\b/i, "This month"],
    [/\bupcoming\b/i, "Upcoming"],
    [/\bseasonal\b/i, "Seasonal"]
  ];

  for (const [pattern, label] of patterns) {
    if (pattern.test(query)) return label;
  }

  if (subcategory && isRecurringLocalHappenings(subcategory)) {
    return "Next occurrence";
  }

  return "Upcoming";
}

export function buildLocalHappeningsScheduleMeta(
  subcategory: LocalHappeningsSubcategory,
  timeframe: string,
  location: string
) {
  const option = getLocalHappeningsOption(subcategory);
  const area = location === "near you" || !location ? "Near you" : location;
  const meta: WatchEventsRecommendation["meta"] = [
    { label: "Location", value: area },
    { label: "When", value: timeframe }
  ];

  if (option.schedule === "recurring") {
    meta.push({
      label: "Schedule",
      value: timeframe.includes("Saturday")
        ? "Weekly · check day and hours"
        : "Recurring · seasonal hours vary"
    });
    meta.push({ label: "Next up", value: inferNextOccurrence(timeframe) });
  } else {
    meta.push({ label: "Date", value: timeframe });
    meta.push({ label: "Time", value: "Check event listing for start time" });
  }

  return meta;
}

function inferNextOccurrence(timeframe: string) {
  if (/saturday/i.test(timeframe)) return "Next Saturday · confirm hours locally";
  if (/sunday/i.test(timeframe)) return "Next Sunday · confirm hours locally";
  if (/today/i.test(timeframe)) return "Today · confirm open hours";
  if (/weekend/i.test(timeframe)) return "This weekend · confirm dates locally";
  return "Check local listings for the next date";
}

export function buildLocalHappeningsPreviewRecommendations({
  query,
  subcategory,
  location,
  timeframe
}: {
  query: string;
  subcategory: LocalHappeningsSubcategory;
  location: string;
  timeframe: string;
}): WatchEventsRecommendation[] {
  const option = getLocalHappeningsOption(subcategory);
  const area = location === "near you" || !location ? "near you" : `in ${location}`;
  const searchQuery = `${option.label.toLowerCase()} ${location || "near me"} ${timeframe}`.trim();
  const scheduleMeta = buildLocalHappeningsScheduleMeta(subcategory, timeframe, location || "near you");
  const recurring = option.schedule === "recurring";

  return [
    {
      id: `local-happenings-${subcategory}-1`,
      rank: 1,
      title: `${option.label} ${area}`,
      subtitle: `${timeframe} · Search suggestion`,
      kind: "things_to_do",
      badge: recurring ? "Next occurrence" : "Upcoming event",
      explanation: recurring
        ? `Koi read this as a recurring ${option.label.toLowerCase()} search ${area}. These markets often run weekly or seasonally — confirm the next date and hours before you go.`
        : `Koi read this as an upcoming ${option.label.toLowerCase()} search ${area} for ${timeframe.toLowerCase()}. One-off events need an exact date and start time from local listings.`,
      tags: [option.label, timeframe, recurring ? "Recurring" : "One-off"],
      meta: scheduleMeta,
      actionLabel: "Search local listings",
      actionUrl: buildGoogleSearchUrl(searchQuery),
      provider: "Search suggestion",
      preview: true
    },
    {
      id: `local-happenings-${subcategory}-2`,
      rank: 2,
      title: recurring ? "Seasonal schedule backup" : "Same-weekend backup",
      subtitle: recurring ? "Useful when hours change by season" : "Another option if the first event is full or rained out",
      kind: "things_to_do",
      badge: "Backup plan",
      explanation: recurring
        ? "Farmers markets and flea markets often shift hours by season. A second search helps confirm what's open on your target day."
        : "Festivals and street fairs can sell out or move for weather. A backup search keeps the plan moving.",
      tags: [option.label, "Backup", location ? "Nearby" : "Local"],
      meta: [
        { label: "Location", value: location || "Near you" },
        { label: "When", value: timeframe },
        { label: "Distance", value: "Add your location for drive time" }
      ],
      actionLabel: "Search backup options",
      actionUrl: buildGoogleSearchUrl(`${option.label.toLowerCase()} ${location || "near me"} ${recurring ? "hours schedule" : timeframe}`),
      provider: "Search suggestion",
      preview: true
    },
    {
      id: `local-happenings-${subcategory}-3`,
      rank: 3,
      title: "Nearby calendar search",
      subtitle: "Broader local happenings in the same window",
      kind: "things_to_do",
      badge: "Explore more",
      explanation:
        "When you want more than one option, a wider local search helps you compare markets, fairs, and pop-ups worth leaving the house for.",
      tags: ["Local happenings", timeframe, "Explore"],
      meta: [
        { label: "Location", value: location || "Near you" },
        { label: "When", value: timeframe },
        { label: "Type", value: option.label }
      ],
      actionLabel: "Browse local events",
      actionUrl: buildGoogleSearchUrl(`local events ${option.label.toLowerCase()} ${location || "near me"} ${timeframe}`),
      provider: "Search suggestion",
      preview: true
    }
  ];
}

export function buildLocalHappeningsLiveMeta({
  subcategory,
  timeframe,
  address,
  driveTime,
  openNow
}: {
  subcategory: LocalHappeningsSubcategory;
  timeframe: string;
  address: string;
  driveTime: string;
  openNow?: boolean | null;
}) {
  const option = getLocalHappeningsOption(subcategory);
  const meta: WatchEventsRecommendation["meta"] = [
    { label: "Location", value: address || "Nearby" },
    { label: "Distance", value: driveTime },
    { label: "When", value: timeframe }
  ];

  if (option.schedule === "recurring") {
    meta.push({ label: "Schedule", value: inferNextOccurrence(timeframe) });
    if (openNow === true) meta.push({ label: "Hours", value: "Open now" });
    if (openNow === false) meta.push({ label: "Hours", value: "Closed now · check next date" });
  } else {
    meta.push({ label: "Date", value: timeframe });
    meta.push({ label: "Time", value: "Check venue for start time" });
  }

  return meta;
}
