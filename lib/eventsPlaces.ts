import { searchHalfway } from "@/lib/google";
import {
  buildLocalHappeningsLiveMeta,
  detectLocalHappeningsSubcategory,
  extractLocalHappeningsTimeframe,
  getLocalHappeningsOption,
  resolveLocalHappeningsPlacesSearch
} from "@/lib/localHappenings";
import { isMovieTheaterEventsQuery } from "@/lib/watchEvents";
import type {
  ScoredVenue,
  SearchHalfwayRequest,
  SearchMode,
  VenueCategory,
  WatchEventsIntent,
  WatchEventsRecommendation
} from "@/lib/types";

const EVENT_BADGES = ["Best event match", "Strong match", "Good option", "Worth a look", "Backup plan"];

export function canUseLiveEventsSearch(locationContext?: SearchHalfwayRequest): boolean {
  if (!process.env.GOOGLE_MAPS_API_KEY?.trim()) return false;
  if (!locationContext?.locationA?.trim()) return false;
  const searchMode = locationContext.searchMode ?? "midpoint";
  if (searchMode === "midpoint" && !locationContext.locationB?.trim()) return false;
  return true;
}

export function resolveEventsPlacesSearch(
  intent: WatchEventsIntent,
  topic: string,
  query: string
): { category: VenueCategory; customQuery?: string } {
  const normalized = query.toLowerCase();
  const topicValue = topic.toLowerCase();
  const localSubcategory = detectLocalHappeningsSubcategory(query);

  if (localSubcategory) {
    return resolveLocalHappeningsPlacesSearch(localSubcategory);
  }

  if (isMovieTheaterEventsQuery(normalized) || topicValue.includes("movie theater")) {
    return { category: "custom", customQuery: "movie theater" };
  }

  if (intent === "sports") {
    if (/\b(?:stadium|arena|ballpark|tickets?|at the game|see the game live)\b/i.test(normalized)) {
      return { category: "sports" };
    }
    if (/\b(?:watch|broadcast|where to watch)\b/i.test(normalized)) {
      return { category: "sports_bars" };
    }
    return { category: "sports" };
  }

  if (intent === "live_event") {
    if (topicValue.includes("comedy") || /\b(?:comedy|stand[- ]?up)\b/i.test(normalized)) {
      return { category: "custom", customQuery: "comedy club stand up" };
    }
    if (topicValue.includes("concert") || /\b(?:concert|live music)\b/i.test(normalized)) {
      return { category: "custom", customQuery: "concert venue live music" };
    }
    if (/\b(?:theater|theatre|broadway|performing arts)\b/i.test(normalized) && !isMovieTheaterEventsQuery(normalized)) {
      return { category: "custom", customQuery: "performing arts theater" };
    }
    if (/\b(?:festival|market)\b/i.test(normalized)) {
      return { category: "custom", customQuery: "festival event venue" };
    }
    return { category: "events" };
  }

  if (/\b(?:museum|zoo|aquarium)\b/i.test(normalized)) {
    if (/\bzoo\b/i.test(normalized)) return { category: "zoos" };
    if (/\baquarium\b/i.test(normalized)) return { category: "aquariums" };
    if (/\bmuseum\b/i.test(normalized)) return { category: "museums" };
  }

  return { category: "events" };
}

export async function buildLiveEventsFromPlaces({
  query,
  intent,
  topic,
  timeframe,
  locationContext
}: {
  query: string;
  intent: WatchEventsIntent;
  topic: string;
  timeframe: string;
  locationContext: SearchHalfwayRequest;
}): Promise<WatchEventsRecommendation[] | null> {
  try {
    const searchIntent = resolveEventsPlacesSearch(intent, topic, query);
    const searchMode = locationContext.searchMode ?? "midpoint";
    const request: SearchHalfwayRequest = {
      locationA: locationContext.locationA,
      locationB: locationContext.locationB ?? "",
      locationAPlaceId: locationContext.locationAPlaceId,
      locationBPlaceId: locationContext.locationBPlaceId,
      locationACoordinates: locationContext.locationACoordinates,
      locationBCoordinates: locationContext.locationBCoordinates,
      category: searchIntent.category,
      customQuery: searchIntent.customQuery ?? "",
      searchMode,
      meetupMode: locationContext.meetupMode ?? "single",
      preferences: locationContext.preferences
    };

    const response = await searchHalfway(request);
    const venues = response.venues.slice(0, 5);
    if (!venues.length) return null;

    return venues.map((venue, index) =>
      venueToEventRecommendation({
        venue,
        rank: index + 1,
        intent,
        timeframe: detectLocalHappeningsSubcategory(query)
          ? extractLocalHappeningsTimeframe(query, detectLocalHappeningsSubcategory(query))
          : timeframe,
        searchMode,
        locationA: locationContext.locationA,
        locationB: locationContext.locationB ?? "",
        query
      })
    );
  } catch {
    return null;
  }
}

