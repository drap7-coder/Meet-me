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
    <div className="grid gap-3 sm:gap-4">
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-5">
        {CATEGORY_GROUPS.map((primary) => {
          const selected = primary.id === activePrimaryId;
          return (
            <button
              key={primary.id}
              type="button"
              onClick={() => selectPrimary(primary.id)}
              aria-pressed={selected}
              className={`group min-h-[72px] rounded-lg border bg-white p-3 text-left shadow-[0_8px_18px_rgba(17,24,39,0.04)] transition sm:min-h-[154px] sm:p-4 sm:shadow-[0_10px_26px_rgba(17,24,39,0.04)] ${
                selected
                  ? "border-clay text-ink shadow-[0_18px_40px_rgba(255,107,107,0.18)]"
                  : "border-line text-ink hover:-translate-y-0.5 hover:border-clay/50 hover:shadow-soft"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-black leading-tight sm:text-base">{primary.label}</span>
                <span
                  className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full sm:grid sm:h-6 sm:w-6 sm:place-items-center sm:border sm:text-xs sm:font-black ${
                    selected
                      ? "bg-clay text-white sm:border-clay"
                      : "bg-line text-slate group-hover:border-clay/30 sm:border-line sm:bg-white"
                  }`}
                  aria-hidden="true"
                >
                  <span className="hidden sm:inline">{selected ? "On" : ">"}</span>
                </span>
              </div>
              <p className="mt-3 hidden text-xs font-semibold leading-5 text-slate sm:block">
                {primary.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-line bg-white p-3 shadow-[0_10px_26px_rgba(17,24,39,0.05)] sm:p-4 sm:shadow-[0_14px_36px_rgba(17,24,39,0.05)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black text-ink">{activePrimary.label}</p>
            <p className="mt-1 hidden text-xs font-semibold leading-5 text-slate sm:block">Choose the exact kind of meet-up.</p>
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

        <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:grid-cols-2 lg:grid-cols-3">
          {activePrimary.subcategories.map((subcategory) => {
            const selected = subcategory.id === value;
            return (
              <button
                key={subcategory.id}
                type="button"
                onClick={() => onChange(subcategory.id)}
                aria-pressed={selected}
                className={`rounded-lg border px-3 py-2.5 text-left transition sm:p-3 ${
                  selected
                    ? "border-clay bg-[#FFF1F1] shadow-[0_12px_28px_rgba(255,107,107,0.12)]"
                    : "border-line bg-white hover:-translate-y-0.5 hover:border-clay/40 hover:bg-sky"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-black text-ink">{subcategory.label}</span>
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full sm:h-2.5 sm:w-2.5 ${
                      selected ? "bg-clay shadow-[0_0_0_4px_rgba(255,107,107,0.14)]" : "bg-line"
                    }`}
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-2 hidden text-xs font-semibold leading-5 text-slate sm:block">{subcategory.description}</p>
              </button>
            );
          })}
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
