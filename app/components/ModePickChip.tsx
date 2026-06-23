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
    "koi-mode-chip group flex w-full min-w-0 items-center gap-3.5 rounded-2xl px-4 py-4 text-left min-h-[5.5rem] focus:outline-none focus:ring-4 focus:ring-koi/15 disabled:cursor-not-allowed disabled:opacity-40",
    `koi-mode-chip--${tone}`,
    selected && "koi-mode-chip--selected",
    className
  ]
    .filter(Boolean)
    .join(" ");

  const pageClass = [
    "koi-mode-chip-page group flex w-full min-w-0 items-center gap-3.5 rounded-2xl px-4 py-4 text-left min-h-[5.5rem] focus:outline-none focus:ring-4 focus:ring-koi/15 disabled:cursor-not-allowed disabled:opacity-40",
    `koi-mode-chip-page--${tone}`,
    selected && "koi-mode-chip-page--selected",
    className
  ]
    .filter(Boolean)
    .join(" ");

  const iconClass = onPage
    ? `koi-mode-chip-page__icon koi-mode-chip-page__icon--${tone} flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-[1.35rem] leading-none`
    : `koi-mode-chip__icon koi-mode-chip__icon--${tone} flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-[1.35rem] leading-none`;

  const titleClass = onPage ? "text-sm font-bold leading-tight text-ink" : "text-sm font-bold leading-tight text-white";
  const subtitleClass = onPage ? "text-xs font-medium leading-snug text-slate/75" : "text-xs font-medium leading-snug text-white/62";

  return (
    <button
      type="button"
      disabled={busy}
      onClick={onPick}
      aria-pressed={selected}
      aria-label={`${title}: ${subtitle}`}
      className={onPage ? pageClass : heroClass}
    >
      <span className={iconClass} aria-hidden="true">
        {emoji}
      </span>
      <span className="grid min-w-0 flex-1 gap-1">
        <span className={titleClass}>{title}</span>
        <span className={subtitleClass}>{subtitle}</span>
      </span>
    </button>
  );
}
