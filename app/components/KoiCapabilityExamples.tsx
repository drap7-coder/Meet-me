"use client";

import { KOI_CAPABILITY_EXAMPLES, type KoiCapabilityExample } from "@/lib/koiCapabilityExamples";

type Props = {
  busy?: boolean;
  onSelect: (example: KoiCapabilityExample) => void;
};

export function KoiCapabilityExamples({ busy = false, onSelect }: Props) {
  return (
    <section className="w-full min-w-0" aria-labelledby="capability-examples-title">
      <h2 id="capability-examples-title" className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-white/45">
        Try asking Koi
      </h2>
      <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        {KOI_CAPABILITY_EXAMPLES.map((example) => (
          <button
            key={example.id}
            type="button"
            disabled={busy}
            onClick={() => onSelect(example)}
            className="group koi-premium-card flex w-full min-w-0 items-start gap-3 p-3.5 text-left font-sans transition hover:bg-white/[0.06] focus:outline-none focus:ring-4 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60 sm:gap-4 sm:p-4"
          >
            <span
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/[0.06] text-[1.35rem] leading-none transition duration-200 group-hover:scale-[1.03] sm:h-14 sm:w-14 sm:text-[1.5rem]"
              aria-hidden="true"
            >
              {example.icon}
            </span>
            <span className="min-w-0 flex-1 pt-1 text-base font-bold leading-snug tracking-[-0.025em] text-white">{example.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
