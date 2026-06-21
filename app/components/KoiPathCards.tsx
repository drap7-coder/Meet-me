"use client";

type Props = {
  busy?: boolean;
  onGoSomewhere: () => void;
  onWatchSomething: () => void;
};

const browseCardClassName =
  "group border border-white/15 bg-white/[0.03] shadow-none transition hover:border-white/22 hover:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60";

const cardClassName = `${browseCardClassName} flex min-w-0 items-center gap-4 rounded-md px-4 py-5 text-left font-sans shadow-[3px_3px_0_rgba(0,0,0,0.28)] sm:gap-5 sm:px-5 sm:py-6`;

const iconShellClassName =
  "grid h-12 w-12 shrink-0 place-items-center rounded-full text-[1.35rem] leading-none transition duration-200 group-hover:scale-[1.04] sm:h-14 sm:w-14 sm:text-[1.5rem]";

const placesIconShellClass = `${iconShellClassName} rounded-md bg-clay shadow-[3px_3px_0_rgba(0,0,0,0.35)] group-hover:bg-[#C44E28]`;

const watchIconShellClass = `${iconShellClassName} rounded-md bg-fluoro-cyan/20 text-fluoro-cyan shadow-[3px_3px_0_rgba(0,0,0,0.35)] ring-2 ring-fluoro-cyan/50 group-hover:bg-fluoro-cyan/30`;

export function KoiPathCards({ busy = false, onGoSomewhere, onWatchSomething }: Props) {
  return (
    <section className="w-full min-w-0" aria-label="Choose places or watch">
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        <button type="button" disabled={busy} onClick={onGoSomewhere} className={cardClassName}>
          <span className={placesIconShellClass} aria-hidden="true">
            📍
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-bold leading-tight tracking-[-0.025em] text-white sm:text-xl">Go Somewhere</span>
            <span className="mt-1 block text-sm font-medium leading-6 tracking-[-0.01em] text-white/65">
              Restaurants, coffee, drinks, activities, and halfway meetups.
            </span>
          </span>
        </button>

        <button type="button" disabled={busy} onClick={onWatchSomething} className={cardClassName}>
          <span className={watchIconShellClass} aria-hidden="true">
            📺
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
