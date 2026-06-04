import type { ScoredVenue } from "@/lib/types";

type Props = {
  venue: ScoredVenue;
  rank: number;
  onShare: (venue: ScoredVenue) => void;
};

export function VenueCard({ venue, rank, onShare }: Props) {
  const timeA = formatMinutes(venue.travelFromA.durationMinutes);
  const timeB = formatMinutes(venue.travelFromB.durationMinutes);

  return (
    <article className="rounded-xl border border-ink/10 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex rounded-full bg-mint px-2.5 py-1 text-xs font-bold text-moss">
            #{rank} fairest
          </div>
          <h3 className="text-lg font-bold leading-tight text-ink">{venue.name}</h3>
          <p className="mt-1 text-sm text-ink/60">{venue.category}</p>
        </div>
        <div className="rounded-lg bg-ink px-3 py-2 text-center text-white">
          <div className="text-xs uppercase tracking-wide text-white/70">Score</div>
          <div className="text-lg font-black">{venue.fairnessScore}</div>
        </div>
      </div>

      <p className="mt-3 text-sm leading-5 text-ink/70">{venue.address}</p>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <Metric label="Person A" value={timeA} />
        <Metric label="Person B" value={timeB} />
        <Metric label="Difference" value={formatMinutes(venue.timeDifferenceMinutes)} />
        <Metric label="Reviews" value={`${venue.rating ?? "N/A"} ★ · ${venue.reviewCount}`} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span
          className={`rounded-full px-2.5 py-1 font-semibold ${
            venue.openNow === true
              ? "bg-mint text-moss"
              : venue.openNow === false
                ? "bg-clay/15 text-clay"
                : "bg-ink/10 text-ink/60"
          }`}
        >
          {venue.openNow === true ? "Open now" : venue.openNow === false ? "Closed" : "Hours unknown"}
        </span>
        <span className="text-ink/50">Total travel: {formatMinutes(venue.totalTravelMinutes)}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <a
          href={venue.googleMapsUri}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-ink/15 px-3 py-2 text-center text-sm font-bold text-ink transition hover:border-moss hover:text-moss"
        >
          Google Maps
        </a>
        <button
          type="button"
          onClick={() => onShare(venue)}
          className="rounded-lg bg-moss px-3 py-2 text-sm font-bold text-white transition hover:bg-moss/90"
        >
          Share this option
        </button>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-paper px-3 py-2">
      <div className="text-xs font-semibold uppercase text-ink/45">{label}</div>
      <div className="mt-1 font-bold text-ink">{value}</div>
    </div>
  );
}

function formatMinutes(value: number | null) {
  if (typeof value !== "number") return "N/A";
  if (value < 60) return `${value} min`;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}
