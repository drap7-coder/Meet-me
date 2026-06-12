"use client";

import { CategoryIcon } from "@/app/components/CategoryIcon";
import { DEFAULT_MEETUP_MODE, FEATURED_CATEGORIES, getCategoryConfig } from "@/lib/categories";
import type { MeetupMode, VenueCategory } from "@/lib/types";

type Props = {
  value: VenueCategory;
  mode?: MeetupMode;
  onChange: (category: VenueCategory) => void;
  onModeChange: (mode: MeetupMode) => void;
};

const MODE_OPTIONS: Array<{ id: MeetupMode; label: string; helper: string }> = [
  { id: "single", label: "Single Place", helper: "Find individual coffee shops, stores, restaurants, ranges, and venues." },
  { id: "district", label: "District / Downtown", helper: "Favor broader areas like main streets, shopping districts, outlet centers, and downtowns." }
];

export function CategorySelector({ value, mode = DEFAULT_MEETUP_MODE, onChange, onModeChange }: Props) {
  const activeConfig = getCategoryConfig(value);
  const visibleCategories =
    activeConfig && !FEATURED_CATEGORIES.some((category) => category.id === activeConfig.id)
      ? [...FEATURED_CATEGORIES, activeConfig]
      : FEATURED_CATEGORIES;

  return (
    <div className="grid gap-3 sm:gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {visibleCategories.map((category) => {
          const selected = category.id === value;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onChange(category.id)}
              aria-pressed={selected}
              className={`group flex min-w-0 items-center rounded-[18px] border bg-white px-3 py-4 text-left shadow-[0_8px_18px_rgba(17,24,39,0.03)] transition sm:p-4 sm:shadow-[0_10px_26px_rgba(17,24,39,0.04)] ${
                selected
                  ? "border-2 border-[#EF7A70] !bg-[#FFF3F1] text-ink !shadow-[0_0_0_4px_rgba(239,122,112,0.08),0_14px_30px_rgba(239,122,112,0.12)]"
                  : "border-[#D8DDE6] text-ink hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-soft"
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-full transition ${
                    selected ? "bg-[#EF7A70] text-white shadow-[0_10px_22px_rgba(239,122,112,0.24)]" : "bg-[#F6F7FA] text-slate"
                  }`}
                >
                  <CategoryIcon category={category.id} className={`h-[18px] w-[18px] ${selected ? "text-white" : "text-slate"}`} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block min-w-0 text-[15px] font-black leading-[1.1] text-ink [overflow-wrap:anywhere] sm:text-base">
                    {category.label}
                  </span>
                  <span className="mt-1 hidden text-xs font-semibold leading-5 text-slate sm:block">
                    {category.description}
                  </span>
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-line bg-white p-3 shadow-[0_10px_26px_rgba(17,24,39,0.05)] sm:p-4 sm:shadow-[0_14px_36px_rgba(17,24,39,0.05)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black text-ink">Search style</p>
            <p className="mt-1 hidden text-xs font-semibold leading-5 text-slate sm:block">
              Choose a single venue or a broader area with multiple options nearby.
            </p>
          </div>
          <div className="grid grid-cols-2 rounded-lg border border-line bg-sky p-1">
            {MODE_OPTIONS.map((option) => {
              const selected = option.id === mode;
              return (
                <button
                  key={option.id}
                  type="button"
                  title={option.helper}
                  onClick={() => onModeChange(option.id)}
                  aria-pressed={selected}
                  className={`min-h-9 rounded-md px-2 text-center text-xs font-black transition sm:min-h-10 sm:px-3 sm:text-sm ${
                    selected
                      ? "bg-white text-ink shadow-[0_8px_20px_rgba(17,24,39,0.08)]"
                      : "text-slate hover:text-ink"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <p className="mt-3 rounded-lg bg-sky px-3 py-2 text-xs font-semibold leading-5 text-slate sm:mt-4">
          {mode === "district"
            ? "District mode favors downtowns, main streets, shopping districts, and outlet centers."
            : "Single Place mode favors specific venues like shops, restaurants, ranges, and activity spots."}
        </p>
      </div>
    </div>
  );
}
