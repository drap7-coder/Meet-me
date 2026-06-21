import type { KoiBrowseOption } from "@/lib/koiBrowse";

export type HalfwayChip = {
  id: string;
  label: string;
  query: string;
  lookingFor: string;
  cardIcon: string;
  cardTitle: string;
  cardSubtitle: string;
};

/** Featured halfway examples — Koi's specialty module and emphasized trending. */
export const KOI_SPECIALTY_CHIPS: HalfwayChip[] = [
  {
    id: "specialty-coffee",
    label: "Coffee halfway",
    lookingFor: "Coffee",
    query: "Coffee halfway between Cherry Hill and King of Prussia",
    cardIcon: "☕",
    cardTitle: "Coffee halfway",
    cardSubtitle: "Meet for coffee between two places",
  },
  {
    id: "specialty-dinner",
    label: "Dinner halfway",
    lookingFor: "Dinner",
    query: "Dinner halfway between us",
    cardIcon: "🍽️",
    cardTitle: "Dinner halfway",
    cardSubtitle: "Find a restaurant that works for both",
  },
  {
    id: "specialty-happy-hour",
    label: "Happy hour halfway",
    lookingFor: "Happy hour",
    query: "Happy hour halfway between us",
    cardIcon: "🍺",
    cardTitle: "Happy hour halfway",
    cardSubtitle: "Drinks midway between two spots",
  },
  {
    id: "specialty-lunch",
    label: "Lunch between offices",
    lookingFor: "Lunch",
    query: "Lunch halfway between our offices",
    cardIcon: "🥪",
    cardTitle: "Lunch between offices",
    cardSubtitle: "Quick lunch meetup between workplaces",
  },
];

export function isHalfwayQuery(query: string) {
  const value = query.trim().toLowerCase();
  return /\b(halfway|between|midpoint|meet in the middle|meetup between)\b/.test(value);
}

export function toHalfwayBrowseOption(chip: HalfwayChip): KoiBrowseOption {
  return {
    id: chip.id,
    label: chip.label,
    query: chip.query,
    cardIcon: chip.cardIcon,
    cardTitle: chip.cardTitle,
    cardSubtitle: chip.cardSubtitle,
    cardAccent: "places",
  };
}

export function buildHalfwaySearchQuery(locationA: string, locationB: string, lookingFor: string) {
  const a = locationA.trim();
  const b = locationB.trim();
  const what = lookingFor.trim();
  if (!a || !b || !what) return "";
  return `${what} halfway between ${a} and ${b}`;
}

export function extractLookingForFromHalfwayQuery(query: string) {
  const trimmed = query.trim();
  const match = trimmed.match(/^(.+?)\s+halfway\b/i);
  if (match?.[1]) return match[1].trim();
  if (/\bbetween\b/i.test(trimmed)) return "Meetup";
  return trimmed.split(/\s+/).slice(0, 2).join(" ");
}
