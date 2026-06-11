"use client";

import {
  CATEGORY_GROUPS,
  DEFAULT_MEETUP_MODE,
  getDefaultCategoryForPrimary,
  getPrimaryCategoryId,
  type PrimaryCategoryId
} from "@/lib/categories";
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

  function selectPrimary(primaryId: PrimaryCategoryId) {
    onChange(getDefaultCategoryForPrimary(primaryId));
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {CATEGORY_GROUPS.map((primary) => {
          const selected = primary.id === activePrimaryId;
          return (
            <button
              key={primary.id}
              type="button"
              onClick={() => selectPrimary(primary.id)}
              aria-pressed={selected}
              className={`group rounded-lg border p-4 text-left shadow-[0_10px_26px_rgba(17,17,17,0.04)] transition ${
                selected
                  ? "border-clay bg-ink text-white shadow-[0_18px_40px_rgba(31,94,255,0.18)]"
                  : `border-line bg-gradient-to-br ${primary.accent} text-ink hover:-translate-y-0.5 hover:border-clay/40 hover:shadow-soft`
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-base font-black leading-tight">{primary.label}</span>
                <span
                  className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-black ${
                    selected ? "border-white/30 bg-white text-clay" : "border-line bg-white text-slate group-hover:border-clay/30"
                  }`}
                  aria-hidden="true"
                >
                  {selected ? "On" : ">"}
                </span>
              </div>
              <p className={`mt-3 text-xs font-semibold leading-5 ${selected ? "text-white/72" : "text-slate"}`}>
                {primary.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-line bg-white p-3 shadow-[0_14px_36px_rgba(17,17,17,0.05)] sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black text-ink">{activePrimary.label}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate">Choose the exact kind of meet-up.</p>
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
                  className={`min-h-10 rounded-md px-3 text-center text-xs font-black transition sm:text-sm ${
                    selected
                      ? "bg-white text-ink shadow-[0_8px_20px_rgba(17,17,17,0.08)]"
                      : "text-slate hover:text-ink"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {activePrimary.subcategories.map((subcategory) => {
            const selected = subcategory.id === value;
            return (
              <button
                key={subcategory.id}
                type="button"
                onClick={() => onChange(subcategory.id)}
                aria-pressed={selected}
                className={`rounded-lg border p-3 text-left transition ${
                  selected
                    ? "border-clay bg-[#F4F7FF] shadow-[0_12px_28px_rgba(31,94,255,0.12)]"
                    : "border-line bg-white hover:-translate-y-0.5 hover:border-clay/40 hover:bg-sky"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-black text-ink">{subcategory.label}</span>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      selected ? "bg-clay shadow-[0_0_0_4px_rgba(31,94,255,0.12)]" : "bg-line"
                    }`}
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate">{subcategory.description}</p>
              </button>
            );
          })}
        </div>

        <p className="mt-4 rounded-lg bg-sky px-3 py-2 text-xs font-semibold leading-5 text-slate">
          {mode === "district"
            ? "District mode favors broader searches like walkable downtowns, main streets, shopping districts, and outlet centers."
            : "Single Place mode favors specific venues like coffee shops, stores, restaurants, ranges, and activity spots."}
        </p>
      </div>
    </div>
  );
}
