type Props = {
  label: string;
  compact?: boolean;
  className?: string;
};

function LocationPinIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-watch" fill="currentColor">
      <path d="M12 2a6 6 0 0 0-6 6c0 4.5 6 12 6 12s6-7.5 6-12a6 6 0 0 0-6-6Zm0 8.25A2.25 2.25 0 1 1 12 6a2.25 2.25 0 0 1 0 4.5Z" />
    </svg>
  );
}

export function SavedLocationBadge({ label, compact = false, className = "" }: Props) {
  const trimmed = label.trim();
  if (!trimmed) return null;

  if (compact) {
    return (
      <div
        className={`inline-flex max-w-full items-center gap-2 rounded-full border border-watch/20 bg-[#F0F7FF] px-3 py-1.5 ${className}`}
        aria-live="polite"
      >
        <LocationPinIcon />
        <span className="truncate text-sm font-bold text-watch drop-shadow-[0_0_10px_rgba(10,132,255,0.35)]">
          {trimmed}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 border-t border-watch/15 bg-[#F0F7FF] px-3 py-2 sm:px-4 ${className}`}
      aria-live="polite"
    >
      <span className="inline-flex items-center gap-1 rounded-full bg-watch/10 px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-slate">
        <LocationPinIcon />
        Location
      </span>
      <span className="min-w-0 truncate text-sm font-bold text-watch drop-shadow-[0_0_10px_rgba(10,132,255,0.35)]">
        {trimmed}
      </span>
    </div>
  );
}
