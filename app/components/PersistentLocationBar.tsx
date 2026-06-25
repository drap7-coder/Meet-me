"use client";

import { LocationPinIcon } from "@/app/components/SavedLocationBadge";
import type { ReactNode } from "react";

type Props = {
  label: string;
  onChange: () => void;
  busy?: boolean;
  surface?: "hero" | "page";
  /** Optional trailing control rendered on the same row (e.g. travel mode). */
  trailing?: ReactNode;
};

export function PersistentLocationBar({ label, onChange, busy = false, surface = "hero", trailing }: Props) {
  const onPage = surface === "page";
  const trimmed = label.trim();
  const mutedClass = onPage ? "font-medium text-slate/70" : "font-medium text-white/50";
  const labelClass = onPage ? "font-medium text-slate" : "font-medium text-white/55";
  const selectedClass = onPage
    ? "font-black text-koi"
    : "font-black text-koi drop-shadow-[0_0_10px_rgba(255,90,0,0.55)]";
  const changeClass = onPage
    ? "ml-1 font-bold text-slate underline decoration-line underline-offset-2 transition hover:text-ink disabled:opacity-50"
    : "ml-1 font-bold text-white/60 underline decoration-white/25 underline-offset-2 transition hover:text-white/90 disabled:opacity-50";

  if (!trimmed) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-0.5 text-sm">
        <span className={mutedClass}>No saved location</span>
        <button
          type="button"
          onClick={onChange}
          disabled={busy}
          className="font-bold text-koi transition hover:text-koi-hover disabled:opacity-50"
        >
          Set location
        </button>
        {trailing ? <span className="ml-auto">{trailing}</span> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-0.5 text-sm">
      <LocationPinIcon className={`h-3.5 w-3.5 ${selectedClass}`} />
      <span className={labelClass}>Location:</span>
      <span className={selectedClass} title={trimmed}>
        {trimmed}
      </span>
      <span className="font-black text-koi" aria-hidden="true">
        ✓
      </span>
      <button type="button" onClick={onChange} disabled={busy} className={changeClass}>
        Change
      </button>
      {trailing ? <span className="ml-auto">{trailing}</span> : null}
    </div>
  );
}
