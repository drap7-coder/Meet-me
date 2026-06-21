"use client";

import { THINKING_PROGRESS_LABELS } from "@/lib/koiCapabilityExamples";
import { getSearchAccent } from "@/lib/searchAccent";

type Props = {
  searchKind?: "places" | "watch" | "events" | null;
  phase?: number;
};

export function KoiThinkingLoader({ searchKind = "places", phase = 0 }: Props) {
  const accent = getSearchAccent(searchKind);
  const labels = THINKING_PROGRESS_LABELS[searchKind ?? "places"];
  const label = labels[phase % labels.length] ?? labels[0];

  return (
    <div
      className="rounded-[24px] border border-line bg-paper p-5 shadow-[0_14px_38px_rgba(18,50,74,0.08)] sm:p-6"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="mx-auto flex max-w-md flex-col items-center gap-4">
        <div className="koi-thinking-swim relative grid h-16 w-16 place-items-center">
          <span className="absolute inset-0 rounded-full bg-koi/10 blur-md" aria-hidden="true" />
          <span className="koi-thinking-ripple absolute inset-2 rounded-full border border-koi/20" aria-hidden="true" />
          <img
            src="/branding/koi-mark.png"
            alt=""
            aria-hidden="true"
            className="relative h-10 w-10 object-contain"
          />
        </div>
        <div className="w-full">
          <div className="h-1.5 overflow-hidden rounded-full bg-sky">
            <div className={`koi-thinking-progress h-full rounded-full ${accent.bg}`} />
          </div>
          <p className={`mt-3 text-center text-sm font-black ${accent.text}`}>{label}</p>
          <p className="mt-1 text-center text-xs font-semibold text-slate">Koi is working on your answer…</p>
        </div>
      </div>
    </div>
  );
}
