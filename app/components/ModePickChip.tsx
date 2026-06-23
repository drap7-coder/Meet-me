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
    "koi-mode-chip group flex w-full min-w-0 flex-col items-center justify-center gap-2.5 rounded-[1.35rem] px-3 py-5 text-center text-white min-h-[8.25rem] focus:outline-none focus:ring-4 focus:ring-koi/15 disabled:cursor-not-allowed disabled:opacity-40",
    `koi-mode-chip--${tone}`,
    selected && "koi-mode-chip--selected",
    className
  ]
    .filter(Boolean)
    .join(" ");

  const pageClass = [
    "koi-mode-chip-page group flex w-full min-w-0 flex-col items-center justify-center gap-2.5 rounded-[1.35rem] px-3 py-5 text-center min-h-[8.25rem] focus:outline-none focus:ring-4 focus:ring-koi/15 disabled:cursor-not-allowed disabled:opacity-40",
    `koi-mode-chip-page--${tone}`,
    selected && "koi-mode-chip-page--selected",
    className
  ]
    .filter(Boolean)
    .join(" ");

  const emojiClass = onPage
    ? `koi-mode-chip-page__emoji koi-mode-chip-page__emoji--${tone} flex h-[4.25rem] w-[4.25rem] shrink-0 items-center justify-center rounded-[1.15rem] text-[2.65rem] leading-none`
    : `koi-mode-chip__emoji koi-mode-chip__emoji--${tone} flex h-[4.25rem] w-[4.25rem] shrink-0 items-center justify-center rounded-[1.15rem] text-[2.65rem] leading-none`;

  const titleClass = onPage ? "text-sm font-bold leading-tight text-ink" : "text-sm font-bold leading-tight text-white";
  const subtitleClass = onPage
    ? "text-[0.6875rem] font-medium leading-snug text-slate/75"
    : "text-[0.6875rem] font-medium leading-snug text-white/90";

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
      <span className="grid min-w-0 gap-0.5 px-1">
        <span className={titleClass}>{title}</span>
        <span className={subtitleClass}>{subtitle}</span>
      </span>
    </button>
  );
}
