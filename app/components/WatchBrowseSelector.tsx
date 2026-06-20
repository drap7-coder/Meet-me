"use client";

import { CategoryIcon } from "@/app/components/CategoryIcon";
import type { WatchSubcategory } from "@/lib/types";
import {
  getWatchGenresForSubcategory,
  getWatchSubcategoryDescription,
  getWatchSubcategoryLabel,
  watchSubcategoryHasGenres,
  WATCH_SUBCATEGORIES,
  type WatchGenreOption
} from "@/lib/watchBrowse";
import type { RefObject } from "react";

type Props = {
  activeSubcategory: WatchSubcategory | null;
  selectedGenreQuery: string;
  busy?: boolean;
  genrePanelRef?: RefObject<HTMLDivElement | null>;
  onSubcategorySelect: (subcategory: WatchSubcategory) => void;
  onGenreSelect: (subcategory: WatchSubcategory, option: WatchGenreOption) => void;
};

export function WatchBrowseSelector({
  activeSubcategory,
  selectedGenreQuery,
  busy = false,
  genrePanelRef,
  onSubcategorySelect,
  onGenreSelect
}: Props) {
  const activeOption = WATCH_SUBCATEGORIES.find((option) => option.id === activeSubcategory) ?? null;
  const genreOptions = activeSubcategory ? getWatchGenresForSubcategory(activeSubcategory) : [];
  const showGenrePanel = activeSubcategory && watchSubcategoryHasGenres(activeSubcategory);

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {WATCH_SUBCATEGORIES.map((option) => {
          const selected = option.id === activeSubcategory;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSubcategorySelect(option.id)}
              disabled={busy}
              aria-pressed={selected}
              aria-selected={selected}
              className={`category-card group flex min-w-0 items-center rounded-[20px] border-2 bg-white px-4 py-5 text-left shadow-[0_10px_26px_rgba(17,24,39,0.04)] transition hover:border-ink/25 hover:shadow-soft focus:outline-none focus:ring-4 focus:ring-clay/10 sm:px-5 sm:py-6 ${
                selected
                  ? "selected border-[var(--mmh-coral)] !bg-[#FFF4EC] text-ink !shadow-[0_0_0_4px_rgba(214,90,46,0.10),0_14px_30px_rgba(214,90,46,0.12)]"
                  : "border-[#D8DDE6] text-ink"
              }`}
            >
              <div className="flex min-w-0 items-center gap-4">
                <span
                  className={`category-icon-wrapper grid h-14 w-14 shrink-0 place-items-center rounded-full transition sm:h-16 sm:w-16 ${
                    selected ? "bg-[var(--mmh-coral)] text-white shadow-[0_10px_22px_rgba(214,90,46,0.24)]" : "bg-[#F7F1E8] text-slate group-hover:bg-[#FFF4EC] group-hover:text-clay"
                  }`}
                >
                  <CategoryIcon category="events" className={`category-icon h-6 w-6 sm:h-7 sm:w-7 ${selected ? "text-white" : ""}`} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="category-title block text-lg font-black text-ink sm:text-xl">{option.label}</span>
                  <span className="mt-1 block text-sm font-semibold leading-6 text-slate">{option.description}</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {showGenrePanel && activeOption ? (
        <div
          ref={genrePanelRef}
          className="grid gap-2 rounded-[22px] border border-[#D8DDE6] bg-white p-3 shadow-[0_12px_30px_rgba(18,50,74,0.05)] sm:p-4"
        >
          <div>
            <p className="text-sm font-black text-ink">{getWatchSubcategoryLabel(activeOption.id)} genres</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate">
              {getWatchSubcategoryDescription(activeOption.id)} Pick a genre to start your search.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {genreOptions.map((option) => {
              const selected = option.query.trim() === selectedGenreQuery.trim();
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onGenreSelect(activeOption.id, option)}
                  disabled={busy}
                  aria-pressed={selected}
                  aria-selected={selected}
                  className={`category-card group flex min-w-0 flex-col items-center justify-center rounded-[16px] border-2 bg-white px-3 py-3 text-center transition sm:flex-row sm:justify-start sm:text-left ${
                    selected
                      ? "selected border-[var(--mmh-coral)] !bg-[#FFF4EC] text-ink !shadow-[0_0_0_4px_rgba(214,90,46,0.10)]"
                      : "border-[#D8DDE6] text-ink hover:border-ink/25 hover:bg-sky"
                  }`}
                >
                  <span
                    className={`category-icon-wrapper grid shrink-0 place-items-center rounded-full transition ${
                      selected ? "bg-[var(--mmh-coral)] text-white" : "bg-[#F7F1E8] text-slate"
                    }`}
                  >
                    <CategoryIcon category="events" className={`category-icon ${selected ? "text-white" : "text-slate"}`} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="category-title block min-w-0 text-ink">{option.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
