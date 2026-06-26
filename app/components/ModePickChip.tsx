type ModeTone = "streaming" | "explore" | "halfway";

type ModePickChipProps = {
  emoji: string;
  title: string;
  subtitle: string;
  selected: boolean;
  busy: boolean;
  onPage?: boolean;
  tone: ModeTone;
  onPick: () => void;
  className?: string;
};

export function ModePickChip({
  emoji,
  title,
  subtitle,
  selected,
  busy,
  onPage = false,
  tone,
  onPick,
  className = ""
}: ModePickChipProps) {
  const heroClass = [
    "koi-mode-chip group flex w-full min-w-0 flex-row items-center gap-2.5 rounded-[1rem] px-2.5 py-2.5 text-left text-white min-h-[4.75rem] sm:min-h-[5.25rem] sm:flex-col sm:items-center sm:justify-center sm:gap-2 sm:rounded-[1.15rem] sm:px-3 sm:py-3.5 sm:text-center focus:outline-none focus:ring-4 focus:ring-koi/15 disabled:cursor-not-allowed disabled:opacity-40",
    `koi-mode-chip--${tone}`,
    selected && "koi-mode-chip--selected",
    className
  ]
    .filter(Boolean)
    .join(" ");

  const pageClass = [
    "koi-mode-chip-page group flex w-full min-w-0 flex-row items-center gap-2.5 rounded-[1rem] px-2.5 py-2.5 text-left min-h-[4.75rem] sm:min-h-[5.25rem] sm:flex-col sm:items-center sm:justify-center sm:gap-2 sm:rounded-[1.15rem] sm:px-3 sm:py-3.5 sm:text-center focus:outline-none focus:ring-4 focus:ring-koi/15 disabled:cursor-not-allowed disabled:opacity-40",
    `koi-mode-chip-page--${tone}`,
    selected && "koi-mode-chip-page--selected",
    className
  ]
    .filter(Boolean)
    .join(" ");

  const emojiClass = onPage
    ? `koi-mode-chip-page__emoji koi-mode-chip-page__emoji--${tone} flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.85rem] text-[1.45rem] leading-none sm:h-12 sm:w-12 sm:rounded-[1rem] sm:text-[1.85rem]`
    : `koi-mode-chip__emoji koi-mode-chip__emoji--${tone} flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.85rem] text-[1.45rem] leading-none sm:h-12 sm:w-12 sm:rounded-[1rem] sm:text-[1.85rem]`;

  const titleClass = onPage ? "text-[0.8125rem] font-bold leading-tight text-ink sm:text-sm" : "text-[0.8125rem] font-bold leading-tight text-white sm:text-sm";
  const subtitleClass = onPage
    ? "text-[0.625rem] font-medium leading-snug text-slate/75 sm:text-[0.6875rem]"
    : "text-[0.625rem] font-medium leading-snug text-white/80 sm:text-[0.6875rem]";

  return (
    <button
      type="button"
      disabled={busy}
      onClick={onPick}
      aria-pressed={selected}
      aria-label={`${title}: ${subtitle}`}
      className={onPage ? pageClass : heroClass}
    >
      <span className={emojiClass} aria-hidden="true">
        {emoji}
      </span>
      <span className="grid min-w-0 flex-1 gap-0.5 sm:flex-none sm:px-1">
        <span className={titleClass}>{title}</span>
        <span className={subtitleClass}>{subtitle}</span>
      </span>
    </button>
  );
}
