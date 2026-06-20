"use client";

import { trackEvent } from "@/lib/analytics";
import type { WatchEventsRecommendation } from "@/lib/types";
import { useEffect, useRef } from "react";

type Props = {
  item: WatchEventsRecommendation;
};

export function WatchEventsCard({ item }: Props) {
  const cardRef = useRef<HTMLElement | null>(null);
  const viewed = useRef(false);

  useEffect(() => {
    if (!cardRef.current || viewed.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !viewed.current) {
          viewed.current = true;
          trackEvent("watch_events_card_viewed", {
            kind: item.kind,
            provider: item.provider
          });
          observer.disconnect();
        }
      },
      { threshold: 0.45 }
    );
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [item.kind, item.provider]);

  return (
    <article ref={cardRef} className="rounded-lg border border-line bg-paper p-5 shadow-soft sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-lg bg-clay px-3 py-1 text-xs font-bold text-white">{item.badge}</span>
            <span className="inline-flex rounded-full bg-sky px-2.5 py-1 text-xs font-bold text-slate">Preview</span>
          </div>
          <h3 className="text-xl font-black leading-tight text-ink">{item.title}</h3>
          <p className="mt-1 text-sm font-semibold text-slate">{item.subtitle}</p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-line bg-mint p-4">
        <p className="text-sm font-black text-ink">Why Koi picked it</p>
        <p className="mt-2 text-sm leading-6 text-slate">{item.explanation}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate ring-1 ring-line">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        {item.meta.map((entry) => (
          <div key={entry.label} className="rounded-lg bg-sky px-3 py-2.5">
            <div className="text-xs font-bold uppercase text-slate">{entry.label}</div>
            <div className="mt-1 font-bold text-ink">{entry.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-lg bg-line px-2.5 py-1 font-semibold text-slate">Source: {item.provider}</span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <a
          href={item.actionUrl}
          target="_blank"
          rel="noreferrer"
          onClick={() =>
            trackEvent("watch_events_action_clicked", {
              kind: item.kind,
              action: item.actionLabel,
              provider: item.provider
            })
          }
          className="rounded-full bg-clay px-3 py-2.5 text-center text-sm font-bold text-white transition hover:bg-[#B94A22] focus:outline-none focus:ring-4 focus:ring-clay/25"
        >
          {item.actionLabel}
        </a>
      </div>
    </article>
  );
}
