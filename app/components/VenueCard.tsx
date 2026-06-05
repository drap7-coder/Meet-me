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
    <article className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-3 inline-flex rounded-full bg-sky px-3 py-1 text-xs font-bold text-slate">
            Spot {rank}
          </div>
          <h3 className="text-xl font-black leading-tight text-ink">{venue.name}</h3>
          <p className="mt-1 text-sm font-semibold text-slate">{venue.category}</p>
        </div>
        <div className="rounded-lg bg-sky px-3 py-2 text-center">
          <div className="text-xs font-bold uppercase tracking-wide text-slate">Fit</div>
          <div className="text-lg font-black text-ink">{Math.round(venue.fairnessScore)}</div>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate">{venue.address}</p>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <Metric label="You" value={timeA} />
        <Metric label="Them" value={timeB} />
        <Metric label="Time apart" value={formatMinutes(venue.timeDifferenceMinutes)} />
        <Metric label="Rating" value={`${venue.rating ?? "N/A"} ★ · ${venue.reviewCount}`} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span
          className={`rounded-full px-2.5 py-1 font-semibold ${
            venue.openNow === true
              ? "bg-sky text-ink"
              : venue.openNow === false
                ? "bg-line text-slate"
                : "bg-line text-slate"
          }`}
        >
          {venue.openNow === true ? "Open now" : venue.openNow === false ? "Closed" : "Hours unknown"}
        </span>
        <span className="text-slate">Total time: {formatMinutes(venue.totalTravelMinutes)}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <a
          href={venue.googleMapsUri}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-line px-3 py-2.5 text-center text-sm font-bold text-ink transition hover:border-[#0071E3] hover:text-[#0071E3]"
        >
          Open in Maps
        </a>
        <button
          type="button"
          onClick={() => onShare(venue)}
          className="rounded-full bg-ink px-3 py-2.5 text-sm font-bold text-white transition hover:bg-ink/85"
        >
          Share this spot
        </button>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-sky px-3 py-2">
      <div className="text-xs font-bold uppercase text-slate">{label}</div>
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
