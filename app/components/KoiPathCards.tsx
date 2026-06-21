"use client";

import { CategoryIcon } from "@/app/components/CategoryIcon";

type Props = {
  busy?: boolean;
  onGoSomewhere: () => void;
  onWatchSomething: () => void;
};

function WatchIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
      <path d="m9 10 3 2 3-2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function KoiPathCards({ busy = false, onGoSomewhere, onWatchSomething }: Props) {
  return (
    <section
      className="w-full min-w-0 overflow-hidden rounded-[22px] border border-white/15 bg-paper/96 p-5 shadow-[0_16px_40px_rgba(10,19,35,0.16),0_0_0_1px_rgba(255,255,255,0.1)_inset] sm:p-6"
      aria-label="Choose places or watch"
    >
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={busy}
          onClick={onGoSomewhere}
          className="group flex min-w-0 items-center gap-4 rounded-[20px] border-2 border-clay/35 bg-[#FFFCFA] px-4 py-5 text-left shadow-[0_10px_26px_rgba(17,24,39,0.04)] transition hover:border-clay/50 hover:shadow-[0_14px_30px_rgba(214,90,46,0.10)] focus:outline-none focus:ring-4 focus:ring-clay/10 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:py-6"
        >
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#F7F1E8] text-slate transition group-hover:bg-[#FFF4EC] group-hover:text-clay sm:h-16 sm:w-16">
            <CategoryIcon category="coffee" className="h-7 w-7 sm:h-8 sm:w-8" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-black leading-tight text-ink sm:text-xl">Go Somewhere</span>
            <span className="mt-1 block text-sm font-semibold leading-6 text-slate">
              Restaurants, coffee, drinks, activities, and halfway meetups.
            </span>
          </span>
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={onWatchSomething}
          className="group flex min-w-0 items-center gap-4 rounded-[20px] border-2 border-line bg-white px-4 py-5 text-left shadow-[0_10px_26px_rgba(17,24,39,0.04)] transition hover:border-clay/50 hover:bg-[#FFFCFA] hover:shadow-[0_14px_30px_rgba(214,90,46,0.08)] focus:outline-none focus:ring-4 focus:ring-clay/10 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:py-6"
        >
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#F7F1E8] text-slate transition group-hover:bg-[#FFF4EC] group-hover:text-clay sm:h-16 sm:w-16">
            <WatchIcon className="h-7 w-7 sm:h-8 sm:w-8" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-black leading-tight text-ink sm:text-xl">Watch Something</span>
            <span className="mt-1 block text-sm font-semibold leading-6 text-slate">
              Movies, TV shows, sports, and streaming picks.
            </span>
          </span>
        </button>
      </div>
    </section>
  );
}
