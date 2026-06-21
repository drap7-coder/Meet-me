"use client";

import { CategoryIcon } from "@/app/components/CategoryIcon";
import {
  getBrowseLaneById,
  KOI_BROWSE_LANES,
  type KoiBrowseLaneId,
  type KoiBrowseOption
} from "@/lib/koiBrowse";
import { useEffect, useRef } from "react";

type Props = {
  activeLaneId: KoiBrowseLaneId;
  selectedQuery: string;
  busy?: boolean;
  onLaneChange: (laneId: KoiBrowseLaneId) => void;
  onSelect: (option: KoiBrowseOption) => void;
};

export function KoiBrowseSelector({
  activeLaneId,
  selectedQuery,
  busy = false,
  onLaneChange,
  onSelect
}: Props) {
  const chipPanelRef = useRef<HTMLDivElement | null>(null);
  const activeLane = getBrowseLaneById(activeLaneId);
  const normalizedSelection = selectedQuery.trim().toLowerCase();

  useEffect(() => {
    requestAnimationFrame(() => {
      chipPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, [activeLaneId]);

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {KOI_BROWSE_LANES.map((lane) => {
          const selected = lane.id === activeLaneId;
          return (
            <button
              key={lane.id}
              type="button"
              disabled={busy}
              onClick={() => onLaneChange(lane.id)}
              aria-pressed={selected}
              aria-selected={selected}
              className={`category-card group flex min-w-0 items-center rounded-[20px] border-2 bg-white px-4 py-5 text-left shadow-[0_10px_26px_rgba(17,24,39,0.04)] transition hover:border-ink/25 hover:shadow-soft focus:outline-none focus:ring-4 focus:ring-clay/10 sm:px-5 sm:py-6 ${
                selected
                  ? "selected border-[var(--mmh-coral)] !bg-[#EDFFED] text-ink !shadow-[0_0_0_4px_rgba(46,204,64,0.10),0_14px_30px_rgba(46,204,64,0.12)]"
                  : lane.featured
                    ? "border-clay/35 bg-[#F5FFF5] hover:border-clay/50"
                    : "border-[#D8DDE6] text-ink"
              }`}
            >
              <div className="flex min-w-0 items-center gap-4">
                <span
                  className={`category-icon-wrapper grid h-14 w-14 shrink-0 place-items-center rounded-full transition sm:h-16 sm:w-16 ${
                    selected
                      ? "bg-[var(--mmh-coral)] text-white shadow-[0_10px_22px_rgba(46,204,64,0.24)]"
                      : "bg-[#F7F1E8] text-slate group-hover:bg-[#EDFFED] group-hover:text-clay"
                  }`}
                >
                  <CategoryIcon
                    category={lane.iconCategory}
                    className={`category-icon h-6 w-6 sm:h-7 sm:w-7 ${selected ? "text-white" : ""}`}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="category-title block text-lg font-black text-ink sm:text-xl">{lane.label}</span>
                  <span className="mt-1 block text-sm font-semibold leading-6 text-slate">{lane.description}</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div
        ref={chipPanelRef}
        className="grid gap-2 rounded-[22px] border border-[#D8DDE6] bg-white p-3 shadow-[0_12px_30px_rgba(18,50,74,0.05)] sm:p-4"
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {activeLane.options.map((option) => {
            const selected = option.query.trim().toLowerCase() === normalizedSelection;
            return (
              <button
                key={option.id}
                type="button"
                disabled={busy}
                onClick={() => onSelect(option)}
                aria-pressed={selected}
                aria-selected={selected}
                className={`category-card rounded-[16px] border-2 px-3 py-3 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-clay/10 disabled:cursor-not-allowed disabled:opacity-60 ${
                  selected
                    ? "selected border-[var(--mmh-coral)] !bg-[#EDFFED] text-ink !shadow-[0_0_0_4px_rgba(46,204,64,0.10)]"
                    : "border-[#D8DDE6] bg-white text-ink hover:border-ink/25 hover:bg-sky"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
