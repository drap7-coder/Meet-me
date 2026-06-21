"use client";

import { KOI_CAPABILITY_EXAMPLES, type KoiBrowseOption } from "@/lib/koiBrowse";

type Props = {
  busy?: boolean;
  onSelect: (option: KoiBrowseOption) => void;
};

export function KoiCapabilityExamples({ busy = false, onSelect }: Props) {
  return (
    <section
      className="w-full min-w-0 overflow-hidden rounded-[22px] border border-white/15 bg-paper/96 p-5 shadow-[0_16px_40px_rgba(10,19,35,0.16),0_0_0_1px_rgba(255,255,255,0.1)_inset] sm:p-6"
      aria-labelledby="koi-capability-examples-title"
    >
      <h2 id="koi-capability-examples-title" className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-clay">
        What Koi can do
      </h2>
      <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        {KOI_CAPABILITY_EXAMPLES.map((example) => (
          <button
            key={example.id}
            type="button"
            disabled={busy}
            onClick={() => onSelect(example)}
            className="group flex w-full min-w-0 items-start gap-3 rounded-[18px] border border-line bg-mint p-4 text-left shadow-[0_8px_22px_rgba(17,24,39,0.04)] transition hover:border-clay/50 hover:bg-white hover:shadow-[0_12px_28px_rgba(17,24,39,0.08)] focus:outline-none focus:ring-4 focus:ring-clay/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-sky text-[1.35rem] leading-none transition group-hover:bg-[#FFF4EC] sm:h-14 sm:w-14 sm:text-[1.5rem]"
              aria-hidden="true"
            >
              {example.icon}
            </span>
            <span className="min-w-0 flex-1 pt-0.5">
              <span className="block text-base font-black leading-snug text-ink">{example.title}</span>
              <span className="mt-1 block text-sm font-medium leading-5 text-slate">{example.subtitle}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
