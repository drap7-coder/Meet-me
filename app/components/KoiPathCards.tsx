"use client";

import type { ReactNode } from "react";

type Props = {
  busy?: boolean;
  onGoSomewhere: () => void;
  onWatchSomething: () => void;
};

function PathIconBadge({
  variant,
  children
}: {
  variant: "go" | "watch";
  children: ReactNode;
}) {
  const shellClass =
    variant === "go"
      ? "bg-gradient-to-br from-[#FF8657] via-clay to-[#B94A22] shadow-[0_0_0_1px_rgba(255,255,255,0.34)_inset,0_0_0_1px_rgba(255,255,255,0.14),0_22px_48px_rgba(214,90,46,0.58)] group-hover:shadow-[0_0_0_1px_rgba(255,255,255,0.42)_inset,0_0_0_1px_rgba(255,255,255,0.18),0_28px_56px_rgba(214,90,46,0.68)]"
      : "bg-gradient-to-br from-[#24344F] via-ink to-[#060B14] shadow-[0_0_0_1px_rgba(255,255,255,0.28)_inset,0_0_0_1px_rgba(255,255,255,0.12),0_22px_48px_rgba(10,19,35,0.62)] group-hover:shadow-[0_0_0_1px_rgba(255,255,255,0.36)_inset,0_0_0_1px_rgba(255,255,255,0.16),0_28px_56px_rgba(10,19,35,0.72)]";

  const glowClass =
    variant === "go"
      ? "bg-[radial-gradient(circle,rgba(255,196,160,0.55)_0%,rgba(214,90,46,0.18)_42%,transparent_72%)]"
      : "bg-[radial-gradient(circle,rgba(164,184,214,0.42)_0%,rgba(10,19,35,0.22)_42%,transparent_72%)]";

  return (
    <span className="relative grid h-[5.25rem] w-[5.25rem] shrink-0 place-items-center sm:h-[6.75rem] sm:w-[6.75rem]">
      <span className={`pointer-events-none absolute inset-[-10%] rounded-full opacity-90 blur-md transition duration-300 group-hover:opacity-100 ${glowClass}`} />
      <span
        className={`relative grid h-full w-full place-items-center rounded-full ring-[3px] ring-white/25 transition duration-300 group-hover:scale-[1.04] ${shellClass}`}
      >
        <span className="pointer-events-none absolute inset-[7px] rounded-full border border-white/25 bg-white/10" />
        {children}
      </span>
    </span>
  );
}

function GoSomewhereIcon({ className = "h-[3.4rem] w-[3.4rem] sm:h-[4.35rem] sm:w-[4.35rem]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 64" className={`relative z-[1] ${className}`} fill="none">
      <path
        d="M32 54s18-11.8 18-28.5C50 14.8 42.2 8 32 8S14 14.8 14 25.5C14 42.2 32 54 32 54Z"
        fill="url(#go-pin-fill)"
      />
      <path
        d="M32 54s18-11.8 18-28.5C50 14.8 42.2 8 32 8S14 14.8 14 25.5C14 42.2 32 54 32 54Z"
        stroke="rgba(255,255,255,0.92)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="25" r="7.5" fill="#FFFDF8" />
      <circle cx="32" cy="25" r="3.2" fill="#D65A2E" />
      <path
        d="M14 47c6.5-4.2 11.8-6.2 18-6.2s11.5 2 18 6.2"
        stroke="rgba(255,255,255,0.72)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="18" cy="47" r="2.4" fill="#FFFDF8" />
      <circle cx="46" cy="47" r="2.4" fill="#FFFDF8" />
      <defs>
        <linearGradient id="go-pin-fill" x1="18" y1="10" x2="46" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF4EC" />
          <stop offset="1" stopColor="#FFD8C4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function WatchSomethingIcon({ className = "h-[3.4rem] w-[3.4rem] sm:h-[4.35rem] sm:w-[4.35rem]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 64" className={`relative z-[1] ${className}`} fill="none">
      <rect x="10" y="14" width="44" height="30" rx="6" fill="url(#watch-screen-fill)" />
      <rect x="10" y="14" width="44" height="30" rx="6" stroke="rgba(255,255,255,0.92)" strokeWidth="2.5" />
      <path d="M18 48h28" stroke="rgba(255,255,255,0.82)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 44v8" stroke="rgba(255,255,255,0.82)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M27.5 22.5 41 29 27.5 35.5V22.5Z" fill="#0A1323" stroke="#FFFDF8" strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="22" cy="20" rx="8" ry="4.5" fill="rgba(255,255,255,0.18)" />
      <circle cx="47" cy="20" r="2" fill="rgba(255,255,255,0.55)" />
      <circle cx="41" cy="20" r="2" fill="rgba(255,255,255,0.35)" />
      <defs>
        <linearGradient id="watch-screen-fill" x1="10" y1="14" x2="54" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5F7390" />
          <stop offset="1" stopColor="#24344F" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const browseCardClassName =
  "group border border-white/15 bg-white/[0.03] shadow-none transition hover:border-white/22 hover:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60";

const cardClassName = `${browseCardClassName} flex min-w-0 items-center gap-4 rounded-[20px] px-4 py-5 text-left font-sans sm:gap-5 sm:px-5 sm:py-6`;

export function KoiPathCards({ busy = false, onGoSomewhere, onWatchSomething }: Props) {
  return (
    <section className="w-full min-w-0" aria-label="Choose places or watch">
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        <button type="button" disabled={busy} onClick={onGoSomewhere} className={cardClassName}>
          <PathIconBadge variant="go">
            <GoSomewhereIcon />
          </PathIconBadge>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-bold leading-tight tracking-[-0.025em] text-white sm:text-xl">Go Somewhere</span>
            <span className="mt-1 block text-sm font-medium leading-6 tracking-[-0.01em] text-white/65">
              Restaurants, coffee, drinks, activities, and halfway meetups.
            </span>
          </span>
        </button>

        <button type="button" disabled={busy} onClick={onWatchSomething} className={cardClassName}>
          <PathIconBadge variant="watch">
            <WatchSomethingIcon />
          </PathIconBadge>
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
