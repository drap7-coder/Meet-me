"use client";

import { LocationPinIcon } from "@/app/components/SavedLocationBadge";
import { TravelModeSelector } from "@/app/components/TravelModeSelector";
import type { TravelMode } from "@/lib/types";

type Props = {
  locationLabel: string;
  onChangeLocation: () => void;
  travelMode: TravelMode;
  onTravelModeChange: (mode: TravelMode) => void;
  busy?: boolean;
  surface?: "hero" | "page";
};

/**
 * Primary search context — location and travel mode — surfaced first so users
 * always know where Koi is searching from and how results are ranked.
 */
export function SearchContextStrip({
  locationLabel,
  onChangeLocation,
  travelMode,
  onTravelModeChange,
  busy = false,
  surface = "hero"
}: Props) {
  const onPage = surface === "page";
  const trimmed = locationLabel.trim();
  const hasLocation = Boolean(trimmed);

  const shellClass = onPage
    ? "flex flex-col gap-3 rounded-[20px] border border-line/80 bg-white px-4 py-3 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:gap-5"
    : "flex flex-col gap-3 rounded-[20px] border border-white/12 bg-white/[0.07] px-4 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.16)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:gap-5";

  const dividerClass = onPage
    ? "border-t border-line/60 pt-3 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0"
    : "border-t border-white/10 pt-3 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0";

  const sectionLabelClass = onPage
    ? "text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-slate/55"
    : "text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-white/45";

  const locationValueClass = onPage ? "truncate font-semibold text-ink" : "truncate font-semibold text-white";
  const mutedClass = onPage ? "text-sm font-medium text-slate/70" : "text-sm font-medium text-white/55";
  const actionClass = onPage
    ? "shrink-0 text-sm font-semibold text-koi transition hover:text-koi-hover disabled:opacity-50"
    : "shrink-0 text-sm font-semibold text-koi transition hover:text-koi-hover disabled:opacity-50";
  const pinClass = onPage ? "text-koi" : "text-koi drop-shadow-[0_0_8px_rgba(255,90,0,0.45)]";

  return (
    <div className={shellClass} role="region" aria-label="Your location and travel mode">
      <div className="min-w-0 flex-1">
        <p className={sectionLabelClass}>Location</p>
        <div className="mt-1 flex min-w-0 items-center gap-2">
          {hasLocation ? (
            <>
              <LocationPinIcon className={`h-4 w-4 shrink-0 ${pinClass}`} />
              <span className={`min-w-0 ${locationValueClass}`} title={trimmed}>
                {trimmed}
              </span>
              <button type="button" onClick={onChangeLocation} disabled={busy} className={actionClass}>
                Change
              </button>
            </>
          ) : (
            <>
              <span className={mutedClass}>Set where you are</span>
              <button type="button" onClick={onChangeLocation} disabled={busy} className={actionClass}>
                Add location
              </button>
            </>
          )}
        </div>
      </div>

      <div className={`flex shrink-0 flex-col gap-1 sm:min-w-[10.5rem] ${dividerClass}`}>
        <p className={sectionLabelClass}>Getting around</p>
        <div className="flex items-center">
          <TravelModeSelector
            value={travelMode}
            onChange={onTravelModeChange}
            busy={busy}
            surface={surface}
          />
        </div>
      </div>
    </div>
  );
}
