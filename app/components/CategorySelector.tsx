"use client";

import { CategoryIcon } from "@/app/components/CategoryIcon";
import { CATEGORY_GROUPS, DEFAULT_MEETUP_MODE, getPrimaryCategoryId } from "@/lib/categories";
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
  const activePrimaryId = getPrimaryCategoryId(value);
  const activePrimary = CATEGORY_GROUPS.find((group) => group.id === activePrimaryId) ?? CATEGORY_GROUPS[0];

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {CATEGORY_GROUPS.map((category) => {
          const selected = category.id === activePrimaryId;
          const primaryCategory = category.subcategories[0]?.id ?? "coffee";
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onChange(primaryCategory)}
              aria-pressed={selected}
              aria-selected={selected}
              className={`category-card group flex min-w-0 items-center rounded-[18px] border bg-white px-3 py-4 text-left shadow-[0_8px_18px_rgba(17,24,39,0.03)] transition sm:p-4 sm:shadow-[0_10px_26px_rgba(17,24,39,0.04)] ${
                selected
                  ? "selected border-2 border-[var(--mmh-coral)] !bg-[#FFF3F1] text-ink !shadow-[0_0_0_4px_rgba(255,107,95,0.08),0_14px_30px_rgba(255,107,95,0.12)]"
                  : "border-[#D8DDE6] text-ink hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-soft"
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`category-icon-wrapper grid shrink-0 place-items-center rounded-full transition ${
                    selected ? "bg-[var(--mmh-coral)] text-white shadow-[0_10px_22px_rgba(255,107,95,0.24)]" : "bg-[#F6F7FA] text-slate"
                  }`}
                >
                  <CategoryIcon category={primaryCategory} className={`category-icon ${selected ? "text-white" : "text-slate"}`} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="category-title block min-w-0 text-ink">
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

      <div className="grid gap-2 rounded-[22px] border border-[#D8DDE6] bg-white p-3 shadow-[0_12px_30px_rgba(18,50,74,0.05)] sm:p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-black text-ink">{activePrimary.label}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate">{activePrimary.description}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {activePrimary.subcategories.map((category) => {
            const selected = category.id === value;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onChange(category.id)}
                aria-pressed={selected}
                aria-selected={selected}
                className={`category-card group flex min-w-0 items-center rounded-[16px] border bg-white px-3 py-3 text-left transition ${
                  selected
                    ? "selected border-2 border-[var(--mmh-coral)] !bg-[#FFF3F1] text-ink !shadow-[0_0_0_4px_rgba(255,107,95,0.08)]"
                    : "border-[#D8DDE6] text-ink hover:border-ink/25 hover:bg-sky"
                }`}
              >
                <span
                  className={`category-icon-wrapper grid shrink-0 place-items-center rounded-full transition ${
                    selected ? "bg-[var(--mmh-coral)] text-white" : "bg-[#F6F7FA] text-slate"
                  }`}
                >
                  <CategoryIcon category={category.id} className={`category-icon ${selected ? "text-white" : "text-slate"}`} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="category-title block min-w-0 text-ink">{category.label}</span>
                </span>
              </button>
            );
          })}
        </div>
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
