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
  },
  {
    id: "street-fairs",
    icon: "🎡",
    label: "Street fairs near me",
    query: "Street fairs near me"
  }
];

type Props = {
  busy?: boolean;
  onSelect: (query: string, options?: PickQueryOptions) => void;
};

export function HeroPopularSearches({ busy = false, onSelect }: Props) {
  return (
    <section className="grid gap-2.5" aria-label="Popular searches">
      <p className="px-0.5 text-[0.625rem] font-bold uppercase tracking-[0.18em] text-white/45">Popular searches</p>
      <div className="flex flex-wrap gap-2">
        {HERO_POPULAR_SEARCHES.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={busy}
            onClick={() => onSelect(item.query, item.options)}
            className="koi-discovery-chip inline-flex max-w-full items-center gap-2 rounded-full px-3 py-2 text-left text-sm font-semibold text-white/88 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span aria-hidden="true" className="text-base leading-none">
              {item.icon}
            </span>
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
