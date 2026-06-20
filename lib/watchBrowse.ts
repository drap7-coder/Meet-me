import type { WatchSubcategory } from "@/lib/types";

export type WatchSubcategoryOption = {
  id: WatchSubcategory;
  label: string;
  description: string;
};

export const WATCH_SUBCATEGORIES: WatchSubcategoryOption[] = [
  { id: "movies", label: "Movies", description: "Films, date nights, and movie picks." },
  { id: "tv_shows", label: "TV Shows", description: "Series, binge picks, and what's on TV." },
  { id: "trending", label: "Trending", description: "Popular movies and shows right now." },
  { id: "genres", label: "Genres", description: "Comedy, sci-fi, drama, and more." },
  { id: "streaming", label: "Streaming", description: "What to stream tonight." }
];

export const DEFAULT_WATCH_SUBCATEGORY: WatchSubcategory = "movies";

export const WATCH_EXAMPLE_PROMPTS = [
  "Funny movies like Superbad",
  "Best sci-fi shows from the last 5 years",
  "Trending TV shows tonight",
  "Movies like The Dark Knight"
];

export const WATCH_PROMPTS_BY_SUBCATEGORY: Record<WatchSubcategory, string[]> = {
  movies: ["Funny movies like Superbad", "Movies like The Dark Knight", "Best action movies tonight", "Highly rated dramas"],
  tv_shows: ["Best sci-fi shows from the last 5 years", "Comfort rewatch series", "New TV series to start tonight", "Limited series under 8 episodes"],
  trending: ["Trending TV shows tonight", "Trending movies this week", "What everyone is watching now", "Popular new releases"],
  genres: ["Best sci-fi movies", "Funny comedies tonight", "Scary horror picks", "Romantic movies for date night"],
  streaming: ["What should I stream tonight?", "Where can I stream Interstellar?", "Best movies on streaming tonight", "Easy crowd-pleasers to stream"]
};

export function getWatchSubcategoryLabel(subcategory: WatchSubcategory) {
  return WATCH_SUBCATEGORIES.find((option) => option.id === subcategory)?.label ?? "Watch";
}

export function getWatchSubcategoryDescription(subcategory: WatchSubcategory) {
  return WATCH_SUBCATEGORIES.find((option) => option.id === subcategory)?.description ?? "";
}

export type WatchGenreOption = {
  id: string;
  label: string;
  query: string;
};

export const WATCH_GENRES_BY_SUBCATEGORY: Partial<Record<WatchSubcategory, WatchGenreOption[]>> = {
  movies: [
    { id: "action", label: "Action", query: "Best action movies tonight" },
    { id: "comedy", label: "Comedy", query: "Best comedy movies tonight" },
    { id: "drama", label: "Drama", query: "Best drama movies tonight" },
    { id: "horror", label: "Horror", query: "Best horror movies tonight" },
    { id: "romance", label: "Romance", query: "Best romance movies tonight" },
    { id: "sci-fi", label: "Sci-Fi", query: "Best sci-fi movies tonight" },
    { id: "thriller", label: "Thriller", query: "Best thriller movies tonight" },
    { id: "documentary", label: "Documentary", query: "Best documentary movies tonight" },
    { id: "family", label: "Family", query: "Best family movies tonight" }
  ],
  tv_shows: [
    { id: "action", label: "Action & Adventure", query: "Best action TV shows tonight" },
    { id: "comedy", label: "Comedy", query: "Best comedy TV shows tonight" },
    { id: "drama", label: "Drama", query: "Best drama TV shows tonight" },
    { id: "horror", label: "Mystery & Thriller", query: "Best mystery TV shows tonight" },
    { id: "romance", label: "Romance", query: "Best romance TV shows tonight" },
    { id: "sci-fi", label: "Sci-Fi & Fantasy", query: "Best sci-fi TV shows tonight" },
    { id: "documentary", label: "Documentary", query: "Best documentary series tonight" },
    { id: "family", label: "Family", query: "Best family TV shows tonight" }
  ],
  genres: [
    { id: "comedy", label: "Comedy", query: "Best comedy movies and shows tonight" },
    { id: "sci-fi", label: "Sci-Fi", query: "Best sci-fi movies and shows tonight" },
    { id: "drama", label: "Drama", query: "Best drama movies and shows tonight" },
    { id: "horror", label: "Horror", query: "Best horror movies and shows tonight" },
    { id: "romance", label: "Romance", query: "Best romance movies and shows tonight" },
    { id: "action", label: "Action", query: "Best action movies and shows tonight" },
    { id: "thriller", label: "Thriller", query: "Best thriller movies and shows tonight" },
    { id: "documentary", label: "Documentary", query: "Best documentaries tonight" },
    { id: "family", label: "Family", query: "Best family-friendly picks tonight" }
  ]
};

