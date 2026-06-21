import { SavedLocationBadge } from "@/app/components/SavedLocationBadge";
import { getSearchAccent } from "@/lib/searchAccent";
import { BRAND } from "@/src/config/branding";

export function CompactResultsHeader({
  loading,
  loadingLabel = "Finding places",
  resultCountLabel,
  title,
  originSummary,
  locationLabel = "",
  searchKind = null,
  canShareOptions,
  onShareOptions,
  onNewSearch
}: {
  loading: boolean;
  loadingLabel?: string;
  resultCountLabel: string;
  title: string;
  originSummary: string;
  locationLabel?: string;
  searchKind?: "places" | "watch" | "events" | null;
  canShareOptions: boolean;
  onShareOptions: () => void;
  onNewSearch: () => void;
}) {
  const accent = getSearchAccent(searchKind);
  const accentClass = accent.text;
  const newSearchHoverClass = accent.hoverBorder;
  const primaryButtonClass = accent.btnPrimary;

  return (
    <section className="pt-[max(72px,calc(env(safe-area-inset-top)+64px))]">
      <div className="rounded-lg border border-line bg-paper p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-bold uppercase tracking-wide ${accentClass}`}>{BRAND.name}</p>
            <p className={`mt-2 text-sm font-bold uppercase tracking-wide ${accentClass}`}>
              {loading ? loadingLabel : resultCountLabel || "Results"}
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-ink sm:text-4xl">{title}</h1>
            {originSummary ? <p className="mt-2 text-sm leading-6 text-slate">{originSummary}</p> : null}
            {locationLabel ? (
              <div className="mt-3 min-w-0 max-w-full">
                <SavedLocationBadge label={locationLabel} compact />
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {canShareOptions ? (
              <button
                type="button"
                onClick={onShareOptions}
                className={`inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-bold text-white transition focus:outline-none focus:ring-4 ${primaryButtonClass}`}
              >
                Share this meetup
              </button>
            ) : null}
            <button
              type="button"
              onClick={onNewSearch}
              className={`inline-flex h-10 items-center justify-center rounded-full border border-line bg-paper px-4 text-sm font-bold text-ink transition focus:outline-none focus:ring-4 focus:ring-ink/10 ${newSearchHoverClass}`}
            >
              New search
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
