import { KOI_EXAMPLE } from "@/lib/koiExamples";
import type { WatchSubcategory } from "@/lib/types";

export type KoiCapabilityExample = {
  id: string;
  icon: string;
  label: string;
  query: string;
  watchSubcategory?: WatchSubcategory;
  accent?: "places" | "watch" | "events";
};

export const KOI_CAPABILITY_EXAMPLES: KoiCapabilityExample[] = [
  {
    id: "upscale-italian",
    icon: "🍝",
    label: "Upscale Italian near me tonight",
    query: "Find an upscale Italian restaurant near me tonight",
    accent: "places"
  },
  {
    id: "sushi-halfway",
    icon: "🍣",
    label: "Best sushi halfway between Blue Bell and Manayunk",
    query: "Best sushi halfway between Blue Bell and Manayunk",
    accent: "places"
  },
  {
    id: "date-night",
    icon: "✨",
    label: "Fun date night this Friday",
    query: "Fun date night this Friday",
    accent: "places"
  },
  {
    id: "funny-movies",
    icon: "🎬",
    label: "Funny movies like Superbad",
    query: KOI_EXAMPLE.funnyMoviesQuery,
    watchSubcategory: "movies",
    accent: "watch"
  },
  {
    id: "farmers-market",
    icon: "🥕",
    label: "Farmers market near me this weekend",
    query: "Farmers market near me this weekend",
    accent: "events"
  },
  {
    id: "live-music",
    icon: "🎵",
    label: "Live music tonight",
    query: "Live music tonight near me",
    accent: "events"
  }
];

export const KOI_ROTATING_PLACEHOLDERS = [
  "Find an upscale Italian restaurant near me tonight",
  "Best sushi halfway between Blue Bell and Manayunk",
  "Fun date night this Friday",
  "Farmers market near me this weekend",
  "Live music nearby tonight"
];

export const KOI_ROTATING_EXAMPLES: KoiCapabilityExample[] = [
  {
    id: "rotating-upscale-italian",
    icon: "🍝",
    label: "Find an upscale Italian restaurant near me tonight",
    query: "Find an upscale Italian restaurant near me tonight",
    accent: "places"
  },
  {
    id: "rotating-sushi-halfway",
    icon: "🍣",
    label: "Best sushi halfway between Blue Bell and Manayunk",
    query: "Best sushi halfway between Blue Bell and Manayunk",
    accent: "places"
  },
  {
    id: "rotating-date-night",
    icon: "✨",
    label: "Fun date night this Friday",
    query: "Fun date night this Friday",
    accent: "places"
  },
  {
    id: "rotating-farmers-market",
    icon: "🥕",
    label: "Farmers market near me this weekend",
    query: "Farmers market near me this weekend",
    accent: "events"
  },
  {
    id: "rotating-live-music",
    icon: "🎵",
    label: "Live music nearby tonight",
    query: "Live music nearby tonight",
    accent: "events"
  }
];

export const THINKING_PROGRESS_LABELS = {
  places: [
    "Finding locations…",
    "Calculating drive times…",
    "Ranking recommendations…",
    "Building your plan…"
  ],
  watch: ["Understanding your ask…", "Searching streaming picks…", "Ranking recommendations…", "Building your plan…"],
  events: ["Finding locations…", "Checking events…", "Ranking recommendations…", "Building your plan…"]
} as const;

/** One primary pick plus up to three alternatives. */
export const KOI_PICK_DISPLAY_LIMIT = 4;
