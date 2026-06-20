"use client";

import type { WatchEventsResult } from "@/lib/types";
import { WatchEventsCard } from "@/app/components/WatchEventsCard";

type Props = {
  result: WatchEventsResult;
  loadingMore?: boolean;
  onLoadMore?: () => void;
};

export function WatchEventsResults({ result, loadingMore = false, onLoadMore }: Props) {
  const sidebarTitle = result.preview ? "Preview mode" : "Live watch picks";

  return (
    <section className="search-results-enter mt-5 grid gap-5 pb-16 lg:grid-cols-[1fr_320px] lg:items-start">
      <div className="results-list-enter order-2 grid gap-4 lg:order-1">
        {result.recommendations.map((item) => (
          <WatchEventsCard key={item.id} item={item} />
        ))}

        {result.hasMore && onLoadMore ? (
          <div className="grid gap-2">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={loadingMore}
              className="h-12 rounded-full border border-clay bg-white px-5 text-sm font-black text-clay transition hover:bg-[#FFF4EC] focus:outline-none focus:ring-4 focus:ring-clay/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingMore ? "Loading more picks..." : "Show more picks"}
            </button>
            <p className="text-center text-xs font-semibold text-slate">
              Loads more results here. Use View on TMDB on a card only when you want full details.
            </p>
          </div>
        ) : null}
      </div>

      <aside className="results-panel-enter order-1 lg:order-2">
        <div className="rounded-lg border border-line bg-paper p-5 shadow-soft">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-clay">{result.intentLabel}</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-ink">Your search</h2>
          <p className="mt-3 text-sm leading-6 text-slate">{result.contextSummary}</p>

          <div className="mt-4 rounded-lg border border-line bg-mint p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate">Ask</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-ink">“{result.query}”</p>
          </div>

          <div
            className={`mt-4 rounded-lg border p-4 ${
              result.preview ? "border-clay/25 bg-[#FFF4EC]" : "border-[#B7E4C7] bg-[#F3FBF6]"
            }`}
          >
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
