"use client";

import type { WatchSubcategory } from "@/lib/types";
import { DEFAULT_WATCH_SUBCATEGORY, WATCH_TYPE_OPTIONS } from "@/lib/watchBrowse";

type Props = {
  value: WatchSubcategory;
  onChange: (subcategory: WatchSubcategory) => void;
};

export function WatchSubcategorySelector({ value, onChange }: Props) {
  const options = [
    ...WATCH_TYPE_OPTIONS,
    { id: "trending" as const, label: "🔥 Trending", description: "Popular movies and shows right now." }
  ];

  return (
    <div className="grid gap-2">
      <div>
        <span className="text-sm font-bold text-ink">What kind of watch search?</span>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate">No location needed — just tell Koi what you want to watch.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.id)}
              className={`rounded-full border px-3 py-2 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-clay/10 ${
                selected
                  ? "border-clay bg-clay text-white shadow-[0_8px_18px_rgba(255,90,0,0.22)]"
                  : "border-line bg-white text-ink hover:border-clay/40 hover:bg-sky"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { DEFAULT_WATCH_SUBCATEGORY };
