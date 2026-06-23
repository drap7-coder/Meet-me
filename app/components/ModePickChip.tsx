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

  const surface = onPage
    ? selected
      ? exploreSelected
        ? "border-koi/70 bg-gradient-to-br from-koi/[0.12] via-orange-50 to-paper shadow-[0_10px_28px_rgba(255,90,0,0.14)]"
        : streamingSelected
          ? "border-indigo-400/70 bg-gradient-to-br from-indigo-50 via-violet-50/80 to-paper shadow-[0_10px_28px_rgba(99,102,241,0.14)]"
          : "border-line bg-paper shadow-soft"
      : "border-line/80 bg-paper hover:border-koi/35 hover:bg-koi/[0.03]"
    : selected
      ? exploreSelected
        ? "border-koi/55 bg-gradient-to-br from-koi/20 via-orange-500/10 to-transparent shadow-[0_14px_36px_rgba(255,90,0,0.22)]"
        : streamingSelected
          ? "border-indigo-400/55 bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-transparent shadow-[0_14px_36px_rgba(99,102,241,0.22)]"
          : "border-white/14 bg-white/[0.06]"
      : "border-white/12 bg-white/[0.04] hover:border-white/28 hover:bg-white/[0.08]";

  const emojiTile = onPage
    ? exploreSelected
      ? "bg-koi/12 ring-1 ring-koi/20"
      : streamingSelected
        ? "bg-indigo-100 ring-1 ring-indigo-200/80"
        : "bg-mint ring-1 ring-line/60"
    : exploreSelected
      ? "bg-koi/15 ring-1 ring-koi/25"
      : streamingSelected
        ? "bg-indigo-500/15 ring-1 ring-indigo-400/30"
        : "bg-white/[0.08] ring-1 ring-white/10";

  const titleClass = onPage ? "text-ink" : selected ? "text-white" : "text-white/90";
  const subtitleClass = onPage ? "text-slate/75" : selected ? "text-white/70" : "text-white/55";

  return (
    <button
      type="button"
      disabled={busy}
      onClick={onPick}
      aria-pressed={selected}
      aria-label={`${title}: ${subtitle}`}
      className={`group relative flex min-h-[5.75rem] w-full flex-col items-start gap-2.5 rounded-[18px] border px-3.5 py-3.5 text-left transition focus:outline-none focus:ring-4 focus:ring-koi/15 disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-[6.25rem] sm:gap-3 sm:px-4 sm:py-4 ${surface}`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-[1.65rem] leading-none transition group-hover:scale-[1.03] ${emojiTile}`}
        aria-hidden="true"
      >
        {emoji}
      </span>
      <span className="grid min-w-0 gap-0.5">
        <span className={`text-sm font-bold tracking-tight sm:text-[0.9375rem] ${titleClass}`}>{title}</span>
        <span className={`text-xs font-semibold leading-snug sm:text-[0.8125rem] ${subtitleClass}`}>{subtitle}</span>
      </span>
    </button>
  );
}
