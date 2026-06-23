"use client";

import { FuturisticMeetupMap } from "@/app/components/FuturisticMeetupMap";
import { KOI_DESIGN } from "@/src/config/design";

export function FairMeetupPreview() {
  return (
    <section
      className="koi-premium-card w-full min-w-0 p-5 sm:p-6"
      aria-labelledby="fair-meetup-preview-title"
    >
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-white/50">
        {KOI_DESIGN.fairMeetup.label}
      </p>
      <h2 id="fair-meetup-preview-title" className="sr-only">
        Fair meetup preview between Beatrix and Charlotte
      </h2>

      <FuturisticMeetupMap />

      <div className="mt-5 rounded-[14px] border border-koi/25 bg-koi/10 px-4 py-3.5 text-center">
        <p className="text-sm font-black leading-5 text-koi">✓ Fair Meetup Found</p>
        <p className="mt-1.5 text-sm font-medium leading-6 text-white/70">{KOI_DESIGN.fairMeetup.tagline}</p>
      </div>
    </section>
  );
}
