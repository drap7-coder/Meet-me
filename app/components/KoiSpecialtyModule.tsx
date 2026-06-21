"use client";

import { KOI_SPECIALTY_CHIPS } from "@/lib/halfwayBrowse";

type Props = {
  busy?: boolean;
  onSelect: (lookingFor: string, exampleQuery: string) => void;
};

export function KoiSpecialtyModule({ busy = false, onSelect }: Props) {
  return (
    <section className="koi-premium-card w-full min-w-0 p-5 sm:p-6" aria-labelledby="koi-specialty-title">
      <div className="min-w-0">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-white/50">Fair Meetup zone</p>
        <h2 id="koi-specialty-title" className="mt-1 text-lg font-bold tracking-[-0.025em] text-white sm:text-xl">
          Find a place that works for both people.
        </h2>
        <p className="mt-1 text-sm text-white/55">Nobody gets stuck with the drive.</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {KOI_SPECIALTY_CHIPS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            disabled={busy}
            onClick={() => onSelect(chip.lookingFor, chip.query)}
            className="koi-discovery-chip inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white/90 focus:outline-none focus:ring-4 focus:ring-koi/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span aria-hidden="true">{chip.cardIcon}</span>
            {chip.label}
          </button>
        ))}
      </div>
    </section>
  );
}
