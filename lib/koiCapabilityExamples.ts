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
    id: "pizza-halfway",
    icon: "🍕",
    label: "Best pizza halfway between us",
    query: "Best pizza halfway between us",
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
    id: "festivals",
    icon: "🎡",
    label: "Festivals this weekend",
    query: "Festivals near me this weekend",
    accent: "events"
  },
  {
    id: "sports-bar",
    icon: "🏀",
    label: "Sports bar before the Phillies game",
    query: "Sports bar before the Phillies game",
    accent: "places"
  },
  {
    id: "coffee-work",
    icon: "☕",
    label: "Quiet coffee shop to work from",
    query: "Quiet coffee shop to work from",
    accent: "places"
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
  "Best pizza halfway between us",
  "Funny movies like Superbad",
  "Festivals this weekend",
  "Sports bar before the Phillies game",
  "Coffee near Penn Station",
  "Meeting Sarah at 7 then a movie after"
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
