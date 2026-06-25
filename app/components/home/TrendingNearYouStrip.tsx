"use client";

import { trackEvent } from "@/lib/analytics";
import type { TrendingNearYouCard } from "@/lib/trendingNearYou";
import { useEffect, useState } from "react";

type Props = {
  latitude?: number | null;
  longitude?: number | null;
  busy?: boolean;
  onSearchQuery?: (query: string) => void;
};

function hasValidCoordinates(latitude?: number | null, longitude?: number | null) {
  return (
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  );
}

export function TrendingNearYouStrip({ latitude, longitude, busy = false, onSearchQuery }: Props) {
  const [cards, setCards] = useState<TrendingNearYouCard[]>([]);
  const [loading, setLoading] = useState(false);
  const canFetch = hasValidCoordinates(latitude, longitude);

  useEffect(() => {
    if (!canFetch) {
      setCards([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    void fetch(`/api/trending-near-you?lat=${latitude}&lng=${longitude}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return { cards: [] as TrendingNearYouCard[] };
        return (await response.json()) as { cards?: TrendingNearYouCard[] };
      })
      .then((payload) => setCards(Array.isArray(payload.cards) ? payload.cards : []))
      .catch(() => {
        if (!controller.signal.aborted) setCards([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [canFetch, latitude, longitude]);

  if (!canFetch) return null;
  if (!loading && cards.length === 0) return null;

  return (
    <section
      className="grid min-w-0 gap-3 rounded-[20px] border border-white/12 bg-white/[0.06] px-4 py-3.5 shadow-[0_10px_40px_rgba(0,0,0,0.14)] backdrop-blur-md"
      aria-label="Trending near you"
      aria-busy={loading}
    >
      <div className="min-w-0 grid gap-0.5">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-white/45">Trending near you</p>
        <h2 className="text-sm font-bold text-white">Picks for your area</h2>
      </div>

      <div className="min-w-0 -mx-0.5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto overscroll-x-contain px-0.5 pb-0.5 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
        {loading
          ? Array.from({ length: 3 }, (_, index) => (
              <div
                key={`trending-skeleton-${index}`}
                className="h-[8.75rem] w-[11.5rem] shrink-0 animate-pulse snap-start rounded-2xl border border-white/10 bg-white/[0.08]"
                aria-hidden="true"
              />
            ))
          : cards.map((card) => (
              <TrendingCard key={card.id} card={card} busy={busy} onSearchQuery={onSearchQuery} />
            ))}
      </div>
    </section>
  );
}

function TrendingCard({
  card,
  busy = false,
  onSearchQuery
}: {
  card: TrendingNearYouCard;
  busy?: boolean;
  onSearchQuery?: (query: string) => void;
}) {
  const body = (
    <>
      {card.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={card.imageUrl} alt="" className="h-14 w-full object-cover" />
      ) : (
        <div className="grid h-14 place-items-center bg-koi/15 text-lg" aria-hidden="true">
          {card.kind === "farmers_market" ? "🧺" : card.kind === "ev" ? "⚡" : "🎟️"}
        </div>
      )}
      <div className="grid gap-1 p-2.5">
        <p className="line-clamp-2 text-[0.8125rem] font-bold leading-snug text-white">{card.title}</p>
        <p className="line-clamp-2 text-[0.6875rem] font-medium leading-snug text-white/65">{card.subtitle}</p>
        <span className="w-fit rounded-full bg-white/10 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-white/75">
          {card.badge}
        </span>
      </div>
    </>
  );

  function handleClick() {
    trackEvent("trending_near_you_clicked", { kind: card.kind, id: card.id });
    if (card.actionUrl) return;
    if (card.searchQuery && onSearchQuery) onSearchQuery(card.searchQuery);
  }

  const cardClass =
    "koi-popular-chip group w-[11.5rem] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 text-left transition hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-60";

  if (card.actionUrl) {
    return (
      <a
        href={card.actionUrl}
        target="_blank"
        rel="noreferrer"
        onClick={() => trackEvent("trending_near_you_clicked", { kind: card.kind, id: card.id })}
        className={cardClass}
        aria-disabled={busy}
      >
        {body}
      </a>
    );
  }

  return (
    <button type="button" onClick={handleClick} disabled={busy} className={cardClass}>
      {body}
    </button>
  );
}
