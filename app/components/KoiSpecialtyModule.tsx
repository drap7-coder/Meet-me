"use client";

import { KOI_SPECIALTY_CHIPS } from "@/lib/halfwayBrowse";

type Props = {
  busy?: boolean;
  onSelect: (lookingFor: string, exampleQuery: string) => void;
};

export function KoiSpecialtyModule({ busy = false, onSelect }: Props) {
  return (
    <section
      className="w-full min-w-0 rounded-[22px] border border-clay/30 bg-white/[0.04] p-5 sm:p-6"
      aria-labelledby="koi-specialty-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-clay">Koi&apos;s Specialty</p>
          <h2 id="koi-specialty-title" className="mt-1 text-lg font-bold tracking-[-0.025em] text-white sm:text-xl">
            Find a place that works for both people.
          </h2>
        </div>
        <span className="inline-flex shrink-0 rounded-full bg-clay px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-white">
          Most Popular
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {KOI_SPECIALTY_CHIPS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            disabled={busy}
            onClick={() => onSelect(chip.lookingFor, chip.query)}
            className="inline-flex items-center gap-2 rounded-full border border-clay/35 bg-clay/10 px-4 py-2.5 text-sm font-bold text-white transition hover:border-clay hover:bg-clay/20 focus:outline-none focus:ring-4 focus:ring-clay/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span aria-hidden="true">{chip.cardIcon}</span>
            {chip.label}
          </button>
        ))}
      </div>
    </section>
  );
}
