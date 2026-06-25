"use client";

import { trackEvent } from "@/lib/analytics";
import { eventCta } from "@/lib/resultSignals";
import type { EventResult } from "@/lib/types";
import { weekendTrendingWeekKey } from "@/lib/weekendTrendingEvents";
import { useEffect, useState } from "react";

const DISMISS_KEY = "koi-weekend-trending-dismissed";

type Props = {
  latitude?: number | null;
  longitude?: number | null;
  busy?: boolean;
  onBrowseAll?: () => void;
};

function isDismissedForWeek() {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(DISMISS_KEY) === weekendTrendingWeekKey();
  } catch {
    return false;
  }
}

function dismissForWeek() {
  try {
    window.localStorage.setItem(DISMISS_KEY, weekendTrendingWeekKey());
  } catch {
    // ignore storage failures
  }
}

export function WeekendTrendingStrip({ latitude, longitude, busy = false, onBrowseAll }: Props) {
  const [events, setEvents] = useState<EventResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setHidden(isDismissedForWeek());
  }, []);

  useEffect(() => {
    if (hidden || busy) return;
    if (latitude == null || longitude == null || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setEvents([]);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    void fetch(`/api/weekend-trending?lat=${latitude}&lng=${longitude}`, {
      signal: controller.signal
    })
      .then(async (response) => {
        if (!response.ok) return { events: [] as EventResult[] };
        return (await response.json()) as { events?: EventResult[] };
      })
      .then((payload) => {
        setEvents(Array.isArray(payload.events) ? payload.events : []);
      })
      .catch(() => {
        if (!controller.signal.aborted) setEvents([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [latitude, longitude, hidden, busy]);

  if (hidden || loading || events.length === 0) return null;

  function handleDismiss() {
    dismissForWeek();
    setHidden(true);
    trackEvent("weekend_trending_dismissed");
  }

  return (
    <section
      className="grid gap-3 rounded-[20px] border border-white/12 bg-white/[0.06] px-4 py-3.5 shadow-[0_10px_40px_rgba(0,0,0,0.14)] backdrop-blur-md"
      aria-label="Live events this weekend"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 grid gap-0.5">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-white/45">This weekend</p>
          <h2 className="text-sm font-bold text-white">Live events near you</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onBrowseAll ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                trackEvent("weekend_trending_browse_all");
                onBrowseAll();
              }}
              className="text-sm font-semibold text-koi transition hover:text-koi-hover disabled:opacity-50"
            >
              See all
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss weekend events"
            className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-sm font-bold text-white/60 transition hover:border-white/30 hover:text-white"
          >
            ×
          </button>
        </div>
      </div>

      <div className="-mx-0.5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-0.5 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {events.map((event) => (
          <WeekendEventChip key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}

function WeekendEventChip({ event }: { event: EventResult }) {
  const cta = eventCta(event);
  const when = formatEventWhen(event.startTime);
  const subtitle = [when, event.venue].filter(Boolean).join(" · ");

  const body = (
    <>
      {event.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={event.imageUrl} alt="" className="h-14 w-full object-cover" />
      ) : (
        <div className="grid h-14 place-items-center bg-koi/15 text-lg" aria-hidden="true">
          🎟️
        </div>
      )}
      <div className="grid gap-1 p-2.5">
        <p className="line-clamp-2 text-[0.8125rem] font-bold leading-snug text-white">{event.title}</p>
        <p className="line-clamp-2 text-[0.6875rem] font-medium leading-snug text-white/65">{subtitle}</p>
        <span className="w-fit rounded-full bg-white/10 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-white/75">
          {event.category}
        </span>
      </div>
    </>
  );

  if (cta) {
    return (
      <a
        href={cta.href}
        target="_blank"
        rel="noreferrer"
        onClick={() =>
          trackEvent("weekend_trending_event_clicked", {
            category: event.category,
            source: event.source
          })
        }
        className="koi-popular-chip group w-[11.5rem] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 text-left transition hover:border-white/25"
      >
        {body}
      </a>
    );
  }

  return (
    <article className="koi-popular-chip w-[11.5rem] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10">
      {body}
    </article>
  );
}

function formatEventWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}
