import type { ScoredVenue } from "@/lib/types";

type Props = {
  venue: ScoredVenue;
  rank: number;
  originALabel: string;
  originBLabel: string;
  isClosestToHalfway: boolean;
  isShortestCombined: boolean;
  onShare: (venue: ScoredVenue) => void;
};

export function VenueCard({
  venue,
  rank,
  originALabel,
  originBLabel,
  isClosestToHalfway,
  isShortestCombined,
  onShare
}: Props) {
  const timeA = formatMinutes(venue.travelFromA.durationMinutes);
  const timeB = formatMinutes(venue.travelFromB.durationMinutes);
  const match = getMatchExplanation({
    venue,
    rank,
    originALabel,
    originBLabel,
    isClosestToHalfway,
    isShortestCombined
  });

  return (
    <article className="rounded-lg border border-line bg-paper p-5 shadow-soft sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-lg bg-clay px-3 py-1 text-xs font-bold text-white">
              {match.badge}
            </span>
          </div>
          <h3 className="text-xl font-black leading-tight text-ink">{venue.name}</h3>
          <p className="mt-1 text-sm font-semibold text-slate">{venue.category}</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate">{match.explanation}</p>
      <p className="mt-3 text-sm leading-6 text-slate">{venue.address}</p>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <Metric label={originALabel} value={timeA} />
        <Metric label={originBLabel} value={timeB} />
        <Metric label="Difference" value={formatDifference(venue.timeDifferenceMinutes)} />
        <Metric label="Rating" value={formatRating(venue.rating, venue.reviewCount)} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span
          className={`rounded-lg px-2.5 py-1 font-semibold ${
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

      <details className="group mt-4 rounded-lg border border-line bg-mint">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-ink">
          <span>Why this match?</span>
          <span className="text-lg leading-none text-slate transition group-open:rotate-45">+</span>
        </summary>
        <div className="grid gap-3 border-t border-line px-4 py-4 text-sm leading-6 text-slate">
          <Detail label="Drive balance" value={match.details.balance} />
          <Detail label="Venue rating" value={match.details.rating} />
          <Detail label="Category match" value={match.details.category} />
          <Detail label="Convenience" value={match.details.convenience} />
        </div>
      </details>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <a
          href={venue.googleMapsUri}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-line bg-mint px-3 py-2.5 text-center text-sm font-bold text-ink transition hover:border-clay hover:text-clay"
        >
          Open in Maps
        </a>
        <button
          type="button"
          onClick={() => onShare(venue)}
          className="rounded-lg bg-ink px-3 py-2.5 text-sm font-bold text-white transition hover:bg-ink/85"
        >
          Share this spot
        </button>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-sky px-3 py-2.5">
      <div className="text-xs font-bold uppercase text-slate">{label}</div>
      <div className="mt-1 font-bold text-ink">{value}</div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="font-bold text-ink">{label}: </span>
      <span>{value}</span>
    </div>
  );
}

function getMatchExplanation({
  venue,
  rank,
  isClosestToHalfway,
  isShortestCombined
}: {
  venue: ScoredVenue;
  rank: number;
  originALabel: string;
  originBLabel: string;
  isClosestToHalfway: boolean;
  isShortestCombined: boolean;
}) {
  const diff = venue.timeDifferenceMinutes;
  const rating = venue.rating;
  const a = venue.travelFromA.durationMinutes;
  const b = venue.travelFromB.durationMinutes;
  const onePersonSavesTime =
    typeof a === "number" && typeof b === "number" && Math.abs(a - b) >= 15
      ? a < b
        ? "You"
        : "Them"
      : null;

  let badge = "Good Meeting Spot";
  let explanation = "A solid option near the halfway area with a workable trip for both people.";

  if (rank === 1 && typeof diff === "number" && diff <= 10 && typeof rating === "number" && rating >= 4.3) {
    badge = "Best Overall Match";
    explanation = "A strong mix of balanced travel times, good reviews, and a convenient location.";
  } else if (typeof diff === "number" && diff <= 5) {
    badge = "Most Balanced";
    explanation = "This spot keeps the trip balanced, with nearly equal travel times for both people.";
  } else if (isShortestCombined) {
    badge = "Shortest Combined Drive";
    explanation = "This option keeps the total time on the road especially low.";
  } else if (isClosestToHalfway) {
    badge = "Closest to Halfway";
    explanation = "This option is closest to the halfway area between both starting points.";
  } else if (onePersonSavesTime) {
    badge = `Better for ${onePersonSavesTime}`;
    explanation = "Good option, but one person has a noticeably shorter trip.";
  } else if (typeof rating === "number" && rating >= 4.5) {
    badge = "Highly Rated Nearby";
    explanation = "A well-reviewed place near the halfway area, even if the drive is slightly less balanced.";
  }

  return {
    badge,
    explanation,
    details: {
      balance: describeBalance(diff),
      rating: describeRating(rating, venue.reviewCount),
      category: `Matches your ${venue.category.toLowerCase()} search.`,
      convenience: describeConvenience(venue, isClosestToHalfway, isShortestCombined)
    }
  };
}

function describeBalance(diff: number | null) {
  if (typeof diff !== "number") return "Travel times could not be compared for both people.";
  if (diff <= 5) return `Keeps drive times within ${diff} minute${diff === 1 ? "" : "s"} of each other.`;
  if (diff <= 10) return `Keeps the trip reasonably even, with a ${diff} minute difference.`;
  return `One person has a longer trip, with a ${diff} minute difference.`;
}

function describeRating(rating: number | null, reviewCount: number) {
  if (typeof rating !== "number") return "Reviews are not available yet.";
  return `${rating.toFixed(1)} stars from ${reviewCount} review${reviewCount === 1 ? "" : "s"}.`;
}

function describeConvenience(venue: ScoredVenue, isClosestToHalfway: boolean, isShortestCombined: boolean) {
  if (isShortestCombined) return "One of the quickest options for the two of you together.";
  if (isClosestToHalfway) return "Especially close to the middle between both starting points.";
  if (venue.openNow === true) return "Open now, which makes it easier to act on.";
  if (venue.openNow === false) return "Worth saving, but check hours before heading out.";
  return "A practical option near the halfway area.";
}

function formatDifference(value: number | null) {
  if (typeof value !== "number") return "N/A";
  if (value === 0) return "Same time";
  return value === 1 ? "Only 1 minute apart" : `${value} minute difference`;
}

function formatRating(rating: number | null, reviewCount: number) {
  if (typeof rating !== "number") return "Not rated";
  return `${rating.toFixed(1)} ★ · ${reviewCount}`;
}

function formatMinutes(value: number | null) {
  if (typeof value !== "number") return "N/A";
  if (value < 60) return `${value} min`;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}
