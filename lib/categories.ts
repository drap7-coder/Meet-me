import type { VenueCategory } from "@/lib/types";

export const CATEGORIES: Array<{
  id: VenueCategory;
  label: string;
  searchTerm: string;
}> = [
  { id: "restaurant", label: "Restaurant", searchTerm: "restaurants" },
  { id: "bar", label: "Bar", searchTerm: "bars" },
  { id: "coffee", label: "Coffee", searchTerm: "coffee shops" },
  { id: "bookstore", label: "Bookstore", searchTerm: "bookstores" },
  { id: "driving_range", label: "Driving range", searchTerm: "driving ranges" },
  { id: "park", label: "Park", searchTerm: "parks" },
  { id: "dessert", label: "Dessert", searchTerm: "dessert shops" },
  { id: "custom", label: "Custom", searchTerm: "" }
];

export function getCategoryLabel(category: VenueCategory) {
  return CATEGORIES.find((item) => item.id === category)?.label ?? "Custom";
}

export function getCategorySearchTerm(category: VenueCategory, customQuery?: string) {
  if (category === "custom") return customQuery?.trim() || "places to meet";
  return CATEGORIES.find((item) => item.id === category)?.searchTerm ?? "places to meet";
}
