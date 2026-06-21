"use client";

import type { WatchEventsResult } from "@/lib/types";
import { KOI_PICK_DISPLAY_LIMIT } from "@/lib/koiCapabilityExamples";
import { botModeToSearchKind, getSearchAccent } from "@/lib/searchAccent";
import { WatchEventsCard } from "@/app/components/WatchEventsCard";

type Props = {
  result: WatchEventsResult;
};

export function WatchEventsResults({ result }: Props) {
  const accent = getSearchAccent(botModeToSearchKind(result.botMode));
  const curated = result.recommendations.slice(0, KOI_PICK_DISPLAY_LIMIT);
  const [koiPick, ...otherOptions] = curated;
  const sidebarTitle = result.preview
    ? "Preview mode"
    : result.botMode === "events"
      ? "Live venue picks"
      : "Live streaming picks";

  return (
    <section className="search-results-enter mt-5 grid gap-5 pb-16 lg:grid-cols-[1fr_320px] lg:items-start">
      <div className="results-list-enter order-2 grid gap-4 lg:order-1">
        {koiPick ? <WatchEventsCard key={koiPick.id} item={koiPick} botMode={result.botMode} isKoiPick /> : null}
        {otherOptions.length ? (
          <div className="grid gap-4">
            <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate">Other Good Options</h2>
            {otherOptions.map((item) => (
              <WatchEventsCard key={item.id} item={item} botMode={result.botMode} />
            ))}
          </div>
        ) : null}
      </div>

      <aside className="results-panel-enter order-1 lg:order-2">
        <div className={`rounded-lg border bg-paper p-5 shadow-soft ${accent.panelBorder}`}>
          <p className={`text-sm font-black uppercase tracking-[0.14em] ${accent.text}`}>{result.intentLabel}</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-ink">Your search</h2>
          <p className="mt-3 text-sm leading-6 text-slate">{result.contextSummary}</p>

          <div className="mt-4 rounded-lg border border-line bg-mint p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate">Ask</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-ink">“{result.query}”</p>
          </div>

          <div className={`mt-4 rounded-lg border p-4 ${result.preview ? accent.panelSoft : accent.panelLive}`}>
            <p className="text-sm font-black text-ink">{sidebarTitle}</p>
            <p className="mt-2 text-sm leading-6 text-slate">{result.message}</p>
          </div>

          {result.futureProviders.length ? (
            <div className="mt-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate">Coming next</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.futureProviders.map((provider) => (
                  <span
                    key={provider}
                    className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate"
                  >
                    {provider}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </aside>
    </section>
  );
}
