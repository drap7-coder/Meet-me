import { CATEGORY_GROUPS, type PrimaryCategoryId } from "@/lib/categories";

export type AskKoiOption = {
  label: string;
  query: string;
};

export type AskKoiOptionGroup = {
  label: string;
  description: string;
  options: AskKoiOption[];
};

const PLACE_GROUP_CONFIG: Array<{
  groupId: PrimaryCategoryId;
  label: string;
  description: string;
  excludeSubcategories?: string[];
  subcategoryFilter?: string[];
}> = [
  {
    groupId: "food",
    label: "Food",
    description: "Restaurants, cuisines, and dinner plans.",
    excludeSubcategories: ["coffee"]
  },
  {
    groupId: "drinks",
    label: "Drinks",
    description: "Breweries, wine bars, cocktails, and pubs."
  },
  {
    groupId: "food",
    label: "Coffee",
    description: "Coffee shops, cafes, and easy meetup spots.",
    subcategoryFilter: ["coffee"]
  },
  {
    groupId: "activities",
    label: "Activities",
    description: "Bowling, golf, games, and things to do."
  }
];

function buildPlaceOptionQuery(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("coffee")) return "Find coffee near me";
  if (normalized.includes("shop")) return `Find a ${normalized} near me`;
  return `Find ${normalized} near me`;
}

export const PLACE_UI_GROUPS: AskKoiOptionGroup[] = PLACE_GROUP_CONFIG.map((config) => {
  const group = CATEGORY_GROUPS.find((item) => item.id === config.groupId);
  const subcategories =
    group?.subcategories.filter((item) => {
      if (config.subcategoryFilter) return config.subcategoryFilter.includes(item.id);
      if (config.excludeSubcategories?.includes(item.id)) return false;
      return true;
    }) ?? [];

  return {
    label: config.label,
    description: config.description,
    options: subcategories.map((item) => ({
      label: item.label,
      query: buildPlaceOptionQuery(item.label)
    }))
  };
});
