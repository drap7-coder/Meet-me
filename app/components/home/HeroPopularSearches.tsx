"use client";

import type { PickQueryOptions } from "@/app/components/SearchPromptAssist";
import { useSearchPromptAssist } from "@/app/components/SearchPromptAssist";
import { HeroSectionLabel } from "@/app/components/home/HeroSectionLabel";
import { getSeasonalPopularSearches } from "@/src/config/popularSearches";
import { useMemo } from "react";

export type HeroPopularSearch = {
  id: string;
  icon: string;
  label: string;
  query: string;
  options?: PickQueryOptions;
};

type Props = {
  busy?: boolean;
  onSelect: (query: string, options?: PickQueryOptions) => void;
  /** Tighter layout when grouped with other hero discovery sections. */
  compact?: boolean;
};

export function HeroPopularSearches({ busy = false, onSelect, compact = false }: Props) {
  const { surface, applyPopularPreset } = useSearchPromptAssist();
  const popularSearches = useMemo(() => getSeasonalPopularSearches(), []);
  const onPage = surface === "page";
  const labelClass = compact
    ? "px-0.5 text-sm font-semibold text-white/65"
    : onPage
      ? ""
      : "px-0.5 text-xs font-semibold uppercase tracking-[0.08em] text-white";

  return (
    <section className={`grid min-w-0 ${compact ? "gap-3" : "gap-2.5"}`} aria-label="Popular searches">
      {onPage && !compact ? (
        <HeroSectionLabel onPage>Popular</HeroSectionLabel>
      ) : (
        <p className={labelClass}>Popular</p>
      )}
      <div
        className={
          compact
            ? "-mx-0.5 flex snap-x snap-mandatory gap-2 overflow-x-auto px-0.5 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible [&::-webkit-scrollbar]:hidden"
            : "grid grid-cols-2 gap-2"
        }
      >
        {popularSearches.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={busy}
            onClick={() => {
              applyPopularPreset(item);
              onSelect(item.query, item.options);
            }}
            className={`koi-popular-chip group flex w-full min-w-0 items-center gap-2 rounded-xl px-3 text-left text-white disabled:cursor-not-allowed disabled:opacity-40 ${
              compact ? "snap-start min-w-[11.5rem] py-2 sm:min-w-0 sm:py-2.5" : "py-2.5"
            }`}
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
