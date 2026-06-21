"use client";

import type { TrendingCardDisplay } from "@/lib/trendingSearches";

type Props = {
  icon: string;
  title: string;
  subtitle: string;
  accent: TrendingCardDisplay["accent"];
  disabled?: boolean;
  onClick: () => void;
};

export function KoiExampleSearchCard({ icon, title, subtitle, accent, disabled = false, onClick }: Props) {
  const browseCardClassName =
    "group border border-white/15 bg-white/[0.03] shadow-none transition hover:border-white/22 hover:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60";

  const iconShellClass =
    accent === "watch"
      ? "bg-ink shadow-[0_8px_20px_rgba(10,19,35,0.22)] group-hover:bg-[#152238] group-hover:shadow-[0_10px_24px_rgba(10,19,35,0.28)]"
      : "bg-clay shadow-[0_8px_20px_rgba(214,90,46,0.26)] group-hover:bg-[#C44E28] group-hover:shadow-[0_10px_24px_rgba(214,90,46,0.32)]";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`${browseCardClassName} flex w-full min-w-0 items-start gap-3 rounded-[18px] p-3.5 text-left font-sans sm:gap-4 sm:p-4`}
    >
      <span
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-[1.35rem] leading-none transition duration-200 group-hover:scale-[1.04] sm:h-14 sm:w-14 sm:text-[1.5rem] ${iconShellClass}`}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 pt-0.5">
        <span className="block text-base font-bold leading-snug tracking-[-0.025em] text-white">{title}</span>
        <span className="mt-1 block text-sm font-medium leading-5 tracking-[-0.01em] text-white/65">{subtitle}</span>
      </span>
    </button>
  );
}