function venueToEventRecommendation({
  venue,
  rank,
  intent,
  timeframe,
  searchMode,
  locationA,
  locationB,
  query
}: {
  venue: ScoredVenue;
  rank: number;
  intent: WatchEventsIntent;
  timeframe: string;
  searchMode: SearchMode;
  locationA: string;
  locationB: string;
  query: string;
}): WatchEventsRecommendation {
  const localSubcategory = detectLocalHappeningsSubcategory(query);
  const isMovieTheater = isMovieTheaterEventsQuery(query);
  const timeA = formatMinutes(venue.travelFromA.durationMinutes);
  const timeB = formatMinutes(venue.travelFromB.durationMinutes);
  const isMidpoint = searchMode === "midpoint" && locationB.trim();
  const travelExplanation = isMidpoint
    ? `about ${timeA} from ${shortLocationLabel(locationA)} and ${timeB} from ${shortLocationLabel(locationB)}`
    : `about ${timeA} from your search area`;

  const meta: WatchEventsRecommendation["meta"] = localSubcategory
    ? buildLocalHappeningsLiveMeta({
        subcategory: localSubcategory,
        timeframe,
        address: venue.address || capitalizeWords(venue.category),
        driveTime: isMidpoint ? `${timeA} / ${timeB}` : timeA,
        openNow: venue.openNow
      })
    : [];

  if (!localSubcategory) {
    if (isMidpoint) {
      meta.push({ label: "Drive A", value: timeA });
      meta.push({ label: "Drive B", value: timeB });
    } else {
      meta.push({ label: "Drive time", value: timeA });
    }
    if (typeof venue.rating === "number") {
      meta.push({
        label: "Rating",
        value: venue.reviewCount ? `${venue.rating.toFixed(1)}★ (${venue.reviewCount})` : `${venue.rating.toFixed(1)}★`
      });
    }
    if (venue.openNow === true) meta.push({ label: "Hours", value: "Open now" });
    if (venue.openNow === false) meta.push({ label: "Hours", value: "Closed now" });
    meta.push({ label: "Timing", value: timeframe });
  }

  const localOption = localSubcategory ? getLocalHappeningsOption(localSubcategory) : null;
  const tags = localOption
    ? [localOption.label, timeframe, localOption.schedule === "recurring" ? "Recurring" : "One-off"]
    : [capitalizeWords(venue.category), timeframe];
  if (venue.openNow === true) tags.push("Open now");
  if (isMidpoint && venue.timeDifferenceMinutes !== null && venue.timeDifferenceMinutes <= 8) {
    tags.push("Fair drive times");
  }

  const explanation = localOption
    ? localOption.schedule === "recurring"
      ? `Koi found ${venue.name} for ${localOption.label.toLowerCase()} with ${travelExplanation}. Confirm the next market date and seasonal hours before you go.`
      : `Koi found ${venue.name} for ${localOption.label.toLowerCase()} with ${travelExplanation}. Check local listings for the exact date and start time.`
    : `Koi found ${venue.name} near your ${isMidpoint ? "midpoint" : "area"} with ${travelExplanation}. Check Maps or the venue site for ${isMovieTheater ? "showtimes and what's playing" : intent === "sports" ? "upcoming games and events" : "upcoming shows and tickets"}.`;

  return {
    id: `events-place-${venue.id}-${rank}`,
    rank,
    title: venue.name,
    subtitle: localOption
      ? `${timeframe} · ${venue.address || localOption.label}`
      : venue.address || capitalizeWords(venue.category),
    kind: intent,
    badge: localOption
      ? localOption.schedule === "recurring"
        ? "Next occurrence"
        : "Upcoming event"
      : EVENT_BADGES[Math.min(rank - 1, EVENT_BADGES.length - 1)] ?? "Match",
    explanation,
    tags,
    meta,
    actionLabel: venue.websiteUri ? "Visit website" : "Open in Maps",
    actionUrl: venue.websiteUri || venue.googleMapsUri,
    provider: "Google Places",
    preview: false,
    overview: venue.reviewSummary || venue.reviewQuote
  };
}

function formatMinutes(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  if (value < 1) return "<1 min";
  if (value < 60) return `${Math.round(value)} min`;
  const hours = Math.floor(value / 60);
  const minutes = Math.round(value % 60);
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

function shortLocationLabel(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "you";
  const first = trimmed.split(",")[0]?.trim();
  return first || trimmed;
}

function capitalizeWords(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
