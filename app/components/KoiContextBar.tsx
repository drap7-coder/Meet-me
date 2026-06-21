"use client";

import { fetchContextInsight, type ContextInsight } from "@/lib/contextInsight";
import type { LatLng } from "@/lib/types";
import { useEffect, useState } from "react";

type Props = {
  coordinates?: LatLng;
  mode?: "places" | "watch";
};

export function KoiContextBar({ coordinates, mode = "places" }: Props) {
  const [insight, setInsight] = useState<ContextInsight | null>(null);

  useEffect(() => {
    let active = true;
    void fetchContextInsight(coordinates, mode).then((next) => {
      if (active) setInsight(next);
    });
    return () => {
      active = false;
    };
  }, [coordinates?.lat, coordinates?.lng, mode]);

  if (!insight) return null;

  return (
    <div
      className="flex min-h-10 items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/80 shadow-[0_8px_24px_rgba(0,0,0,0.18)] sm:min-h-11"
      aria-live="polite"
    >
      <span className="shrink-0 text-base leading-none" aria-hidden="true">
        {insight.icon}
      </span>
      <p className="min-w-0 font-medium leading-snug tracking-[-0.01em]">{insight.message}</p>
    </div>
  );
}
