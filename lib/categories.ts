import type { VenueCategory } from "@/lib/types";

export const CATEGORIES: Array<{
  id: VenueCategory;
  label: string;
  searchTerm: string;
}> = [
  { id: "coffee", label: "Coffee", searchTerm: "coffee shops" },
  { id: "restaurant", label: "Food", searchTerm: "restaurants" },
  { id: "bar", label: "Drinks", searchTerm: "bars" },
  { id: "bookstore", label: "Bookstores", searchTerm: "bookstores" },
  { id: "park", label: "Parks", searchTerm: "parks" },
  { id: "driving_range", label: "Activities", searchTerm: "driving ranges" },
  { id: "dessert", label: "Dessert", searchTerm: "dessert shops" },
  { id: "custom", label: "Something else", searchTerm: "" }
];

export function getCategoryLabel(category: VenueCategory) {
  return CATEGORIES.find((item) => item.id === category)?.label ?? "Custom";
}

export function getCategorySearchTerm(category: VenueCategory, customQuery?: string) {
  if (category === "custom") return customQuery?.trim() || "places to meet";
  return CATEGORIES.find((item) => item.id === category)?.searchTerm ?? "places to meet";
}
