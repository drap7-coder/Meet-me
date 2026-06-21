import type { KoiBrowseOption } from "@/lib/koiBrowse";
import { formatHalfwayExample, KOI_EXAMPLE } from "@/lib/koiExamples";

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
    id: "specialty-dinner",
    label: "Dinner halfway",
    lookingFor: "Dinner",
    query: KOI_EXAMPLE.halfwayQuery,
    cardIcon: "🍽️",
    cardTitle: "Dinner halfway",
    cardSubtitle: "Find a restaurant that works for both"
  },
  {
    id: "specialty-brewery",
    label: "Brewery halfway",
    lookingFor: "Brewery",
    query: KOI_EXAMPLE.breweryHalfwayQuery,
    cardIcon: "🍺",
    cardTitle: "Brewery halfway",
    cardSubtitle: "Drinks midway between two spots"
  },
  {
    id: "specialty-lunch",
    label: "Lunch between offices",
    lookingFor: "Lunch",
    query: KOI_EXAMPLE.lunchHalfwayQuery,
    cardIcon: "🥪",
    cardTitle: "Lunch between offices",
    cardSubtitle: "Quick lunch meetup between workplaces"
  },
  {
    id: "specialty-happy-hour",
    label: "Happy hour halfway",
    lookingFor: "Happy hour",
    query: formatHalfwayExample("Happy hour"),
    cardIcon: "🍸",
    cardTitle: "Happy hour halfway",
    cardSubtitle: "Drinks that work for both commutes"
  }
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
    cardAccent: "places"
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
