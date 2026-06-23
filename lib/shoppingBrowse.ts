import type { VenueCategory } from "@/lib/types";

export type ShoppingSubcategory = {
  id: string;
  label: string;
  category: VenueCategory;
  query: string;
};

export const SHOPPING_SUBCATEGORIES: ShoppingSubcategory[] = [
  { id: "jewelry", label: "Jewelry", category: "shopping", query: "Jewelry stores near me" },
  { id: "thrifting", label: "Thrift", category: "thrifting", query: "Thrift stores near me" },
  { id: "furniture", label: "Furniture", category: "home_design", query: "Furniture stores near me" },
  { id: "antiques", label: "Antiques", category: "antiques", query: "Antique shops near me" },
  { id: "vintage", label: "Vintage", category: "vintage", query: "Vintage shops near me" },
  { id: "malls", label: "Malls", category: "malls", query: "Shopping malls near me" },
  { id: "outlets", label: "Outlets", category: "outlets", query: "Outlet malls near me" },
  { id: "bookstore", label: "Bookstores", category: "bookstore", query: "Bookstores near me" },
  { id: "home_design", label: "Home & Design", category: "home_design", query: "Home decor stores near me" }
];

export const SHOPPING_CATEGORIES = new Set<VenueCategory>(
  SHOPPING_SUBCATEGORIES.map((item) => item.category)
);

export const DEFAULT_SHOPPING_SUBCATEGORY = SHOPPING_SUBCATEGORIES[0];

export function isShoppingCategory(category: VenueCategory) {
  return SHOPPING_CATEGORIES.has(category);
}

export function shoppingQueryForLocation(query: string, location: string) {
  const trimmed = location.trim() || "me";
  return query.replace("near me", `near ${trimmed}`);
}
