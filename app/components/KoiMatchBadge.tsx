"use client";

type Props = {
  minutesA?: number | null;
  minutesB?: number | null;
  compact?: boolean;
  className?: string;
};

export function formatKoiMatchDetail(minutesA?: number | null, minutesB?: number | null) {
  const a = typeof minutesA === "number" ? minutesA : null;
  const b = typeof minutesB === "number" ? minutesB : null;
  if (a === null || b === null) return "Good meetup option";
  const diff = Math.abs(a - b);
  if (diff <= 10) return `${a} min • ${b} min`;
  return `${a} min • ${b} min`;
}

export function KoiMatchBadge({ minutesA, minutesB, compact = false, className = "" }: Props) {
  const detail = formatKoiMatchDetail(minutesA, minutesB);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg bg-clay/15 px-3 py-1 text-xs font-bold text-clay ring-1 ring-clay/25 ${compact ? "text-[0.6875rem]" : ""} ${className}`}
    >
      <span aria-hidden="true">⚖</span>
      <span>Koi Match</span>
      {detail ? <span className="font-semibold text-clay/80">· {detail}</span> : null}
    </span>
  );
}