export function watchSubcategoryHasGenres(subcategory: WatchSubcategory) {
  return (WATCH_GENRES_BY_SUBCATEGORY[subcategory]?.length ?? 0) > 0;
}

export function getWatchGenresForSubcategory(subcategory: WatchSubcategory) {
  return WATCH_GENRES_BY_SUBCATEGORY[subcategory] ?? [];
}

export const WATCH_PLACEHOLDER = "Ask Koi what you want to watch…";

export const EVENTS_EXAMPLE_PROMPTS = [
  "Any comedy shows near Philly this weekend?",
  "Concerts near Hoboken this month",
  "Sports games near me tonight",
  "Local festivals this weekend"
];

export const EVENTS_PLACEHOLDER = "Ask Koi about sports, concerts, festivals, or local happenings…";

export const EVENTS_DESCRIPTION =
  "Sports, concerts, festivals, and local happenings.";

export type EventsCategoryOption = {
  id: string;
  label: string;
  query: string;
};

export type EventsCategoryGroup = {
  id: string;
  label: string;
  description: string;
  options: EventsCategoryOption[];
};

export const EVENTS_CATEGORY_GROUPS: EventsCategoryGroup[] = [
  {
    id: "sports",
    label: "Sports",
    description: "Games, matches, and live sports nearby.",
    options: [
      { id: "live-sports", label: "Live Sports", query: "What live sports are on near me tonight?" },
      { id: "football", label: "Football", query: "Football games near me this weekend" },
      { id: "baseball", label: "Baseball", query: "Baseball games near me this weekend" },
      { id: "soccer", label: "Soccer", query: "Soccer matches near me this weekend" }
    ]
  },
  {
    id: "concerts",
    label: "Concerts",
    description: "Live music and touring acts.",
    options: [
      { id: "concerts", label: "Concerts", query: "Any concerts near me this weekend?" },
      { id: "live-music", label: "Live Music", query: "Live music near me tonight" },
      { id: "touring-acts", label: "Touring Acts", query: "Touring concerts near me this month" }
    ]
  },
  {
    id: "festivals",
    label: "Festivals",
    description: "Festivals, fairs, and outdoor events.",
    options: [
      { id: "festivals", label: "Festivals", query: "Festivals near me this weekend" },
      { id: "food-festivals", label: "Food Festivals", query: "Food festivals near me this month" },
      { id: "outdoor-events", label: "Outdoor Events", query: "Outdoor festivals near me this weekend" }
    ]
  },
  {
    id: "local",
    label: "Local Happenings",
    description: "Comedy, things to do, and nearby plans.",
    options: [
      { id: "comedy", label: "Comedy", query: "Any comedy shows near me this weekend?" },
      { id: "things-to-do", label: "Things To Do", query: "Things to do near me tonight" },
      { id: "weekend-plans", label: "Weekend Plans", query: "What's happening near me this weekend?" }
    ]
  }
];

export const DEFAULT_EVENTS_QUERY = EVENTS_CATEGORY_GROUPS[0].options[0].query;

export function getEventsCategoryGroupForQuery(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return EVENTS_CATEGORY_GROUPS[0];

  for (const group of EVENTS_CATEGORY_GROUPS) {
    if (group.options.some((option) => option.query.trim().toLowerCase() === normalized)) {
      return group;
    }
  }

  if (/\b(?:concert|concerts|live music)\b/i.test(normalized)) {
    return EVENTS_CATEGORY_GROUPS.find((group) => group.id === "concerts") ?? EVENTS_CATEGORY_GROUPS[0];
  }

  if (/\b(?:festival|festivals|fair|fairs)\b/i.test(normalized)) {
    return EVENTS_CATEGORY_GROUPS.find((group) => group.id === "festivals") ?? EVENTS_CATEGORY_GROUPS[0];
  }

  if (/\b(?:game|games|sports|match|matches)\b/i.test(normalized)) {
    return EVENTS_CATEGORY_GROUPS.find((group) => group.id === "sports") ?? EVENTS_CATEGORY_GROUPS[0];
  }

  return EVENTS_CATEGORY_GROUPS.find((group) => group.id === "local") ?? EVENTS_CATEGORY_GROUPS[0];
}
