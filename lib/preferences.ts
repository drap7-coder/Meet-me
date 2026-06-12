import type { Preference } from "@/lib/types";

export const PREFERENCES: Array<{
  id: Preference;
  label: string;
  helper: string;
  badge: string;
  terms: string[];
}> = [
  {
    id: "walkable",
    label: "Walkable",
    helper: "Bias toward areas with places to stroll nearby.",
    badge: "Most Walkable",
    terms: ["walkable", "main street", "main st", "town center", "shops", "shopping", "restaurants nearby", "village"]
  },
  {
    id: "easy_parking",
    label: "Easy Parking",
    helper: "Bias toward places with easier parking access.",
    badge: "Easiest Parking",
    terms: ["parking", "parking lot", "garage", "free parking", "easy parking", "valet"]
  },
  {
    id: "downtown",
    label: "Downtown",
    helper: "Bias toward town centers and main streets.",
    badge: "Best Downtown Match",
    terms: ["downtown", "town center", "main street", "main st", "village", "central business district", "center city"]
  },
  {
    id: "outdoor_seating",
    label: "Outdoor Seating",
    helper: "Bias toward patios and outdoor dining.",
    badge: "Best Outdoor Seating",
    terms: ["outdoor seating", "patio", "terrace", "garden", "beer garden", "rooftop", "outdoor"]
  },
  {
    id: "upscale",
    label: "Upscale",
    helper: "Bias toward more polished, elevated places.",
    badge: "Most Upscale Match",
    terms: ["upscale", "fine dining", "cocktail bar", "premium", "elegant", "lounge", "steakhouse"]
  },
  {
    id: "family_friendly",
    label: "Family Friendly",
    helper: "Bias toward casual, approachable places.",
    badge: "Best Family-Friendly Option",
    terms: ["family friendly", "casual", "kid friendly", "kids", "relaxed", "diner", "family"]
  },
  {
    id: "scenic",
    label: "Scenic",
    helper: "Bias toward views, waterfronts, gardens, and memorable settings.",
    badge: "Most Scenic",
    terms: ["scenic", "view", "overlook", "waterfront", "riverwalk", "marina", "garden", "botanical", "park"]
  },
  {
    id: "quick_stop",
    label: "Quick Stop",
    helper: "Bias toward easy, low-commitment places.",
    badge: "Best Quick Stop",
    terms: ["quick", "casual", "cafe", "coffee", "grab and go", "easy", "counter service", "parking"]
  }
];

export function getPreferenceLabel(preference: Preference) {
  return PREFERENCES.find((item) => item.id === preference)?.label ?? preference;
}

export function getPreferenceBadge(preference: Preference) {
  return PREFERENCES.find((item) => item.id === preference)?.badge ?? "Preference Match";
}

export function parsePreferences(value: string | null): Preference[] {
  if (!value) return [];
  const valid = new Set(PREFERENCES.map((item) => item.id));
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is Preference => valid.has(item as Preference));
}

export function preferenceLabels(preferences: Preference[]) {
  return preferences.map(getPreferenceLabel);
}
