"use client";

import { trackEvent } from "@/lib/analytics";
import type { TopPick } from "@/lib/topPick";

type Props = {
  pick: TopPick;
};

export function TopPickCard({ pick }: Props) {
  return (
    <article className="overflow-hidden rounded-[22px] border border-koi/30 bg-gradient-to-br from-ink to-[#1b2435] p-5 text-white shadow-[0_18px_44px_rgba(10,19,35,0.28)] sm:p-6">
      <div className="flex items-start gap-4">
        {pick.imageUrl ? (
          <div className="hidden h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white/10 sm:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pick.imageUrl} alt="" className="h-full w-full object-cover" />
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-koi">{pick.eyebrow}</p>
          <h2 className="mt-1 text-2xl font-black leading-tight sm:text-3xl">{pick.headline}</h2>
          <p className="mt-2 text-sm leading-6 text-white/80">{pick.summary}</p>

          {pick.chips.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {pick.chips.map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-white/90 ring-1 ring-white/15"
                >
                  {chip}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <a
              href={pick.primary.href}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackEvent("top_pick_primary_clicked", { kind: pick.kind })}
              className="inline-flex h-10 items-center rounded-full bg-koi px-5 text-sm font-black text-white transition hover:bg-koi-hover focus:outline-none focus:ring-4 focus:ring-koi/30"
            >
              {pick.primary.label}
            </a>
            {pick.secondary ? (
              <a
                href={pick.secondary.href}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackEvent("top_pick_secondary_clicked", { kind: pick.kind })}
                className="inline-flex h-10 items-center rounded-full border border-white/25 bg-white/5 px-4 text-sm font-bold text-white/90 transition hover:border-white/45 hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/15"
              >
                {pick.secondary.label}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
