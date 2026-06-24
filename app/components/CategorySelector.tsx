"use client";

import { CategoryIcon } from "@/app/components/CategoryIcon";
import { CATEGORY_GROUPS, getPrimaryCategoryId } from "@/lib/categories";
import type { VenueCategory } from "@/lib/types";
import { useState } from "react";

type Props = {
  value: VenueCategory;
  onChange: (category: VenueCategory) => void;
};

// Shopping remains fully searchable via natural language + intent detection,
// but is hidden as a top-level primary category to simplify the UI.
const HIDDEN_PRIMARY_GROUP_IDS = new Set(["shopping"]);
const VISIBLE_CATEGORY_GROUPS = CATEGORY_GROUPS.filter((group) => !HIDDEN_PRIMARY_GROUP_IDS.has(group.id));

export function CategorySelector({ value, onChange }: Props) {
  const [showMore, setShowMore] = useState(false);
  const activePrimaryId = getPrimaryCategoryId(value);
  const activePrimary = VISIBLE_CATEGORY_GROUPS.find((group) => group.id === activePrimaryId) ?? VISIBLE_CATEGORY_GROUPS[0];
  const hasMoreSheet = activePrimaryId === "drinks" || activePrimaryId === "outdoors";

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3">
        {VISIBLE_CATEGORY_GROUPS.map((category) => {
          const selected = category.id === activePrimaryId;
          const primaryCategory = category.subcategories[0]?.id ?? "coffee";
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onChange(primaryCategory)}
              aria-pressed={selected}
              aria-selected={selected}
              className={`category-card group flex min-w-0 items-center justify-center rounded-[18px] border-2 bg-white px-3 py-4 text-center shadow-[0_8px_18px_rgba(17,24,39,0.03)] transition sm:justify-start sm:p-4 sm:text-left sm:shadow-[0_10px_26px_rgba(17,24,39,0.04)] ${
                selected
                  ? "selected border-[var(--mmh-coral)] !bg-[#FFF3E8] text-ink !shadow-[0_0_0_4px_rgba(255,90,0,0.12),0_14px_30px_rgba(255,90,0,0.14)]"
                  : "border-[#D8DDE6] text-ink hover:border-ink/25 hover:shadow-soft"
              }`}
            >
              <div className="flex min-w-0 flex-col items-center gap-2.5 sm:flex-row sm:gap-3">
                <span
                  className={`category-icon-wrapper grid shrink-0 place-items-center rounded-full transition ${
                    selected ? "bg-[var(--mmh-coral)] text-white shadow-[0_10px_22px_rgba(255,90,0,0.26)]" : "bg-[#F7F1E8] text-slate"
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
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {activePrimary.subcategories.map((category) => {
            const selected = category.id === value;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onChange(category.id)}
                aria-pressed={selected}
                aria-selected={selected}
                className={`category-card group flex min-w-0 flex-col items-center justify-center rounded-[16px] border-2 bg-white px-3 py-3 text-center transition sm:flex-row sm:justify-start sm:text-left ${
                  selected
                    ? "selected border-[var(--mmh-coral)] !bg-[#FFF3E8] text-ink !shadow-[0_0_0_4px_rgba(255,90,0,0.12)]"
                    : "border-[#D8DDE6] text-ink hover:border-ink/25 hover:bg-sky"
                }`}
              >
                <span
                  className={`category-icon-wrapper grid shrink-0 place-items-center rounded-full transition ${
                    selected ? "bg-[var(--mmh-coral)] text-white" : "bg-[#F7F1E8] text-slate"
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
          {hasMoreSheet ? (
            <button
              type="button"
              onClick={() => setShowMore(true)}
              className="category-card group flex min-w-0 flex-col items-center justify-center rounded-[16px] border-2 border-[#D8DDE6] bg-white px-3 py-3 text-center text-ink transition hover:border-ink/25 hover:bg-sky sm:flex-row sm:justify-start sm:text-left"
            >
              <span className="category-icon-wrapper grid shrink-0 place-items-center rounded-full bg-[#F7F1E8] text-slate transition">
                <CategoryIcon category={activePrimary.subcategories[0]?.id ?? "coffee"} className="category-icon text-slate" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="category-title block min-w-0 text-ink">More</span>
              </span>
            </button>
          ) : null}
        </div>
      </div>

      {showMore ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-ink/35 p-0 sm:place-items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="category-more-title">
          <div className="w-full rounded-t-[24px] border border-line bg-paper p-4 shadow-[0_24px_70px_rgba(10,19,35,0.22)] sm:max-w-xl sm:rounded-[24px] sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p id="category-more-title" className="text-lg font-black text-ink">{activePrimary.label}</p>
                <p className="mt-1 text-sm font-semibold leading-5 text-slate">{activePrimary.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowMore(false)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-white text-lg font-black text-ink transition hover:border-ink/25"
                aria-label="Close category list"
              >
                x
              </button>
            </div>
            <div className="grid max-h-[60vh] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
              {activePrimary.subcategories.map((category) => {
                const selected = category.id === value;
                return (
                  <button
                    key={`more-${category.id}`}
                    type="button"
                    onClick={() => {
                      onChange(category.id);
                      setShowMore(false);
                    }}
                    aria-pressed={selected}
                    className={`rounded-[16px] border-2 px-3 py-3 text-left text-sm font-black transition ${
                      selected
                        ? "border-[var(--mmh-coral)] bg-[#FFF3E8] text-ink"
                        : "border-[#D8DDE6] bg-white text-ink hover:border-ink/25 hover:bg-sky"
                    }`}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
