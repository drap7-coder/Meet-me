"use client";

import type { PickQueryOptions } from "@/app/components/SearchPromptAssist";
import { useSearchPromptAssist } from "@/app/components/SearchPromptAssist";
import { HeroSectionLabel } from "@/app/components/home/HeroSectionLabel";
import { KOI_EXAMPLE } from "@/lib/koiExamples";

export type HeroPopularSearch = {
  id: string;
  icon: string;
  label: string;
  query: string;
  options?: PickQueryOptions;
};

export const HERO_POPULAR_SEARCHES: HeroPopularSearch[] = [
  {
    id: "watch-tonight",
    icon: "📺",
    label: "What should I watch tonight?",
    query: "What should I watch tonight?",
    options: { category: "custom", watchSubcategory: "movies" }
  },
  {
    id: "eat",
    icon: "🍽️",
    label: "Where should we eat?",
    query: "Where should we eat near me",
    options: { category: "restaurant", builderMode: "near_me" }
  },
  {
    id: "weekend",
    icon: "📅",
    label: "What's worth doing this weekend?",
    query: "What's worth doing this weekend near me",
    options: { category: "activities", builderMode: "near_me" }
  },
  {
    id: "halfway",
    icon: "📍",
    label: "Find a halfway spot",
    query: KOI_EXAMPLE.halfwayQuery,
    options: { builderMode: "halfway", searchMode: "midpoint" }
  }
];

type Props = {
  busy?: boolean;
  onSelect: (query: string, options?: PickQueryOptions) => void;
};

export function HeroPopularSearches({ busy = false, onSelect }: Props) {
  const { surface, applyPopularPreset } = useSearchPromptAssist();
  const onPage = surface === "page";

  return (
    <section className="grid gap-2.5" aria-label="Popular searches">
      {onPage ? (
        <HeroSectionLabel onPage>Popular searches</HeroSectionLabel>
      ) : (
        <p className="px-0.5 text-xs font-semibold uppercase tracking-[0.08em] text-white">Popular searches</p>
      )}
      <div className="grid grid-cols-2 gap-2">
        {HERO_POPULAR_SEARCHES.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={busy}
            onClick={() => {
              applyPopularPreset(item);
              onSelect(item.query, item.options);
            }}
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
