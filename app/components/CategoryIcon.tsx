import type { VenueCategory } from "@/lib/types";

type Props = {
  category: VenueCategory | string;
  active?: boolean;
  className?: string;
};

export function CategoryIcon({ category, active = false, className = "h-4 w-4" }: Props) {
  const colorClass = active ? "text-ink" : "text-slate";
  const icon = getIconKey(category);

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${colorClass} ${className}`}
      aria-hidden="true"
    >
      {renderIcon(icon)}
    </svg>
  );
}

function getIconKey(category: VenueCategory | string) {
  const value = category.toLowerCase();
  if (["restaurant", "brunch", "dessert"].includes(value)) return "utensils";
  if (value === "coffee") return "coffee";
  if (value === "breweries" || value === "bar") return "beer";
  if (value === "wine_bars") return "wine";
  if (value === "events") return "calendar";
  if (value === "universities") return "graduation";
  if (["sports", "golf", "driving_range", "pickleball", "bowling"].includes(value)) return "trophy";
  if (value === "hotels") return "bed";
  if (["park", "parks", "playgrounds", "scenic_spots", "waterfronts"].includes(value)) return "trees";
  if (["museums", "childrens_museums", "aquariums", "zoos"].includes(value)) return "landmark";
  if (
    [
      "shopping",
      "malls",
      "outlets",
      "thrifting",
      "vintage",
      "antiques",
      "bookstore",
      "home_design",
      "farmers_markets"
    ].includes(value)
  ) {
    return "shopping";
  }
  if (["activities", "escape_rooms", "arcades"].includes(value)) return "compass";
  if (value === "family") return "users";
  return "compass";
}

function renderIcon(icon: string) {
  switch (icon) {
    case "utensils":
      return (
        <>
          <path d="M4 3v7" />
          <path d="M7 3v7" />
          <path d="M4 7h3" />
          <path d="M5.5 10v11" />
          <path d="M15 3v18" />
          <path d="M15 3c3 2 4 5 2 8h-2" />
        </>
      );
    case "coffee":
      return (
        <>
          <path d="M4 8h11v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z" />
          <path d="M15 10h2a3 3 0 0 1 0 6h-2" />
          <path d="M6 2v2" />
          <path d="M10 2v2" />
          <path d="M4 21h14" />
        </>
      );
    case "beer":
      return (
        <>
          <path d="M6 8h9v10a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3Z" />
          <path d="M15 10h2a3 3 0 0 1 0 6h-2" />
          <path d="M8 8V5a2 2 0 0 1 4 0v3" />
          <path d="M10 8V4" />
        </>
      );
    case "wine":
      return (
        <>
          <path d="M8 3h8l-1 8a3 3 0 0 1-6 0Z" />
          <path d="M9 8h6" />
          <path d="M12 14v7" />
          <path d="M9 21h6" />
        </>
      );
    case "calendar":
      return (
        <>
          <rect x="4" y="5" width="16" height="16" rx="2" />
          <path d="M8 3v4" />
          <path d="M16 3v4" />
          <path d="M4 10h16" />
          <path d="M8 14h.01" />
          <path d="M12 14h.01" />
          <path d="M16 14h.01" />
        </>
      );
    case "graduation":
      return (
        <>
          <path d="M3 8 12 4l9 4-9 4Z" />
          <path d="M7 10v5c3 2 7 2 10 0v-5" />
          <path d="M21 8v6" />
        </>
      );
    case "trophy":
      return (
        <>
          <path d="M8 4h8v5a4 4 0 0 1-8 0Z" />
          <path d="M8 6H5a3 3 0 0 0 3 5" />
          <path d="M16 6h3a3 3 0 0 1-3 5" />
          <path d="M12 13v5" />
          <path d="M8 21h8" />
          <path d="M10 18h4" />
        </>
      );
    case "bed":
      return (
        <>
          <path d="M4 4v17" />
          <path d="M20 12v9" />
          <path d="M4 12h16" />
          <path d="M7 8h4a2 2 0 0 1 2 2v2H7Z" />
          <path d="M13 10h4a3 3 0 0 1 3 3" />
        </>
      );
    case "trees":
      return (
        <>
          <path d="M8 19V9" />
          <path d="M5 12 8 5l3 7Z" />
          <path d="M16 21V11" />
          <path d="M12 15 16 6l4 9Z" />
          <path d="M3 21h18" />
        </>
      );
    case "landmark":
      return (
        <>
          <path d="M3 9 12 4l9 5Z" />
          <path d="M5 10v8" />
          <path d="M9 10v8" />
          <path d="M15 10v8" />
          <path d="M19 10v8" />
          <path d="M4 18h16" />
          <path d="M3 21h18" />
        </>
      );
    case "shopping":
      return (
        <>
          <path d="M6 8h12l-1 13H7Z" />
          <path d="M9 8a3 3 0 0 1 6 0" />
          <path d="M9 12h.01" />
          <path d="M15 12h.01" />
        </>
      );
    case "users":
      return (
        <>
          <path d="M16 21v-2a4 4 0 0 0-8 0v2" />
          <circle cx="12" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      );
    default:
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="m15.5 8.5-2 5-5 2 2-5Z" />
        </>
      );
  }
}
