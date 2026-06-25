import type { HeroPopularSearch } from "@/app/components/home/HeroPopularSearches";
import { KOI_EXAMPLE } from "@/lib/koiExamples";

type Season = "winter" | "spring" | "summer" | "fall";

function seasonForDate(date: Date): Season {
  const month = date.getMonth(); // 0–11
  if (month === 11 || month <= 1) return "winter";
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  return "fall";
}

const SEASONAL_POPULAR_SEARCHES: Record<Season, HeroPopularSearch[]> = {
  winter: [
    {
      id: "watch-tonight",
      icon: "📺",
      label: "What should I watch tonight?",
      query: "What should I watch tonight?",
      options: { category: "custom", watchSubcategory: "movies" }
    },
    {
      id: "date-night",
      icon: "🥂",
      label: "Date night near me",
      query: "Date night restaurants near me",
      options: { category: "restaurant", builderMode: "near_me" }
    },
    {
      id: "concerts",
      icon: "🎵",
      label: "Concerts this weekend",
      query: "Concerts near me this weekend",
      options: { category: "events", builderMode: "near_me" }
    },
    {
      id: "halfway",
      icon: "📍",
      label: "Meet halfway",
      query: KOI_EXAMPLE.halfwayQuery,
      options: { builderMode: "halfway", searchMode: "midpoint" }
    }
  ],
  spring: [
    {
      id: "farmers-market",
      icon: "🧺",
      label: "Farmers markets nearby",
      query: "Farmers markets near me this weekend",
      options: { category: "farmers_markets", builderMode: "near_me" }
    },
    {
      id: "brunch",
      icon: "🥞",
      label: "Brunch spots near me",
      query: "Best brunch near me",
      options: { category: "brunch", builderMode: "near_me" }
    },
    {
      id: "weekend",
      icon: "🌳",
      label: "Things to do outdoors",
      query: "Parks and hikes near me",
      options: { category: "park", builderMode: "near_me" }
    },
    {
      id: "halfway",
      icon: "📍",
      label: "Meet halfway",
      query: KOI_EXAMPLE.halfwayQuery,
      options: { builderMode: "halfway", searchMode: "midpoint" }
    }
  ],
  summer: [
    {
      id: "weekend-events",
      icon: "🎟️",
      label: "Live events this weekend",
      query: "Events near me this weekend",
      options: { category: "events", builderMode: "near_me" }
    },
    {
      id: "waterfront",
      icon: "🌊",
      label: "Waterfront near me",
      query: "Waterfront spots near me",
      options: { category: "waterfronts", builderMode: "near_me" }
    },
    {
      id: "sports",
      icon: "⚾",
      label: "Games near me",
      query: "Live sports near me this weekend",
      options: { category: "events", builderMode: "near_me" }
    },
    {
      id: "watch",
      icon: "📺",
      label: "Trending to watch",
      query: "Trending movies this week",
      options: { category: "custom", watchSubcategory: "trending" }
    }
  ],
  fall: [
    {
      id: "football",
      icon: "🏈",
      label: "Football games nearby",
      query: "Football games near me this weekend",
      options: { category: "events", builderMode: "near_me" }
    },
    {
      id: "farmers-fall",
      icon: "🎃",
      label: "Fall markets & fairs",
      query: "Farmers markets near me this weekend",
      options: { category: "farmers_markets", builderMode: "near_me" }
    },
    {
      id: "cozy-bar",
      icon: "🍺",
      label: "Cozy bars near me",
      query: "Cocktail bars near me",
      options: { category: "cocktail_bars", builderMode: "near_me" }
    },
    {
      id: "halfway",
      icon: "📍",
      label: "Meet halfway",
      query: KOI_EXAMPLE.halfwayQuery,
      options: { builderMode: "halfway", searchMode: "midpoint" }
    }
  ]
};

/** Rotates homepage popular searches by season — no component changes needed when copy updates. */
export function getSeasonalPopularSearches(date = new Date()): HeroPopularSearch[] {
  return SEASONAL_POPULAR_SEARCHES[seasonForDate(date)];
}
