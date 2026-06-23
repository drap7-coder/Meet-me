import { getCategoryLabel } from "@/lib/categories";
import type { ScoredVenue, SearchMode, VenueCategory } from "@/lib/types";
import { type WeatherPlan, weatherPlanLabel } from "@/lib/weatherPlan";

export function getKoiPickReasonLine(searchMode: SearchMode, searchCategory: VenueCategory): string {
  if (searchMode === "midpoint") return "Best overall choice for this meetup.";
  return `Best overall choice for ${getCategoryLabel(searchCategory).toLowerCase()} near you.`;
}

export function buildKoiPickDecisionChips(input: {
  venue: ScoredVenue;
  searchMode: SearchMode;
  weatherPlan?: WeatherPlan | null;
}): string[] {
  const { venue, searchMode, weatherPlan } = input;
  const chips: string[] = [];
  const minutesA = venue.travelFromA.durationMinutes;
  const minutesB = venue.travelFromB.durationMinutes;

  if (searchMode === "single" && typeof minutesA === "number" && venue.travelFromA.status === "OK") {
    chips.push(`${minutesA} min away`);
  } else if (
    searchMode === "midpoint" &&
    typeof minutesA === "number" &&
    typeof minutesB === "number" &&
    venue.travelFromA.status === "OK" &&
    venue.travelFromB.status === "OK"
  ) {
    const shorter = Math.min(minutesA, minutesB);
    chips.push(`${shorter} min away`);
  }

  if (venue.openNow === true) chips.push("Open now");
  else if (venue.openNow === false) chips.push("Check hours");

  if (weatherPlan) {
    chips.push(weatherPlanLabel(weatherPlan));
  } else if (venue.preferenceMatches.includes("outdoor_seating")) {
    chips.push("Outdoor seating");
  }

  if (searchMode === "midpoint") {
    const diff = venue.timeDifferenceMinutes;
    if (typeof diff === "number" && diff <= 10) chips.push("Fair for the group");
  } else if (typeof venue.rating === "number" && venue.rating >= 4.3) {
    chips.push("Highly rated");
  }

  return chips.filter(Boolean).slice(0, 4);
}
