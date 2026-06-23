"use client";

import { LocationPinIcon } from "@/app/components/SavedLocationBadge";

type Props = {
  label: string;
  onChange: () => void;
  busy?: boolean;
};

export function PersistentLocationBar({ label, onChange, busy = false }: Props) {
  const trimmed = label.trim();

  if (!trimmed) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-0.5 text-sm">
        <span className="font-medium text-white/50">No saved location</span>
        <button
          type="button"
          onClick={onChange}
          disabled={busy}
          className="font-bold text-koi transition hover:text-koi-hover disabled:opacity-50"
        >
          Set location
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-0.5 text-sm">
      <LocationPinIcon className="h-3.5 w-3.5 text-white/45" />
      <span className="font-medium text-white/55">Location:</span>
      <span className="font-semibold text-white/85" title={trimmed}>
        {trimmed}
      </span>
      <span className="text-koi" aria-hidden="true">
        ✓
      </span>
      <button
        type="button"
        onClick={onChange}
        disabled={busy}
        className="ml-1 font-bold text-white/60 underline decoration-white/25 underline-offset-2 transition hover:text-white/90 disabled:opacity-50"
      >
        Change
      </button>
    </div>
  );
}
