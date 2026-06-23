type ModePickChipProps = {
  emoji: string;
  title: string;
  subtitle: string;
  selected: boolean;
  busy: boolean;
  onPage?: boolean;
  tone: "streaming" | "explore";
  onPick: () => void;
};

export function ModePickChip({
  emoji,
  title,
  subtitle,
  selected,
  busy,
  onPage = false,
  tone,
  onPick
}: ModePickChipProps) {
  const streamingSelected = tone === "streaming" && selected;
  const exploreSelected = tone === "explore" && selected;

  const heroClass = [
    "koi-mode-chip group flex w-full min-w-0 items-start gap-3 rounded-2xl px-3.5 py-3 text-left focus:outline-none focus:ring-4 focus:ring-koi/15 disabled:cursor-not-allowed disabled:opacity-40",
    streamingSelected && "koi-mode-chip--streaming",
    exploreSelected && "koi-mode-chip--explore"
  ]
    .filter(Boolean)
    .join(" ");

  const pageClass = [
    "koi-mode-chip-page group flex w-full min-w-0 items-start gap-3 rounded-2xl px-3.5 py-3 text-left focus:outline-none focus:ring-4 focus:ring-koi/15 disabled:cursor-not-allowed disabled:opacity-40",
    streamingSelected && "koi-mode-chip-page--streaming",
    exploreSelected && "koi-mode-chip-page--explore"
  ]
    .filter(Boolean)
    .join(" ");

  const iconClass = onPage
    ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-white text-xl leading-none shadow-soft ring-1 ring-line/50"
    : "koi-mode-chip__icon flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] text-xl leading-none";

  const titleClass = onPage ? "text-sm font-bold leading-tight text-ink" : "text-sm font-bold leading-tight text-white";
  const subtitleClass = onPage ? "text-xs font-medium leading-snug text-slate/70" : "text-xs font-medium leading-snug text-white/58";

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
      <span className="grid min-w-0 gap-1 pt-0.5">
        <span className={titleClass}>{title}</span>
        <span className={subtitleClass}>{subtitle}</span>
      </span>
    </button>
  );
}
