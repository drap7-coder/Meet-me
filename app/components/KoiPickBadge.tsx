type Props = {
  compact?: boolean;
  className?: string;
};

export function KoiPickBadge({ compact = false, className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-koi px-3 py-1 text-xs font-black text-white shadow-glow ring-1 ring-koi/30 ${
        compact ? "text-[0.6875rem]" : ""
      } ${className}`}
    >
      <span aria-hidden="true">⭐</span>
      Koi Pick
    </span>
  );
}
