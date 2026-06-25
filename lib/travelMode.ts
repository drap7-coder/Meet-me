import type { TravelMode } from "@/lib/types";

export const DEFAULT_TRAVEL_MODE: TravelMode = "auto";

export const TRAVEL_MODE_STORAGE_KEY = "meetMeHalfway.travelMode.v1";

export type TravelModeOption = {
  id: TravelMode;
  /** Compact label used in the selector trigger and menu. */
  label: string;
  /** Emoji glyph shown next to the label. */
  icon: string;
  /** Short helper copy shown in the dropdown menu. */
  description: string;
  /** Disabled options are visible but not selectable (e.g. "Coming Soon"). */
  disabled?: boolean;
  /** Optional trailing note rendered in the menu (e.g. "Coming Soon"). */
  note?: string;
};

export const EV_TRAVEL_ICON = "⚡";

export const TRAVEL_MODE_OPTIONS: TravelModeOption[] = [
  { id: "auto", label: "Auto", icon: "✨", description: "Let Koi pick the best ranking" },
  { id: "drive", label: "Drive", icon: "🚗", description: "Driving distances and times" },
  { id: "ev", label: "EV", icon: EV_TRAVEL_ICON, description: "EV-friendly spots with nearby charging" },
  { id: "walk", label: "Walk", icon: "🚶", description: "Favor nearby, walkable spots" },
  { id: "bike", label: "Bike", icon: "🚲", description: "Favor reasonable bike rides" },
  { id: "transit", label: "Transit", icon: "🚆", description: "Public transit — ranking favors reachable stops" }
];

const TRAVEL_MODE_IDS = new Set<TravelMode>(TRAVEL_MODE_OPTIONS.map((option) => option.id));

export function isTravelMode(value: unknown): value is TravelMode {
  return typeof value === "string" && TRAVEL_MODE_IDS.has(value as TravelMode);
}

export function travelModeOption(mode: TravelMode | null | undefined): TravelModeOption {
  return TRAVEL_MODE_OPTIONS.find((option) => option.id === mode) ?? TRAVEL_MODE_OPTIONS[0];
}

/** Compact trigger label, e.g. "🚗 Drive". */
export function travelModeChipLabel(mode: TravelMode | null | undefined): string {
  const option = travelModeOption(mode);
  return `${option.icon} ${option.label}`;
}

/**
 * Collapse user-facing modes into the ranking strategy that actually changes
 * scoring. `auto`/`drive`/`ev` share drive behavior today; `transit` is a no-op.
 */
export type TravelRankingStrategy = "drive" | "walk" | "bike";

export function travelRankingStrategy(mode: TravelMode | null | undefined): TravelRankingStrategy {
  switch (mode) {
    case "walk":
      return "walk";
    case "bike":
      return "bike";
    case "transit":
      // Transit-specific routing not wired yet — neutral ranking for now (selectable in UI).
      return "drive";
    case "auto":
    case "drive":
    case "ev":
    default:
      return "drive";
  }
}

export function getSavedTravelMode(): TravelMode {
  if (typeof window === "undefined") return DEFAULT_TRAVEL_MODE;
  try {
    const raw = window.localStorage.getItem(TRAVEL_MODE_STORAGE_KEY);
    if (isTravelMode(raw)) return raw;
  } catch {
    // Ignore storage access errors (private mode, disabled storage, etc.).
  }
  return DEFAULT_TRAVEL_MODE;
}

export function saveTravelMode(mode: TravelMode) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TRAVEL_MODE_STORAGE_KEY, mode);
  } catch {
    // Ignore storage write failures.
  }
}
