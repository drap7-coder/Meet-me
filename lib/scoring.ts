import type { ScoredVenue, VenueCandidate, RouteLeg } from "@/lib/types";

type ScoreInput = VenueCandidate & {
  travelFromA: RouteLeg;
  travelFromB: RouteLeg;
};

export function scoreVenue(candidate: ScoreInput): ScoredVenue {
  const timeA = candidate.travelFromA.durationMinutes;
  const timeB = candidate.travelFromB.durationMinutes;
  const hasBothTimes = typeof timeA === "number" && typeof timeB === "number";
  const timeDifferenceMinutes = hasBothTimes ? Math.abs(timeA - timeB) : null;
  const totalTravelMinutes = hasBothTimes ? timeA + timeB : null;
  const rating = candidate.rating ?? 0;
  const openNowBonus = candidate.openNow === true ? 8 : candidate.openNow === false ? -10 : 0;
  const missingRoutePenalty = hasBothTimes ? 0 : 35;
  const imbalancePenalty = hasBothTimes && Math.max(timeA, timeB) > Math.min(timeA, timeB) * 1.8 ? 15 : 0;

  const fairnessScore =
    100 -
    (timeDifferenceMinutes ?? 30) * 2 -
    (totalTravelMinutes ?? 90) * 0.25 +
    rating * 8 +
    Math.min(candidate.reviewCount / 50, 10) +
    openNowBonus -
    missingRoutePenalty -
    imbalancePenalty;

  return {
    ...candidate,
    timeDifferenceMinutes,
    totalTravelMinutes,
    fairnessScore: Math.round(fairnessScore * 10) / 10
  };
}
