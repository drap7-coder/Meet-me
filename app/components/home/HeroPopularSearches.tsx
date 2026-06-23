"use client";

import type { PickQueryOptions } from "@/app/components/SearchPromptAssist";

export type HeroPopularSearch = {
  id: string;
  icon: string;
  label: string;
  query: string;
  options?: PickQueryOptions;
};

export const HERO_POPULAR_SEARCHES: HeroPopularSearch[] = [
  {
    id: "sushi",
    icon: "🍣",
    label: "Best sushi near me",
    query: "Best sushi near me"
  },
  {
    id: "watch-tonight",
    icon: "📺",
    label: "What should we watch tonight?",
    query: "What should we watch tonight?",
    options: { category: "custom", watchSubcategory: "movies" }
  },
  {
    id: "farmers-market",
    icon: "🏪",
    label: "Farmers markets this weekend",
    query: "Farmers markets this weekend"
  },
  {
    id: "date-night",
    icon: "✨",
    label: "Fun date night ideas",
    query: "Fun date night ideas near me"
  }
];

type Props = {
  busy?: boolean;
  onSelect: (query: string, options?: PickQueryOptions) => void;
};

export function HeroPopularSearches({ busy = false, onSelect }: Props) {
  return (
    <section className="grid gap-2.5" aria-label="Popular searches">
      <p className="px-0.5 text-xs font-semibold uppercase tracking-[0.06em] text-white/75">Popular searches</p>
      <div className="grid grid-cols-2 gap-2">
        {HERO_POPULAR_SEARCHES.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={busy}
            onClick={() => onSelect(item.query, item.options)}
            className="koi-discovery-chip flex w-full min-w-0 items-center gap-2 rounded-[14px] px-3 py-2.5 text-left text-sm font-medium leading-snug text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span aria-hidden="true" className="shrink-0 text-base leading-none">
              {item.icon}
            </span>
            <span className="min-w-0 whitespace-normal">{item.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
