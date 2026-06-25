"use client";

import { TRAVEL_MODE_OPTIONS, travelModeChipLabel } from "@/lib/travelMode";
import type { TravelMode } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

type Props = {
  value: TravelMode;
  onChange: (mode: TravelMode) => void;
  busy?: boolean;
  surface?: "hero" | "page";
};

/**
 * Compact "Getting Around" selector that sits beside the persistent location bar.
 * This is user context (ranking + future enrichment), not a search filter — it
 * deliberately stays small and out of the main search/advanced UI.
 */
export function TravelModeSelector({ value, onChange, busy = false, surface = "hero" }: Props) {
  const onPage = surface === "page";
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function selectMode(mode: TravelMode) {
    onChange(mode);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        disabled={busy}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Getting around: ${travelModeChipLabel(value)}`}
        className={
          onPage
            ? "inline-flex items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1 text-sm font-bold text-ink shadow-soft transition hover:border-koi/40 focus:outline-none focus:ring-2 focus:ring-koi/20 disabled:opacity-50"
            : "inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-sm font-bold text-white/80 transition hover:border-white/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50"
        }
      >
        <span>{travelModeChipLabel(value)}</span>
        <span aria-hidden="true" className={`text-[0.65rem] transition ${open ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Getting around"
          className="absolute right-0 z-40 mt-1.5 w-56 overflow-hidden rounded-2xl border border-line bg-white p-1 shadow-soft"
        >
          {TRAVEL_MODE_OPTIONS.map((option) => {
            const selected = option.id === value;
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={option.disabled}
                onClick={() => !option.disabled && selectMode(option.id)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${
                  option.disabled
                    ? "cursor-not-allowed opacity-55"
                    : selected
                      ? "bg-koi/10"
                      : "hover:bg-sky"
                }`}
              >
                <span aria-hidden="true" className="text-base leading-none">
                  {option.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-ink">{option.label}</span>
                    {option.note ? (
                      <span className="rounded-full bg-slate/10 px-1.5 py-0.5 text-[0.6rem] font-black uppercase tracking-wide text-slate">
                        {option.note}
                      </span>
                    ) : null}
                  </span>
                  <span className="block text-xs font-medium text-slate">{option.description}</span>
                </span>
                {selected ? (
                  <span aria-hidden="true" className="text-sm font-black text-koi">
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
