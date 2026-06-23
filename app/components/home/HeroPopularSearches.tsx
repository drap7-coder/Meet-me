"use client";

import type { PickQueryOptions } from "@/app/components/SearchPromptAssist";
import { HeroSectionLabel } from "@/app/components/home/HeroSectionLabel";

export type HeroPopularSearch = {
  id: string;
  icon: string;
  label: string;
  query: string;
  options?: PickQueryOptions;
};

export const HERO_POPULAR_SEARCHES: HeroPopularSearch[] = [
  {
    id: "eat",
    icon: "🍽️",
    label: "What's worth eating tonight?",
    query: "What's worth eating near me tonight",
    options: { category: "restaurant", builderMode: "near_me" }
  },
  {
    id: "shop",
    icon: "🛍️",
    label: "Where should we shop?",
    query: "Where should we go shopping near me",
    options: { category: "shopping", builderMode: "near_me" }
  },
  {
    id: "netflix-movie",
    icon: "🎬",
    label: "Pick my Netflix movie",
    query: "What movie should I watch on Netflix tonight?",
    options: {
      category: "custom",
      watchSubcategory: "movies",
      streamingServiceIds: ["netflix"]
    }
  },
  {
    id: "peacock-show",
    icon: "📺",
    label: "What's good on Peacock?",
    query: "What TV show should I watch on Peacock tonight?",
    options: {
      category: "custom",
      watchSubcategory: "tv_shows",
      streamingServiceIds: ["peacock"]
    }
  }
];

type Props = {
  busy?: boolean;
  onSelect: (query: string, options?: PickQueryOptions) => void;
};

export function HeroPopularSearches({ busy = false, onSelect }: Props) {
  return (
    <section className="grid gap-2" aria-label="Popular searches">
      <HeroSectionLabel subtle>Popular searches</HeroSectionLabel>
      <div className="grid grid-cols-2 gap-2">
        {HERO_POPULAR_SEARCHES.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={busy}
            onClick={() => onSelect(item.query, item.options)}
            className="koi-popular-chip group flex w-full min-w-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span aria-hidden="true" className="shrink-0 text-[0.9375rem] leading-none opacity-80">
              {item.icon}
            </span>
            <span className="min-w-0 flex-1 text-[0.8125rem] font-medium leading-snug text-white/72 transition-colors group-hover:text-white/92">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
