"use client";

import { CategoryIcon } from "@/app/components/CategoryIcon";
import type { WatchSubcategory } from "@/lib/types";
import { WATCH_SUBCATEGORIES } from "@/lib/watchBrowse";

type Props = {
  onSelect: (subcategory: WatchSubcategory) => void;
};

export function WatchCategoryCards({ onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {WATCH_SUBCATEGORIES.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onSelect(option.id)}
          className="category-card group flex min-w-0 items-center rounded-[20px] border-2 border-[#D8DDE6] bg-white px-4 py-5 text-left shadow-[0_10px_26px_rgba(17,24,39,0.04)] transition hover:border-ink/25 hover:shadow-soft focus:outline-none focus:ring-4 focus:ring-clay/10 sm:px-5 sm:py-6"
        >
          <div className="flex min-w-0 items-center gap-4">
            <span className="category-icon-wrapper grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#F7F1E8] text-slate transition group-hover:bg-[#FFF4EC] group-hover:text-clay sm:h-16 sm:w-16">
              <CategoryIcon category="events" className="category-icon h-6 w-6 sm:h-7 sm:w-7" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="category-title block text-lg font-black text-ink sm:text-xl">{option.label}</span>
              <span className="mt-1 block text-sm font-semibold leading-6 text-slate">{option.description}</span>
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
