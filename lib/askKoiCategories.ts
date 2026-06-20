import { CATEGORY_GROUPS, type PrimaryCategoryId } from "@/lib/categories";
import type { VenueCategory } from "@/lib/types";

export type AskKoiPlaceTab = "food" | "drinks" | "coffee" | "activities";

export type AskKoiPlaceTabConfig = {
  id: AskKoiPlaceTab;
  label: string;
  description: string;
  groupId: PrimaryCategoryId;
  subcategoryFilter?: VenueCategory[];
  excludeSubcategories?: VenueCategory[];
};

export const ASK_KOI_PLACE_TABS: AskKoiPlaceTabConfig[] = [
  {
    id: "food",
    label: "Food",
    description: "Restaurants, cuisines, and dinner plans.",
    groupId: "food",
    excludeSubcategories: ["coffee"]
  },
  {
    id: "drinks",
    label: "Drinks",
    description: "Breweries, wine bars, cocktails, and pubs.",
    groupId: "drinks"
  },
  {
    id: "coffee",
    label: "Coffee",
    description: "Coffee shops, cafes, and easy meetup spots.",
    groupId: "food",
    subcategoryFilter: ["coffee"]
  },
  {
    id: "activities",
    label: "Activities",
    description: "Bowling, golf, games, and things to do.",
    groupId: "activities"
  }
];

export function getAskKoiPlaceTabConfig(tab: AskKoiPlaceTab) {
  return ASK_KOI_PLACE_TABS.find((item) => item.id === tab) ?? ASK_KOI_PLACE_TABS[0];
}

export function getAskKoiPlaceOptions(tab: AskKoiPlaceTab) {
  const config = getAskKoiPlaceTabConfig(tab);
  const group = CATEGORY_GROUPS.find((item) => item.id === config.groupId);
  if (!group) return [];

  const subcategories = group.subcategories.filter((item) => {
    if (config.subcategoryFilter) return config.subcategoryFilter.includes(item.id);
    if (config.excludeSubcategories?.includes(item.id)) return false;
    return true;
  });

  return subcategories.map((item) => ({
    label: item.label,
    query: buildPlaceOptionQuery(item.label)
  }));
}

function buildPlaceOptionQuery(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("coffee")) return "Find coffee near me";
  if (normalized.includes("shop")) return `Find a ${normalized} near me`;
  return `Find ${normalized} near me`;
}
