"use client";

import { DevResultsPanel } from "@/app/components/DevResultsPanel";
import { useDevPanel } from "@/app/components/useDevPanel";
import { WatchEventsCard } from "@/app/components/WatchEventsCard";
import { buildActionableFilters } from "@/lib/koiResultChips";
import { KOI_PICK_DISPLAY_LIMIT } from "@/lib/koiCapabilityExamples";
import { botModeToSearchKind, getSearchAccent } from "@/lib/searchAccent";
import type { WatchEventsResult, WatchSubcategory } from "@/lib/types";

type Props = {
  result: WatchEventsResult;
  onRefineWatch?: (query: string, subcategory?: WatchSubcategory) => void;
  onRefineEvents?: (query: string) => void;
};

export function WatchEventsResults({ result, onRefineWatch, onRefineEvents }: Props) {
  const accent = getSearchAccent(botModeToSearchKind(result.botMode));
  const curated = result.recommendations.slice(0, KOI_PICK_DISPLAY_LIMIT);
  const [koiPick, ...otherOptions] = curated;
  const filters = buildActionableFilters(result);
  const { enabled: devPanelEnabled, toggle: toggleDevPanel } = useDevPanel();
  const showDevPanel = devPanelEnabled;

  function applyFilter(query: string, watchSubcategory?: WatchSubcategory) {
    if (result.botMode === "watch") {
      onRefineWatch?.(query, watchSubcategory);
      return;
    }
    onRefineEvents?.(query);
  }

  return (
    <section className="search-results-enter mt-5 grid gap-5 pb-16 lg:grid-cols-[1fr_320px] lg:items-start">
      <div className="results-list-enter order-2 grid gap-4 lg:order-1">
        {koiPick ? (
          <WatchEventsCard
            key={koiPick.id}
            item={koiPick}
            botMode={result.botMode}
            isKoiPick
            preferredServiceIds={result.streamingServiceIds}
          />
        ) : null}
        {otherOptions.length ? (
          <div className="grid gap-4">
            <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate">Other Good Options</h2>
            {otherOptions.map((item) => (
              <WatchEventsCard
                key={item.id}
                item={item}
                botMode={result.botMode}
                preferredServiceIds={result.streamingServiceIds}
              />
            ))}
          </div>
        ) : null}
      </div>

      <aside className="results-panel-enter order-1 lg:order-2">
        <div className={`rounded-lg border bg-paper p-5 shadow-soft ${accent.panelBorder}`}>
          <p className={`text-sm font-black uppercase tracking-[0.14em] ${accent.text}`}>{result.intentLabel}</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-ink">Your search</h2>
          <p className="mt-3 text-sm leading-6 text-slate">{result.contextSummary}</p>

          {filters.length ? (
            <div className="mt-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate">Refine</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => applyFilter(filter.query, filter.watchSubcategory)}
                    className={`rounded-full border bg-white px-3 py-1.5 text-xs font-bold transition hover:bg-mint ${accent.borderOutline} ${accent.text}`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {process.env.NEXT_PUBLIC_ENABLE_DEV_PANEL !== "true" ? (
            <button
              type="button"
              onClick={toggleDevPanel}
              className="mt-4 text-xs font-semibold text-slate/70 underline decoration-slate/30 underline-offset-2 transition hover:text-slate"
            >
              {showDevPanel ? "Hide developer view" : "Show developer view"}
            </button>
          ) : null}

          {showDevPanel ? <DevResultsPanel result={result} onClose={toggleDevPanel} /> : null}
        </div>
      </aside>
    </section>
  );
}
