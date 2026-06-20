"use client";

import { CategoryIcon } from "@/app/components/CategoryIcon";
import {
  getWatchCategoryGroupForQuery,
  WATCH_CATEGORY_GROUPS,
  type WatchCategoryOption
} from "@/lib/watchCategories";

type Props = {
  value: string;
  onChange: (option: WatchCategoryOption) => void;
};

export function WatchCategorySelector({ value, onChange }: Props) {
  const activeGroup = getWatchCategoryGroupForQuery(value);
  const selectedQuery = value.trim();

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3">
        {WATCH_CATEGORY_GROUPS.map((group) => {
          const selected = group.id === activeGroup.id;
          const primaryOption = group.options[0];
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => onChange(primaryOption)}
              aria-pressed={selected}
              className={`category-card group flex min-w-0 items-center justify-center rounded-[18px] border-2 bg-white px-3 py-4 text-center shadow-[0_8px_18px_rgba(17,24,39,0.03)] transition sm:justify-start sm:p-4 sm:text-left sm:shadow-[0_10px_26px_rgba(17,24,39,0.04)] ${
                selected
                  ? "selected border-[var(--mmh-coral)] !bg-[#FFF4EC] text-ink !shadow-[0_0_0_4px_rgba(214,90,46,0.10),0_14px_30px_rgba(214,90,46,0.12)]"
                  : "border-[#D8DDE6] text-ink hover:border-ink/25 hover:shadow-soft"
              }`}
            >
              <div className="flex min-w-0 flex-col items-center gap-2.5 sm:flex-row sm:gap-3">
                <span
                  className={`category-icon-wrapper grid shrink-0 place-items-center rounded-full transition ${
                    selected ? "bg-[var(--mmh-coral)] text-white shadow-[0_10px_22px_rgba(214,90,46,0.24)]" : "bg-[#F7F1E8] text-slate"
                  }`}
                >
                  <CategoryIcon category={group.iconCategory} className={`category-icon ${selected ? "text-white" : "text-slate"}`} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="category-title block min-w-0 text-ink">{group.label}</span>
                  <span className="mt-1 hidden text-xs font-semibold leading-5 text-slate sm:block">
                    {group.description}
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
            <p className="text-sm font-black text-ink">{activeGroup.label}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate">{activeGroup.description}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {activeGroup.options.map((option) => {
            const selected = option.query.trim() === selectedQuery;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onChange(option)}
                aria-pressed={selected}
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
                  <CategoryIcon category={option.iconCategory} className={`category-icon ${selected ? "text-white" : "text-slate"}`} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="category-title block min-w-0 text-ink">{option.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
