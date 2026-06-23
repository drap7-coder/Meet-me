"use client";

import { trackEvent } from "@/lib/analytics";
import { KoiPickBadge } from "@/app/components/KoiPickBadge";
import { WatchProviderAvailability } from "@/app/components/WatchProviderAvailability";
import { botModeToSearchKind, getSearchAccent } from "@/lib/searchAccent";
import type { WatchEventsRecommendation } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

type Props = {
  item: WatchEventsRecommendation;
  botMode?: "watch" | "events";
  isKoiPick?: boolean;
  preferredServiceIds?: string[];
};

function isSearchSuggestion(item: WatchEventsRecommendation) {
  return item.preview && /search suggestion/i.test(item.provider);
}

function badgeClass(item: WatchEventsRecommendation, botMode: "watch" | "events") {
  const accent = getSearchAccent(botModeToSearchKind(botMode));
  if (isSearchSuggestion(item)) return "bg-events text-white";
  if (botMode === "events" && item.kind === "things_to_do") return `${accent.bg} text-white`;
  return `${accent.bg} text-white`;
}

export function WatchEventsCard({ item, botMode = "watch", isKoiPick = false, preferredServiceIds = [] }: Props) {
  const accent = getSearchAccent(botModeToSearchKind(botMode));
  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef<HTMLElement | null>(null);
  const viewed = useRef(false);
  const isLivePick = !item.preview;
  const searchSuggestion = isSearchSuggestion(item);

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

  function toggleExpanded() {
    setExpanded((current) => {
      const next = !current;
      trackEvent("watch_events_card_expanded", {
        kind: item.kind,
        provider: item.provider,
        expanded: next
      });
      return next;
    });
  }

  return (
    <article
      ref={cardRef}
      className={`rounded-lg border bg-paper p-5 shadow-soft sm:p-6 ${
        isKoiPick
          ? "border-koi/30 ring-2 ring-koi/15"
          : searchSuggestion
            ? "border-events/25"
            : accent.panelBorder
      }`}
    >
      <div className="flex items-start gap-4">
        {item.posterUrl ? (
          <img
            src={item.posterUrl}
            alt={`${item.title} poster`}
            className="h-36 w-24 shrink-0 rounded-lg border border-line object-cover shadow-soft"
            loading="lazy"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {isKoiPick ? <KoiPickBadge /> : null}
            <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-bold ${badgeClass(item, botMode)}`}>
              {item.badge}
            </span>
          </div>
          <h3 className={`font-black leading-tight text-ink ${isKoiPick ? "text-2xl sm:text-3xl" : "text-xl"}`}>
            {item.title}
          </h3>
          <p className="mt-1 text-sm font-semibold text-slate">{item.subtitle}</p>
          {item.rating || item.year || item.runtime || item.genre ? (
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-slate">
              {[item.rating, item.year, item.genre, item.runtime].filter(Boolean).join(" · ")}
            </p>
          ) : null}
          {isLivePick ? (
            <WatchProviderAvailability providers={item.watchProviders} preferredServiceIds={preferredServiceIds} />
          ) : null}
        </div>
      </div>

      {item.overview ? (
        <p className={`mt-4 text-sm leading-6 text-slate ${expanded || !isLivePick ? "" : "line-clamp-3"}`}>
          {item.overview}
        </p>
      ) : null}

      {isLivePick && (item.overview || item.explanation || item.meta.length) ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={toggleExpanded}
            className={`rounded-full border bg-white px-4 py-2 text-sm font-black transition focus:outline-none focus:ring-4 ${accent.btnOutline}`}
          >
            {expanded ? "Hide details" : "Show details"}
          </button>
        </div>
      ) : null}

      {(!isLivePick || expanded) && (
        <>
          <div className={`mt-4 rounded-lg border p-4 ${searchSuggestion ? accent.panelSoft : "border-line bg-mint"}`}>
            <p className="text-sm font-black text-ink">Why Koi picked it</p>
            <p className="mt-2 text-sm leading-6 text-slate">{item.explanation}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate ring-1 ring-line"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {item.meta.map((entry) => (
              <div
                key={entry.label}
                className={`rounded-lg px-3 py-2.5 ${searchSuggestion ? `${accent.bgSoft} ring-1 ${accent.borderSoft}` : "bg-sky"}`}
              >
                <div className="text-xs font-bold uppercase text-slate">{entry.label}</div>
                <div className="mt-1 font-bold text-ink">{entry.value}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {!isLivePick ? (
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
            className={`rounded-full px-3 py-2.5 text-center text-sm font-bold transition focus:outline-none focus:ring-4 ${accent.btnPrimary}`}
          >
            {item.actionLabel}
          </a>
        </div>
      ) : isLivePick && expanded && item.actionUrl && botMode === "watch" ? (
        <p className="mt-4 text-sm leading-6 text-slate">
          Need cast, trailers, or photos?{" "}
          <a
            href={item.actionUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() =>
              trackEvent("watch_events_action_clicked", {
                kind: item.kind,
                action: "More on TMDB",
                provider: item.provider
              })
            }
            className={`font-semibold ${accent.link}`}
          >
            Open full details on TMDB
          </a>
        </p>
      ) : null}
    </article>
  );
}
