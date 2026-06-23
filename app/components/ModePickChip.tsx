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

  const heroSurface = [
    "koi-discovery-chip flex w-full min-w-0 flex-col items-start gap-1.5 rounded-[14px] px-3 py-2.5 text-left transition focus:outline-none focus:ring-4 focus:ring-koi/15 disabled:cursor-not-allowed disabled:opacity-40",
    streamingSelected && "bg-indigo-500/15",
    exploreSelected && "bg-koi/15"
  ]
    .filter(Boolean)
    .join(" ");

  const pageSurface = [
    "flex w-full min-w-0 flex-col items-start gap-1.5 rounded-[14px] bg-mint px-3 py-2.5 text-left transition hover:bg-mint/80 focus:outline-none focus:ring-4 focus:ring-koi/15 disabled:cursor-not-allowed disabled:opacity-40",
    streamingSelected && "bg-indigo-50",
    exploreSelected && "bg-koi/10"
  ]
    .filter(Boolean)
    .join(" ");

  const titleClass = onPage ? "text-sm font-semibold text-ink" : "text-sm font-medium text-white";
  const subtitleClass = onPage ? "text-xs font-medium leading-snug text-slate/75" : "text-xs font-medium leading-snug text-white/60";

  return (
    <button
      type="button"
      disabled={busy}
      onClick={onPick}
      aria-pressed={selected}
      aria-label={`${title}: ${subtitle}`}
      className={onPage ? pageSurface : heroSurface}
    >
      <span className="text-base leading-none" aria-hidden="true">
        {emoji}
      </span>
      <span className="grid min-w-0 gap-0.5">
        <span className={titleClass}>{title}</span>
        <span className={subtitleClass}>{subtitle}</span>
      </span>
    </button>
  );
}
