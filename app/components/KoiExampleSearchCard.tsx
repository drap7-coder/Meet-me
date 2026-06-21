"use client";

type CardAccent = "places" | "watch";

type Props = {
  icon: string;
  title: string;
  subtitle: string;
  accent: CardAccent;
  featured?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

export function KoiExampleSearchCard({
  icon,
  title,
  subtitle,
  accent,
  featured = false,
  disabled = false,
  onClick
}: Props) {
  const browseCardClassName = featured
    ? "group koi-featured-outline koi-premium-card shadow-none transition hover:bg-koi/10 focus:outline-none focus:ring-4 focus:ring-koi/15 disabled:cursor-not-allowed disabled:opacity-60"
    : "group koi-premium-card shadow-none transition hover:bg-white/[0.06] focus:outline-none focus:ring-4 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60";

  const iconShellBase =
    "grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-[1.35rem] leading-none transition duration-200 group-hover:scale-[1.03] sm:h-14 sm:w-14 sm:text-[1.5rem]";

  const iconShellClass =
    accent === "watch" ? `${iconShellBase} bg-watch/15 text-watch` : `${iconShellBase} bg-koi/15 text-koi`;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`${browseCardClassName} flex w-full min-w-0 items-start gap-3 p-3.5 text-left font-sans sm:gap-4 sm:p-4`}
    >
      <span className={iconShellClass} aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0 flex-1 pt-0.5">
        {featured ? (
          <span className="mb-1 inline-flex rounded-full bg-koi/15 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-koi">
            Fair Meetup
          </span>
        ) : null}
        <span className="block text-base font-bold leading-snug tracking-[-0.025em] text-white">{title}</span>
        <span className="mt-1 block text-sm font-medium leading-5 tracking-[-0.01em] text-white/60">{subtitle}</span>
      </span>
    </button>
  );
}
