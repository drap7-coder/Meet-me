import { PREFERENCES } from "@/lib/preferences";
import { travelRankingStrategy, type TravelRankingStrategy } from "@/lib/travelMode";
import type { Preference, ScoredVenue, TravelMode, VenueCandidate, RouteLeg } from "@/lib/types";

type ScoreInput = VenueCandidate & {
  travelFromA: RouteLeg;
  travelFromB: RouteLeg;
};

export function scoreVenue(
  candidate: ScoreInput,
  preferences: Preference[] = [],
  travelMode: TravelMode = "auto"
): ScoredVenue {
  const timeA = candidate.travelFromA.durationMinutes;
  const timeB = candidate.travelFromB.durationMinutes;
  const hasBothTimes = typeof timeA === "number" && typeof timeB === "number";
  const timeDifferenceMinutes = hasBothTimes ? Math.abs(timeA - timeB) : null;
  const totalTravelMinutes = hasBothTimes ? timeA + timeB : null;
  const rating = candidate.rating ?? 0;
  const openNowBonus = candidate.openNow === true ? 8 : candidate.openNow === false ? -10 : 0;
  const missingRoutePenalty = hasBothTimes ? 0 : 35;
  const imbalancePenalty = hasBothTimes && Math.max(timeA, timeB) > Math.min(timeA, timeB) * 1.8 ? 15 : 0;
  const preferenceMatches = findPreferenceMatches(candidate, preferences);
  const preferenceScore = Math.min(preferenceMatches.length * 4, 10);

  // "Getting Around" context: drive/ev/auto/transit leave ranking unchanged (0);
  // walk/bike nudge ranking toward closer results when distance data exists.
  const strategy = travelRankingStrategy(travelMode);
  const travelModeAdjustment = computeTravelModeAdjustment(strategy, candidate);

  const fairnessScore =
    100 -
    (timeDifferenceMinutes ?? 30) * 2 -
    (totalTravelMinutes ?? 90) * 0.25 +
    rating * 8 +
    Math.min(candidate.reviewCount / 50, 10) +
    openNowBonus -
    missingRoutePenalty -
    imbalancePenalty +
    preferenceScore +
    travelModeAdjustment;

  return {
    ...candidate,
    timeDifferenceMinutes,
    totalTravelMinutes,
    fairnessScore: Math.round(fairnessScore * 10) / 10,
    preferenceScore,
    preferenceMatches
  };
}

/** Representative trip distance (meters): the longer leg, so neither person is stuck far away. */
function representativeDistanceMeters(candidate: ScoreInput): number | null {
  const distances = [candidate.travelFromA.distanceMeters, candidate.travelFromB.distanceMeters].filter(
    (value): value is number => typeof value === "number"
  );
  if (!distances.length) return null;
  return Math.max(...distances);
}

/**
 * Additive ranking nudge for the active travel mode. Returns 0 for drive-style
 * modes and when distance data is unavailable, so existing behavior is untouched.
 */
export function computeTravelModeAdjustment(
  strategy: TravelRankingStrategy,
  candidate: ScoreInput
): number {
  if (strategy === "drive") return 0;

  const meters = representativeDistanceMeters(candidate);
  if (meters == null) return 0;

  if (strategy === "walk") {
    return interpolateAdjustment(meters, { comfortable: 1200, far: 3000, bonus: 12, penalty: -45 });
  }
  if (strategy === "bike") {
    return interpolateAdjustment(meters, { comfortable: 6000, far: 16000, bonus: 10, penalty: -35 });
  }
  return 0;
}

function interpolateAdjustment(
  meters: number,
  bounds: { comfortable: number; far: number; bonus: number; penalty: number }
): number {
  if (meters <= bounds.comfortable) return bounds.bonus;
  if (meters >= bounds.far) return bounds.penalty;
  const t = (meters - bounds.comfortable) / (bounds.far - bounds.comfortable);
  const value = bounds.bonus + t * (bounds.penalty - bounds.bonus);
  return Math.round(value * 10) / 10;
}

function findPreferenceMatches(candidate: VenueCandidate, preferences: Preference[]) {
  if (!preferences.length) return [];

  const haystack = [
    candidate.name,
    candidate.category,
    candidate.address,
    ...(candidate.types ?? [])
  ]
    .join(" ")
    .toLowerCase();

  return preferences.filter((preference) => {
    const config = PREFERENCES.find((item) => item.id === preference);
    return Boolean(config?.terms.some((term) => haystack.includes(term)));
  });
}
