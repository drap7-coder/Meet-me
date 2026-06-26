"use client";

import { TRAVEL_MODE_OPTIONS } from "@/lib/travelMode";
import type { TravelMode } from "@/lib/types";

type Props = {
  value: TravelMode;
  onChange: (mode: TravelMode) => void;
  busy?: boolean;
  surface?: "hero" | "page";
};

const SEGMENT_LABELS: Record<TravelMode, string> = {
  auto: "Auto",
  drive: "Drive",
  walk: "Walk",
  bike: "Bike",
  ev: "EV"
};

/**
 * Compact segmented travel-mode control for the homepage location strip.
 */
export function TravelModeSelector({ value, onChange, busy = false, surface = "hero" }: Props) {
  const onPage = surface === "page";
  const options = TRAVEL_MODE_OPTIONS.filter((option) => !option.disabled);

  const shellClass = onPage
    ? "inline-flex max-w-full flex-wrap justify-end gap-0.5 rounded-full border border-line/80 bg-mint/50 p-0.5"
    : "inline-flex max-w-full flex-wrap justify-end gap-0.5 rounded-full border border-white/12 bg-white/[0.06] p-0.5";

  return (
    <div role="radiogroup" aria-label="Getting around" className={shellClass}>
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={busy}
            title={option.description}
            onClick={() => onChange(option.id)}
            className={
              onPage
                ? `rounded-full px-2 py-1 text-[0.6875rem] font-bold leading-none transition focus:outline-none focus:ring-2 focus:ring-koi/20 disabled:opacity-50 sm:px-2.5 sm:text-xs ${
                    selected ? "bg-white text-ink shadow-sm" : "text-slate/70 hover:text-ink"
                  }`
                : `rounded-full px-2 py-1 text-[0.6875rem] font-bold leading-none transition focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 sm:px-2.5 sm:text-xs ${
                    selected ? "bg-koi text-white shadow-[0_4px_14px_rgba(255,90,0,0.28)]" : "text-white/55 hover:text-white/85"
                  }`
            }
          >
            {SEGMENT_LABELS[option.id]}
          </button>
        );
      })}
    </div>
  );
}
