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
    <section className="grid gap-2.5" aria-label="Popular searches">
      <HeroSectionLabel>Popular searches</HeroSectionLabel>
      <div className="grid grid-cols-2 gap-2.5">
        {HERO_POPULAR_SEARCHES.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={busy}
            onClick={() => onSelect(item.query, item.options)}
            className="koi-discovery-chip flex w-full min-w-0 items-start gap-2.5 rounded-2xl px-3.5 py-3 text-left transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-base leading-none">
              {item.icon}
            </span>
            <span className="min-w-0 pt-0.5 text-sm font-semibold leading-snug text-white">{item.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
