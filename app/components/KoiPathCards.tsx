"use client";

type Props = {
  busy?: boolean;
  onGoSomewhere: () => void;
  onWatchSomething: () => void;
};

function GoSomewhereIcon({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21s7-4.6 7-11a7 7 0 1 0-14 0c0 6.4 7 11 7 11z" fill="currentColor" stroke="none" opacity="0.22" />
      <path d="M12 21s7-4.6 7-11a7 7 0 1 0-14 0c0 6.4 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WatchSomethingIcon({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="13" rx="2.5" fill="currentColor" stroke="none" opacity="0.22" />
      <rect x="3" y="5" width="18" height="13" rx="2.5" />
      <path d="M8 21h8" />
      <path d="M12 18v3" />
      <path d="m10 9.5 4 2.25-4 2.25V9.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

const iconShellClass =
  "grid h-[4.75rem] w-[4.75rem] shrink-0 place-items-center rounded-full transition duration-200 group-hover:scale-[1.03] sm:h-20 sm:w-20";

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
          className="group flex min-w-0 items-center gap-4 rounded-[20px] border-2 border-clay/35 bg-[#FFFCFA] px-4 py-5 text-left shadow-[0_10px_26px_rgba(17,24,39,0.04)] transition hover:border-clay hover:shadow-[0_14px_34px_rgba(214,90,46,0.16)] focus:outline-none focus:ring-4 focus:ring-clay/10 disabled:cursor-not-allowed disabled:opacity-60 sm:gap-5 sm:px-5 sm:py-6"
        >
          <span
            className={`${iconShellClass} bg-clay text-white shadow-[0_12px_28px_rgba(214,90,46,0.32)] group-hover:bg-[#C44E28] group-hover:shadow-[0_14px_32px_rgba(214,90,46,0.38)]`}
          >
            <GoSomewhereIcon className="h-10 w-10 sm:h-11 sm:w-11" />
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
          className="group flex min-w-0 items-center gap-4 rounded-[20px] border-2 border-line bg-white px-4 py-5 text-left shadow-[0_10px_26px_rgba(17,24,39,0.04)] transition hover:border-ink/20 hover:shadow-[0_14px_34px_rgba(10,19,35,0.14)] focus:outline-none focus:ring-4 focus:ring-clay/10 disabled:cursor-not-allowed disabled:opacity-60 sm:gap-5 sm:px-5 sm:py-6"
        >
          <span
            className={`${iconShellClass} bg-ink text-white shadow-[0_12px_28px_rgba(10,19,35,0.28)] group-hover:bg-[#152238] group-hover:shadow-[0_14px_32px_rgba(10,19,35,0.34)]`}
          >
            <WatchSomethingIcon className="h-10 w-10 sm:h-11 sm:w-11" />
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
