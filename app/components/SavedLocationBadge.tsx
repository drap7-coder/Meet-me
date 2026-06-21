type Props = {
  label: string;
  compact?: boolean;
  className?: string;
};

function LocationPinIcon({ className = "text-watch" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-3.5 w-3.5 shrink-0 ${className}`} fill="currentColor">
      <path d="M12 2a6 6 0 0 0-6 6c0 4.5 6 12 6 12s6-7.5 6-12a6 6 0 0 0-6-6Zm0 8.25A2.25 2.25 0 1 1 12 6a2.25 2.25 0 0 1 0 4.5Z" />
    </svg>
  );
}

export { LocationPinIcon };

export function SavedLocationBadge({ label, compact = false, className = "" }: Props) {
  const trimmed = label.trim();
  if (!trimmed) return null;

  const labelClass = "min-w-0 flex-1 truncate text-sm font-semibold leading-5 text-[#003E7A]";

  if (compact) {
    return (
      <div
        className={`inline-flex max-w-full min-w-0 items-center gap-2 rounded-full border border-[#9FC5F5] bg-[#E3EFFF] px-3 py-1.5 ${className}`}
        aria-live="polite"
        title={trimmed}
      >
        <LocationPinIcon />
        <span className={labelClass}>{trimmed}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex w-full min-w-0 items-center gap-2 border-t border-[#B8D4F8] bg-[#E3EFFF] px-3 py-2.5 sm:px-4 ${className}`}
      aria-live="polite"
      title={trimmed}
    >
      <LocationPinIcon />
      <span className={labelClass}>{trimmed}</span>
    </div>
  );
}
