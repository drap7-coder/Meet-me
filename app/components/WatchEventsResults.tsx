"use client";

import { WatchEventsCard } from "@/app/components/WatchEventsCard";
import { KOI_PICK_DISPLAY_LIMIT } from "@/lib/koiCapabilityExamples";
import type { WatchEventsResult, WatchSubcategory } from "@/lib/types";

type Props = {
  result: WatchEventsResult;
  onRefineWatch?: (query: string, subcategory?: WatchSubcategory) => void;
  onRefineEvents?: (query: string) => void;
};

export function WatchEventsResults({ result }: Props) {
  const curated = result.recommendations.slice(0, KOI_PICK_DISPLAY_LIMIT);
  const [koiPick, ...otherOptions] = curated;

  return (
    <section className="search-results-enter mt-5 grid gap-5 pb-16">
      <div className="results-list-enter grid gap-4">
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
    </section>
  );
}
