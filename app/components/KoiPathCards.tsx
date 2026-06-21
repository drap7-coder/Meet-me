"use client";

type Props = {
  busy?: boolean;
  onGoSomewhere: () => void;
  onWatchSomething: () => void;
  onFindEvents: () => void;
};

const cardClassName =
  "koi-premium-card group flex min-w-0 items-center gap-4 px-4 py-5 text-left font-sans transition hover:bg-white/[0.06] focus:outline-none focus:ring-4 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60 sm:gap-5 sm:px-5 sm:py-6";

const iconShellBase =
  "grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-[1.35rem] leading-none transition duration-200 group-hover:scale-[1.03] sm:h-14 sm:w-14 sm:text-[1.5rem]";

const placesIconShellClass = `${iconShellBase} bg-koi/15 text-koi`;
const watchIconShellClass = `${iconShellBase} bg-watch/15 text-watch`;
const eventsIconShellClass = `${iconShellBase} bg-events/15 text-events`;

export function KoiPathCards({ busy = false, onGoSomewhere, onWatchSomething, onFindEvents }: Props) {
  return (
    <section className="w-full min-w-0" aria-label="Choose places, events, or watch">
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
        <button type="button" disabled={busy} onClick={onGoSomewhere} className={cardClassName}>
          <span className={placesIconShellClass} aria-hidden="true">
            🗺️
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-bold leading-tight tracking-[-0.025em] text-white sm:text-xl">Go Somewhere</span>
            <span className="mt-1 block text-sm font-medium leading-6 tracking-[-0.01em] text-white/60">
              Restaurants, drinks, activities, and halfway meetups.
            </span>
          </span>
        </button>

        <button type="button" disabled={busy} onClick={onFindEvents} className={cardClassName}>
          <span className={eventsIconShellClass} aria-hidden="true">
            🎪
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-bold leading-tight tracking-[-0.025em] text-white sm:text-xl">Find Events</span>
            <span className="mt-1 block text-sm font-medium leading-6 tracking-[-0.01em] text-white/60">
              Street fairs, farmers markets, festivals, and local happenings.
            </span>
          </span>
        </button>

        <button type="button" disabled={busy} onClick={onWatchSomething} className={cardClassName}>
          <span className={watchIconShellClass} aria-hidden="true">
            📺
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-bold leading-tight tracking-[-0.025em] text-white sm:text-xl">Watch Something</span>
            <span className="mt-1 block text-sm font-medium leading-6 tracking-[-0.01em] text-white/60">
              Movies, TV shows, and streaming picks from TMDB.
            </span>
          </span>
        </button>
      </div>
    </section>
  );
}
