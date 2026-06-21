"use client";

import { KOI_DESIGN } from "@/src/config/design";

export function FairMeetupPreview() {
  return (
    <section
      className="koi-premium-card w-full min-w-0 overflow-hidden p-5 sm:p-6"
      aria-labelledby="fair-meetup-preview-title"
    >
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-white/50">
        {KOI_DESIGN.fairMeetup.label}
      </p>
      <h2 id="fair-meetup-preview-title" className="sr-only">
        Fair meetup preview
      </h2>

      <div className="relative mx-auto mt-5 max-w-md">
        <div className="absolute left-[18%] right-[18%] top-1/2 h-px -translate-y-1/2 bg-white/15" />
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 text-center">
            <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-indigo text-sm font-black text-white shadow-[0_8px_20px_rgba(45,62,87,0.35)]">
              N
            </div>
            <p className="mt-2 text-sm font-bold text-white">Nathan</p>
            <p className="mt-0.5 text-xs font-semibold text-koi">→ 18 min</p>
          </div>

          <div className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-full bg-koi text-white shadow-glow ring-8 ring-koi/15">
            <span className="text-lg" aria-hidden="true">
              ⚖
            </span>
          </div>

          <div className="min-w-0 text-center">
            <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-ink text-sm font-black text-white shadow-[0_8px_20px_rgba(10,19,35,0.35)]">
              C
            </div>
            <p className="mt-2 text-sm font-bold text-white">Charlotte</p>
            <p className="mt-0.5 text-xs font-semibold text-koi">→ 19 min</p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-[14px] border border-koi/25 bg-koi/10 px-4 py-3 text-center">
        <p className="text-sm font-black text-koi">✓ Fair Meetup Found</p>
        <p className="mt-1 text-sm font-medium text-white/70">{KOI_DESIGN.fairMeetup.tagline}</p>
      </div>
    </section>
  );
}
