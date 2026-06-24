"use client";

import { KoiPickBadge } from "@/app/components/KoiPickBadge";
import { trackEvent } from "@/lib/analytics";
import type { EventResult } from "@/lib/types";
import { useEffect, useRef } from "react";

type Props = {
  event: EventResult;
  rank: number;
  isKoiPick?: boolean;
};

export function EventResultCard({ event, rank, isKoiPick = false }: Props) {
  const cardRef = useRef<HTMLElement | null>(null);
  const viewed = useRef(false);
  const when = formatEventWhen(event.startTime);

  useEffect(() => {
    if (!cardRef.current || viewed.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !viewed.current) {
          viewed.current = true;
          trackEvent("event_card_viewed", {
            rank,
            category: event.category,
            source: event.source
          });
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [event.category, event.source, rank]);

  return (
    <article
      ref={cardRef}
      className="overflow-hidden rounded-[22px] border border-line/80 bg-white shadow-[0_10px_30px_rgba(10,19,35,0.06)]"
    >
      <div className="grid gap-4 p-4 sm:grid-cols-[112px_1fr] sm:p-5">
        {event.imageUrl ? (
          <div className="overflow-hidden rounded-2xl bg-mint">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={event.imageUrl} alt="" className="h-28 w-full object-cover sm:h-full sm:min-h-[112px]" />
          </div>
        ) : null}

        <div className="grid min-w-0 gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {isKoiPick ? <KoiPickBadge /> : (
              <span className="inline-flex items-center rounded-full bg-koi/10 px-3 py-1 text-xs font-bold text-koi ring-1 ring-koi/20">
                Event #{rank}
              </span>
            )}
            <span className="rounded-full bg-koi/10 px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-koi">
              {event.category}
            </span>
          </div>

          <div className="grid gap-1">
            <h3 className="text-lg font-bold leading-tight text-ink">{event.title}</h3>
            <p className="text-sm font-medium text-slate">
              {when}
              {event.venue ? ` · ${event.venue}` : ""}
              {event.city ? ` · ${event.city}${event.state ? `, ${event.state}` : ""}` : ""}
            </p>
          </div>

          {event.ticketUrl ? (
            <div>
              <a
                href={event.ticketUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() =>
                  trackEvent("event_card_clicked", {
                    rank,
                    category: event.category,
                    source: event.source
                  })
                }
                className="inline-flex h-10 items-center rounded-full bg-koi px-4 text-sm font-bold text-white transition hover:bg-koi-hover"
              >
                Get tickets
              </a>
            </div>
          ) : null}
        </div>
      </div>
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
