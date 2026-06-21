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
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21s7-4.6 7-11a7 7 0 1 0-14 0c0 6.4 7 11 7 11z" fill="currentColor" stroke="none" opacity="0.3" />
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
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="13" rx="2.5" fill="currentColor" stroke="none" opacity="0.3" />
      <rect x="3" y="5" width="18" height="13" rx="2.5" />
      <path d="M8 21h8" />
      <path d="M12 18v3" />
      <path d="m10 9.5 4 2.25-4 2.25V9.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

const iconShellClass =
  "grid h-[5.5rem] w-[5.5rem] shrink-0 place-items-center rounded-full transition duration-200 group-hover:scale-[1.05] sm:h-24 sm:w-24";

const iconClassName = "h-12 w-12 sm:h-14 sm:w-14";

const goIconShellClass =
  "bg-clay text-white shadow-[0_14px_32px_rgba(214,90,46,0.42)] group-hover:bg-[#C44E28] group-hover:shadow-[0_18px_40px_rgba(214,90,46,0.48)]";

const watchIconShellClass =
  "bg-ink text-white shadow-[0_14px_32px_rgba(10,19,35,0.36)] ring-2 ring-white/20 group-hover:bg-[#152238] group-hover:shadow-[0_18px_40px_rgba(10,19,35,0.42)]";

const cardClassName =
  "group flex min-w-0 items-center gap-4 rounded-[20px] border border-white/20 bg-[#111c30] px-4 py-5 text-left font-sans shadow-[0_10px_26px_rgba(0,0,0,0.18)] transition hover:border-white/30 hover:bg-[#162238] hover:shadow-[0_14px_34px_rgba(0,0,0,0.24)] focus:outline-none focus:ring-4 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60 sm:gap-5 sm:px-5 sm:py-6";

export function KoiPathCards({ busy = false, onGoSomewhere, onWatchSomething }: Props) {
  return (
    <section className="w-full min-w-0" aria-label="Choose places or watch">
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={busy}
          onClick={onGoSomewhere}
          className={cardClassName}
        >
          <span className={`${iconShellClass} ${goIconShellClass}`}>
            <GoSomewhereIcon className={iconClassName} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-bold leading-tight tracking-[-0.025em] text-white sm:text-xl">Go Somewhere</span>
            <span className="mt-1 block text-sm font-medium leading-6 tracking-[-0.01em] text-white/65">
              Restaurants, coffee, drinks, activities, and halfway meetups.
            </span>
          </span>
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={onWatchSomething}
          className={cardClassName}
        >
          <span className={`${iconShellClass} ${watchIconShellClass}`}>
            <WatchSomethingIcon className={iconClassName} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-bold leading-tight tracking-[-0.025em] text-white sm:text-xl">Watch Something</span>
            <span className="mt-1 block text-sm font-medium leading-6 tracking-[-0.01em] text-white/65">
              Movies, TV shows, sports, and streaming picks.
            </span>
          </span>
        </button>
      </div>
    </section>
  );
}
