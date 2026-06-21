"use client";

import {
  buildGoogleCalendarUrl,
  buildIcsUrl,
  defaultCalendarStart,
  venueToCalendarDetails
} from "@/lib/calendar";
import { CategoryIcon } from "@/app/components/CategoryIcon";
import { FairMeetupBadge } from "@/app/components/KoiMatchBadge";
import { KoiPickBadge } from "@/app/components/KoiPickBadge";
import { copyTextToClipboard } from "@/lib/share";
import { trackEvent } from "@/lib/analytics";
import { getCategoryConfig, getCategoryLabel, getPrimaryCategoryId } from "@/lib/categories";
import { getPreferenceLabel } from "@/lib/preferences";
import type { MeetupMode, ScoredVenue, SearchMode, VenueCategory } from "@/lib/types";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  venue: ScoredVenue;
  rank: number;
  originALabel: string;
  originBLabel: string;
  isClosestToHalfway: boolean;
  isShortestCombined: boolean;
  searchCategory: VenueCategory;
  searchMode: SearchMode;
  meetupMode: MeetupMode;
  isKoiPick?: boolean;
  onShare: (venue: ScoredVenue) => void;
  shareUrl?: string;
};

export function VenueCard({
  venue,
  rank,
  originALabel,
  originBLabel,
  isClosestToHalfway,
  isShortestCombined,
  searchCategory,
  searchMode,
  meetupMode,
  isKoiPick = false,
  onShare,
  shareUrl
}: Props) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const cardRef = useRef<HTMLElement | null>(null);
  const viewed = useRef(false);
  const timeA = formatMinutes(venue.travelFromA.durationMinutes);
  const timeB = formatMinutes(venue.travelFromB.durationMinutes);
  const hasTravelTimes =
    searchMode === "midpoint" &&
    typeof venue.travelFromA.durationMinutes === "number" &&
    typeof venue.travelFromB.durationMinutes === "number" &&
    venue.travelFromA.status === "OK" &&
    venue.travelFromB.status === "OK";
  const venueAction = getVenueAction(venue, searchCategory);
  const collegeResearchLinks = getPrimaryCategoryId(searchCategory) === "colleges" ? getCollegeResearchLinks(venue) : null;
  const reviewSnippet = venue.reviewQuote || venue.reviewSummary;
  const match = getMatchExplanation({
    venue,
    rank,
    originALabel,
    originBLabel,
    isClosestToHalfway,
    isShortestCombined,
    searchCategory,
    searchMode,
    meetupMode
  });

  useEffect(() => {
    if (!cardRef.current || viewed.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !viewed.current) {
          viewed.current = true;
          trackEvent("place_card_viewed", {
            category: venue.category,
            placeType: venue.types?.[0] ?? venue.category
          });
          observer.disconnect();
        }
      },
      { threshold: 0.45 }
    );
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [venue.category, venue.types]);

  function handleDirectionsClick() {
    trackEvent("directions_clicked", {
      category: venue.category,
      placeType: venue.types?.[0] ?? venue.category
    });
    trackEvent("place_selected", {
      category: venue.category,
      placeType: venue.types?.[0] ?? venue.category
    });
    if (searchMode === "midpoint") {
      trackEvent("halfway_result_clicked", {
        category: venue.category,
        rank,
        action: "directions"
      });
    }
  }

  function handleShareClick() {
    if (searchMode === "midpoint") {
      trackEvent("halfway_result_clicked", {
        category: venue.category,
        rank,
        action: "share"
      });
    }
    onShare(venue);
  }

  return (
    <article
      ref={cardRef}
      className={`rounded-lg border bg-paper p-5 shadow-soft sm:p-6 ${
        isKoiPick ? "border-koi/30 ring-2 ring-koi/15" : "border-line"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {isKoiPick ? (
              <KoiPickBadge />
            ) : searchMode === "midpoint" ? (
              <FairMeetupBadge
                minutesA={hasTravelTimes ? venue.travelFromA.durationMinutes : null}
                minutesB={hasTravelTimes ? venue.travelFromB.durationMinutes : null}
              />
            ) : (
              <span className="inline-flex rounded-lg bg-koi px-3 py-1 text-xs font-bold text-white">
                {match.badge}
              </span>
            )}
            {isKoiPick && searchMode === "midpoint" && hasTravelTimes ? (
              <FairMeetupBadge
                minutesA={venue.travelFromA.durationMinutes}
                minutesB={venue.travelFromB.durationMinutes}
                compact
              />
            ) : null}
          </div>
          <h3 className={`font-black leading-tight text-ink ${isKoiPick ? "text-2xl sm:text-3xl" : "text-xl"}`}>
            {venue.name}
          </h3>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-slate">
            <CategoryIcon category={searchCategory} className="h-4 w-4" />
            {venue.category}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-line bg-mint p-4">
        <p className="text-sm font-black text-ink">Why Koi picked it</p>
        {searchMode === "midpoint" && hasTravelTimes ? (
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-xs font-bold uppercase text-slate">You</span>
              <p className="mt-0.5 font-bold text-ink">{timeA}</p>
            </div>
            <div>
              <span className="text-xs font-bold uppercase text-slate">Them</span>
              <p className="mt-0.5 font-bold text-ink">{timeB}</p>
            </div>
          </div>
        ) : null}
        <p className="mt-2 text-sm leading-6 text-slate">{match.explanation}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {match.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate ring-1 ring-line">
              {tag}
            </span>
          ))}
        </div>
      </div>
      <p className="mt-2 inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-bold text-ink">
        {searchMode === "midpoint" ? <span>{formatDifference(venue.timeDifferenceMinutes)}</span> : null}
        {typeof venue.rating === "number" ? <span>{searchMode === "midpoint" ? "· " : ""}{venue.rating.toFixed(1)} stars</span> : null}
        {searchMode === "midpoint" && isClosestToHalfway ? <span>· Near the midpoint</span> : null}
        <span className="inline-flex items-center gap-1 text-slate">
          · <CategoryIcon category={searchCategory} active className="h-3.5 w-3.5" /> Category match
        </span>
      </p>
      <p className="mt-3 text-sm leading-6 text-slate">{venue.address}</p>

      {reviewSnippet ? (
        <figure className="mt-4 rounded-lg border border-line bg-white px-4 py-3">
          <blockquote className="text-sm font-semibold leading-6 text-ink">“{reviewSnippet}”</blockquote>
          <figcaption className="mt-2 text-xs font-bold uppercase tracking-wide text-slate">
            {venue.reviewQuote ? "Google review" : venue.reviewSummaryDisclosure || "Place summary"}
          </figcaption>
        </figure>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <Metric label={searchMode === "single" ? "Travel" : originALabel} value={timeA} />
        {searchMode === "midpoint" ? <Metric label={originBLabel} value={timeB} /> : null}
        {searchMode === "midpoint" ? <Metric label="Difference" value={formatDifference(venue.timeDifferenceMinutes)} /> : null}
        <Metric label="Rating" value={formatRating(venue.rating, venue.reviewCount)} />
        {venue.priceLevel ? <Metric label="Price" value={formatPriceLevel(venue.priceLevel)} /> : null}
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
        <span className="text-slate">
          {searchMode === "single"
            ? `From ${originALabel}: ${timeA}`
            : `Total time: ${formatMinutes(venue.totalTravelMinutes)}`}
        </span>
      </div>

      {venueAction ? (
        <div className="mt-4">
          <a
            href={venueAction.url}
            target="_blank"
            rel="noreferrer"
            onClick={() =>
              trackEvent("venue_action_clicked", {
                category: venue.category,
                action: venueAction.label,
                placeType: venue.types?.[0] ?? venue.category
              })
            }
            className="inline-flex h-10 items-center justify-center rounded-full border border-koi/25 bg-koi/10 px-4 text-sm font-black text-ink transition hover:border-koi hover:bg-koi hover:text-white focus:outline-none focus:ring-4 focus:ring-koi/20"
          >
            {venueAction.label}
          </a>
        </div>
      ) : null}

      {collegeResearchLinks ? (
        <div className="college-research-links" aria-label="College research links">
          {collegeResearchLinks.website ? (
            <a href={collegeResearchLinks.website} target="_blank" rel="noreferrer">
              Website
            </a>
          ) : null}
          <a href={collegeResearchLinks.niche} target="_blank" rel="noreferrer">
            Niche
          </a>
        </div>
      ) : null}

      <details className="group mt-4 rounded-lg border border-line bg-mint">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-ink">
          <span>Why Koi picked it</span>
          <span className="text-lg leading-none text-slate transition group-open:rotate-45">+</span>
        </summary>
        <div className="grid gap-3 border-t border-line px-4 py-4 text-sm leading-6 text-slate">
          <Detail label={searchMode === "single" ? "Distance" : "Drive balance"} value={match.details.balance} />
          <Detail label="Venue rating" value={match.details.rating} />
          <Detail label="Category match" value={match.details.category} category={searchCategory} />
          <Detail label="Preference match" value={match.details.preference} />
          <Detail label="Convenience" value={match.details.convenience} />
        </div>
      </details>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <a
          href={venue.googleMapsUri}
          target="_blank"
          rel="noreferrer"
          onClick={handleDirectionsClick}
          className="rounded-full bg-koi px-3 py-2.5 text-center text-sm font-bold text-white transition hover:bg-koi-hover focus:outline-none focus:ring-4 focus:ring-koi/25"
        >
          Get directions
        </a>
        <button
          type="button"
          onClick={handleShareClick}
          className="rounded-full border border-line bg-paper px-3 py-2.5 text-sm font-bold text-ink transition hover:border-koi hover:text-koi focus:outline-none focus:ring-4 focus:ring-ink/10"
        >
          Share
        </button>
        <button
          type="button"
          onClick={() => setCalendarOpen(true)}
          className="rounded-full border border-line bg-paper px-3 py-2.5 text-sm font-bold text-ink transition hover:border-koi hover:text-koi focus:outline-none focus:ring-4 focus:ring-ink/10"
        >
          Add to calendar
        </button>
      </div>

      {calendarOpen ? (
        <CalendarSheet
          venue={venue}
          travelFromA={timeA}
          travelFromB={timeB}
          shareUrl={shareUrl}
          onClose={() => setCalendarOpen(false)}
        />
      ) : null}
    </article>
  );
}

function CalendarSheet({
  venue,
  travelFromA,
  travelFromB,
  shareUrl,
  onClose
}: {
  venue: ScoredVenue;
  travelFromA: string;
  travelFromB: string;
  shareUrl?: string;
  onClose: () => void;
}) {
  const [start, setStart] = useState(defaultCalendarStart);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");

  const details = useMemo(
    () =>
      venueToCalendarDetails({
        venue,
        start,
        durationMinutes,
        notes,
        travelFromA,
        travelFromB,
        shareUrl
      }),
    [durationMinutes, notes, shareUrl, start, travelFromA, travelFromB, venue]
  );

  function trackCalendar(source: string) {
    trackEvent("calendar_invite_created", {
      category: venue.category,
      placeType: venue.types?.[0] ?? venue.category,
      source
    });
  }

  async function copyDetails() {
    const copied = await copyTextToClipboard(
      [
        `Meet at ${venue.name}`,
        venue.address,
        `When: ${new Date(start).toLocaleString()}`,
        `Duration: ${durationMinutes} minutes`,
        `Travel: ${travelFromA} / ${travelFromB}`,
        shareUrl ? `Meetup: ${shareUrl}` : "",
        venue.googleMapsUri
      ]
        .filter(Boolean)
        .join("\n")
    );
    if (copied) {
      trackCalendar("copy");
      setStatus("Details copied.");
    } else {
      setStatus("Copy failed. Try Google Calendar or .ics.");
    }
  }

  const googleUrl = buildGoogleCalendarUrl(details);
  const icsUrl = buildIcsUrl(details);

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/30 p-3 sm:place-items-center" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-[24px] border border-line bg-white p-5 shadow-[0_24px_80px_rgba(17,24,39,0.24)] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-koi">Add to calendar</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-ink">Meet at {venue.name}</h3>
            <p className="mt-1 text-sm leading-6 text-slate">{venue.address}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-sm font-bold text-slate">
            Close
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-ink">
            Date and time
            <input
              type="datetime-local"
              value={start}
              onChange={(event) => setStart(event.target.value)}
              className="h-11 rounded-lg border border-line bg-mint px-3 text-sm outline-none focus:border-koi focus:ring-4 focus:ring-koi/10"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-ink">
            Duration
            <select
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(Number(event.target.value))}
              className="h-11 rounded-lg border border-line bg-mint px-3 text-sm outline-none focus:border-koi focus:ring-4 focus:ring-koi/10"
            >
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>2 hours</option>
            </select>
          </label>
        </div>

        <label className="mt-3 grid gap-2 text-sm font-bold text-ink">
          Notes
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional"
            className="min-h-20 rounded-lg border border-line bg-mint px-3 py-2 text-sm outline-none focus:border-koi focus:ring-4 focus:ring-koi/10"
          />
        </label>

        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <a
            href={googleUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackCalendar("google")}
            className="inline-flex h-11 items-center justify-center rounded-full bg-koi px-3 text-sm font-bold text-white transition hover:bg-koi-hover focus:outline-none focus:ring-4 focus:ring-koi/25"
          >
            Google Calendar
          </a>
          <a
            href={icsUrl}
            onClick={() => trackCalendar("ics")}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-mint px-3 text-sm font-bold text-ink transition hover:border-koi hover:text-koi"
          >
            Download .ics
          </a>
          <button
            type="button"
            onClick={copyDetails}
            className="h-11 rounded-lg border border-line bg-mint px-3 text-sm font-bold text-ink transition hover:border-koi hover:text-koi"
          >
            Copy details
          </button>
        </div>
        {status ? <p className="mt-3 text-center text-xs font-semibold text-slate">{status}</p> : null}
      </div>
    </div>
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

function Detail({ label, value, category }: { label: string; value: string; category?: VenueCategory }) {
  return (
    <div>
      <span className="inline-flex items-center gap-1 font-bold text-ink">
        {category ? <CategoryIcon category={category} active className="h-3.5 w-3.5" /> : null}
        {label}:
      </span>{" "}
      <span>{value}</span>
    </div>
  );
}

function getCollegeResearchLinks(college: Partial<ScoredVenue> & { displayName?: { text?: string }; website?: string }) {
  return {
    niche: "https://www.niche.com/",
    website: college?.websiteUri || college?.website || null
  };
}

function getVenueAction(venue: ScoredVenue, searchCategory: VenueCategory) {
  const url = venue.websiteUri;
  if (!url) return null;

  const haystack = [venue.name, venue.category, ...(venue.types ?? [])].join(" ").toLowerCase();

  if (haystack.includes("comedy") || haystack.includes("theater") || haystack.includes("music venue")) {
    return { label: "View Show", url };
  }

  if (searchCategory === "events" || haystack.includes("event")) {
    return { label: "View Event", url };
  }

  if (
    ["zoos", "aquariums", "childrens_museums", "museums"].includes(searchCategory) ||
    haystack.includes("museum") ||
    haystack.includes("aquarium") ||
    haystack.includes("zoo")
  ) {
    return { label: "View Tickets", url };
  }

  if (["golf", "driving_range"].includes(searchCategory) || haystack.includes("golf course")) {
    return { label: searchCategory === "golf" ? "Book Tee Time" : "Book Activity", url };
  }

  if (["pickleball", "bowling", "escape_rooms", "arcades"].includes(searchCategory)) {
    return { label: "Book Activity", url };
  }

  if (searchCategory === "sports") {
    return { label: "Book Activity", url };
  }

  if (searchCategory === "hotels" || searchCategory === "universities") {
    return { label: "Visit Website", url };
  }

  if (
    [
      "restaurant",
      "brunch",
      "italian",
      "bbq",
      "mexican",
      "sushi",
      "asian",
      "american",
      "indian",
      "mediterranean",
      "thai",
      "pizza",
      "seafood",
      "steakhouse",
      "breakfast",
      "vegan",
      "breweries",
      "wine_bars",
      "cocktail_bars",
      "lounges",
      "pubs",
      "rooftop_bars",
      "distilleries",
      "sports_bars",
      "cigar_lounges"
    ].includes(searchCategory) ||
    haystack.includes("restaurant") ||
    haystack.includes("cafe")
  ) {
    return { label: isReservationUrl(url) ? "Reserve Table" : "Visit Website", url };
  }

  if (haystack.includes("ticket")) {
    return { label: "View Event", url };
  }

  return null;
}

function isReservationUrl(url: string) {
  const value = url.toLowerCase();
  return ["opentable", "resy", "tock", "sevenrooms", "exploretock", "reservation", "reserve"].some((term) =>
    value.includes(term)
  );
}

function getMatchExplanation({
  venue,
  rank,
  isClosestToHalfway,
  isShortestCombined,
  searchCategory,
  searchMode,
  meetupMode
}: {
  venue: ScoredVenue;
  rank: number;
  originALabel: string;
  originBLabel: string;
  isClosestToHalfway: boolean;
  isShortestCombined: boolean;
  searchCategory: VenueCategory;
  searchMode: SearchMode;
  meetupMode: MeetupMode;
}) {
  const diff = venue.timeDifferenceMinutes;
  const rating = venue.rating;
  const a = venue.travelFromA.durationMinutes;
  const b = venue.travelFromB.durationMinutes;
  const categoryConfig = getCategoryConfig(searchCategory);
  const categoryLabel = getCategoryLabel(searchCategory);
  const primaryPreference = venue.preferenceMatches[0];
  const preferencePhrase = formatPreferencePhrase(venue.preferenceMatches);
  const onePersonSavesTime =
    typeof a === "number" && typeof b === "number" && Math.abs(a - b) >= 15
      ? a < b
        ? "Person A"
        : "Person B"
      : null;

  let badge = categoryConfig?.resultBadge ?? "Best Overall Match";
  let explanation = categoryConfig?.explanation ?? "A solid option near the halfway area with a workable trip for both people.";

  if (searchMode === "single") {
    badge = categoryConfig?.resultBadge ?? "Best Overall Match";
    if (primaryPreference && rank <= 3) {
      explanation = `A strong ${venue.category.toLowerCase()} option near your search area with ${preferencePhrase}.`;
    } else if (typeof rating === "number" && rating >= 4.3) {
      explanation = "A strong nearby option with good ratings and a practical trip from your location.";
    } else {
      explanation = `A solid ${categoryLabel.toLowerCase()} option near your selected location.`;
    }
  } else if (primaryPreference && rank <= 3) {
    badge = categoryConfig?.resultBadge ?? "Best Overall Match";
    explanation = `A strong ${venue.category.toLowerCase()} option near the midpoint with ${preferencePhrase} and workable travel times.`;
  } else if (rank === 1 && typeof diff === "number" && diff <= 10 && typeof rating === "number" && rating >= 4.3) {
    badge = "Best Overall Match";
    explanation = categoryConfig?.explanation ?? "A strong mix of balanced travel times, good reviews, and a convenient location.";
  } else if (typeof diff === "number" && diff <= 5 && typeof a === "number" && typeof b === "number") {
    badge = "Koi Match";
    explanation = "This spot keeps the trip close to even, with nearly equal travel times for both people.";
  } else if (isClosestToHalfway) {
    badge = "Near the midpoint";
    explanation = "This option is close to the midpoint area between both starting points.";
  } else if (onePersonSavesTime) {
    badge = `Better for ${onePersonSavesTime}`;
    explanation = "Good option, but one person has a noticeably shorter trip.";
  } else if (isShortestCombined && rank <= 5) {
    badge = "Koi Match";
    explanation = "This option keeps the overall drive practical while staying close to the midpoint.";
  }

  return {
    badge,
    explanation,
    tags: buildMatchTags({
      venue,
      searchMode,
      categoryLabel,
      isClosestToHalfway
    }),
    details: {
      balance: searchMode === "single" ? `About ${formatMinutes(venue.travelFromA.durationMinutes)} from your search location.` : describeBalance(diff),
      rating: describeRating(rating, venue.reviewCount),
      category: `Matches your ${getCategoryLabel(searchCategory).toLowerCase()} search.`,
      preference: describePreferenceMatch(venue.preferenceMatches),
      convenience: describeConvenience(venue, isClosestToHalfway, isShortestCombined, categoryLabel, searchMode)
    }
  };
}

function buildMatchTags({
  venue,
  searchMode,
  categoryLabel,
  isClosestToHalfway
}: {
  venue: ScoredVenue;
  searchMode: SearchMode;
  categoryLabel: string;
  isClosestToHalfway: boolean;
}) {
  const tags: string[] = [];
  const diff = venue.timeDifferenceMinutes;
  const hasTimes =
    typeof venue.travelFromA.durationMinutes === "number" &&
    typeof venue.travelFromB.durationMinutes === "number" &&
    venue.travelFromA.status === "OK" &&
    venue.travelFromB.status === "OK";

  if (searchMode === "midpoint") {
    if (hasTimes && typeof diff === "number" && diff <= 10) tags.push("Balanced travel times");
    if (typeof venue.rating === "number" && venue.rating >= 4.3) tags.push("Highly rated");
    if (venue.openNow === true) tags.push("Open now");
    if (isClosestToHalfway) tags.push("Near both starting points");
    else if (!hasTimes) tags.push("Good meetup option");
  } else {
    tags.push(`Good match for ${categoryLabel.toLowerCase()}`);
    for (const preference of venue.preferenceMatches.slice(0, 2)) {
      tags.push(getPreferenceLabel(preference));
    }
    if (venue.openNow === true) tags.push("Timing");
    if (typeof venue.rating === "number" && venue.rating >= 4.3) tags.push("Reviews");
    tags.push("Nearby");
  }

  return Array.from(new Set(tags)).slice(0, 4);
}

function formatPreferencePhrase(preferences: ScoredVenue["preferenceMatches"]) {
  const labels = preferences.map((preference) => getPreferenceLabel(preference).toLowerCase());
  if (labels.length === 0) return "useful setting signals";
  if (labels.length === 1) return `${labels[0]} appeal`;
  if (labels.length === 2) return `${labels[0]} and ${labels[1]} appeal`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]} appeal`;
}

function describePreferenceMatch(preferences: ScoredVenue["preferenceMatches"]) {
  if (!preferences.length) return "No strong preference signal found for this place.";
  return `Shows signs of matching ${preferences.map(getPreferenceLabel).join(", ")}.`;
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

function describeConvenience(
  venue: ScoredVenue,
  isClosestToHalfway: boolean,
  isShortestCombined: boolean,
  primaryCategoryLabel: string,
  searchMode: SearchMode
) {
  if (searchMode === "single") {
    if (venue.openNow === true) return "Open now, which makes it easier to act on.";
    if (venue.openNow === false) return "Worth saving, but check hours before heading out.";
    return `A practical ${primaryCategoryLabel.toLowerCase()} option near your selected location.`;
  }
  if (isShortestCombined) return "One of the quickest options for the two of you together.";
  if (isClosestToHalfway) return "Especially close to the middle between both starting points.";
  if (venue.openNow === true) return "Open now, which makes it easier to act on.";
  if (venue.openNow === false) return "Worth saving, but check hours before heading out.";
  return `A practical ${primaryCategoryLabel.toLowerCase()} option near the midpoint area.`;
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

function formatPriceLevel(priceLevel: string) {
  const prices: Record<string, string> = {
    PRICE_LEVEL_FREE: "Free",
    PRICE_LEVEL_INEXPENSIVE: "$",
    PRICE_LEVEL_MODERATE: "$$",
    PRICE_LEVEL_EXPENSIVE: "$$$",
    PRICE_LEVEL_VERY_EXPENSIVE: "$$$$"
  };
  return prices[priceLevel] ?? priceLevel.replace(/^PRICE_LEVEL_/, "").toLowerCase().replace(/_/g, " ");
}

function formatMinutes(value: number | null) {
  if (typeof value !== "number") return "N/A";
  if (value < 60) return `${value} min`;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}
