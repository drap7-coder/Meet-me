"use client";

import { KOI_DESIGN } from "@/src/config/design";

type Props = {
  minutesA?: number | null;
  minutesB?: number | null;
  labelA?: string;
  labelB?: string;
  compact?: boolean;
  className?: string;
};

export function formatFairMeetupDetail(minutesA?: number | null, minutesB?: number | null) {
  const a = typeof minutesA === "number" ? minutesA : null;
  const b = typeof minutesB === "number" ? minutesB : null;
  if (a === null || b === null) return null;
  return `${a} min • ${b} min`;
}

export function FairMeetupBadge({
  minutesA,
  minutesB,
  labelA = "You",
  labelB = "Them",
  compact = false,
  className = ""
}: Props) {
  const detail = formatFairMeetupDetail(minutesA, minutesB);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-koi/15 px-3 py-1 text-xs font-bold text-koi ring-1 ring-koi/25 ${compact ? "text-[0.6875rem]" : ""} ${className}`}
    >
      <span aria-hidden="true">⚖</span>
      <span>{KOI_DESIGN.fairMeetup.label}</span>
      {detail ? <span className="font-semibold text-koi/80">· {detail}</span> : null}
    </span>
  );
}

/** @deprecated Use FairMeetupBadge */
export const KoiMatchBadge = FairMeetupBadge;
export const formatKoiMatchDetail = formatFairMeetupDetail;
