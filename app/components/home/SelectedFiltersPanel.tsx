"use client";

import { HeroSectionLabel } from "@/app/components/home/HeroSectionLabel";
import type { PickQueryOptions } from "@/app/components/SearchPromptAssist";
import { useSearchPromptAssist } from "@/app/components/SearchPromptAssist";

type Props = {
  busy?: boolean;
  onSearch: (query: string, options: PickQueryOptions, isStreaming: boolean) => void;
};

export function SelectedFiltersPanel({ busy = false, onSearch }: Props) {
  const { surface, filterPills, filterPreview, removeFilterPill } = useSearchPromptAssist();
  const onPage = surface === "page";

  if (!filterPills.length) return null;

  const panelClass = onPage
    ? "rounded-[18px] border border-line/80 bg-paper p-3.5 text-ink shadow-soft sm:p-4"
    : "koi-selected-filters rounded-[18px] border border-white/12 bg-white/[0.04] p-3.5 text-white backdrop-blur-sm sm:p-4";
  const previewClass = onPage ? "text-sm font-medium leading-6 text-slate/80" : "text-sm font-medium leading-6 text-white";
  const previewQuoteClass = onPage ? "font-semibold text-ink" : "font-semibold text-white";
  const pillClass = onPage
    ? "inline-flex items-center gap-1.5 rounded-full border border-line bg-mint px-3 py-1.5 text-xs font-bold text-ink"
    : "inline-flex items-center gap-1.5 rounded-full border border-white/14 bg-white/[0.07] px-3 py-1.5 text-xs font-bold text-white";
  const removeClass = onPage
    ? "inline-flex h-4 w-4 items-center justify-center rounded-full text-slate/70 transition hover:bg-line/80 hover:text-ink"
    : "inline-flex h-4 w-4 items-center justify-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white";

  return (
    <section className={panelClass} aria-label="Selected filters">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid min-w-0 flex-1 gap-2.5">
          {onPage ? (
            <HeroSectionLabel onPage>Selected filters</HeroSectionLabel>
          ) : (
            <p className="px-0.5 text-xs font-semibold uppercase tracking-[0.08em] text-white">Selected filters</p>
          )}
          <div className="flex flex-wrap gap-2">
            {filterPills.map((pill) => (
              <span key={pill.id} className={pillClass}>
                {pill.label}
                <button
                  type="button"
                  disabled={busy}
                  aria-label={`Remove ${pill.label}`}
                  onClick={() => removeFilterPill(pill.id)}
                  className={removeClass}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          {filterPreview ? (
            <p className={previewClass}>
              Preview: <span className={previewQuoteClass}>&ldquo;{filterPreview.query}&rdquo;</span>
            </p>
          ) : null}
        </div>
        <button
          type="button"
          disabled={busy || !filterPreview}
          onClick={() => {
            if (!filterPreview) return;
            onSearch(filterPreview.query, filterPreview.options, filterPreview.isStreaming);
          }}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-koi px-5 text-sm font-black text-white shadow-[0_10px_24px_rgba(255,90,0,0.24)] transition hover:bg-koi-hover focus:outline-none focus:ring-4 focus:ring-koi/25 disabled:cursor-not-allowed disabled:bg-white/20"
        >
          Search
        </button>
      </div>
    </section>
  );
}
