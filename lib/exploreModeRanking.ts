import type { ExploreTravelMode, ScoredVenue, VenueCandidate } from "@/lib/types";

type RankedVenue = ScoredVenue & {
  travelFromA?: { distanceMeters: number | null; durationMinutes: number | null };
  travelFromB?: { distanceMeters: number | null; durationMinutes: number | null };
};

export type ExploreModeRankingContext = {
  query?: string;
  category?: string;
};

export type ExploreModeBoosts = {
  terms: string[];
  categories: string[];
  closeDistanceMeters: number | null;
  farDistanceMeters: number | null;
  distanceBonus: number;
  distancePenalty: number;
  contentBoost: number;
};

const WALK_TERMS = [
  "park",
  "trail",
  "cafe",
  "coffee",
  "museum",
  "public art",
  "mural",
  "historic",
  "district",
  "waterfront",
  "garden",
  "farmers market",
  "scenic walk",
  "riverwalk",
  "boardwalk"
];

const BIKE_TERMS = [
  "rail trail",
  "greenway",
  "bike path",
  "bike trail",
  "cycling",
  "gravel",
  "waterfront",
  "park",
  "brewery",
  "cafe",
  "coffee",
  "scenic ride",
  "boardwalk"
];

export function getExploreModeBoosts(mode: ExploreTravelMode | null | undefined): ExploreModeBoosts {
  switch (mode) {
    case "walk":
      return {
        terms: WALK_TERMS,
        categories: [
          "park",
          "hiking",
          "trails",
          "coffee",
          "museums",
          "public_art",
          "landmarks",
          "waterfronts",
          "gardens",
          "farmers_markets",
          "scenic_walks",
          "scenic_spots"
        ],
        closeDistanceMeters: 1200,
        farDistanceMeters: 3500,
        distanceBonus: 12,
        distancePenalty: -45,
        contentBoost: 9
      };
    case "bike":
      return {
        terms: BIKE_TERMS,
        categories: ["trails", "hiking", "waterfronts", "park", "breweries", "coffee", "scenic_walks", "scenic_spots"],
        closeDistanceMeters: 6500,
        farDistanceMeters: 18000,
        distanceBonus: 10,
        distancePenalty: -35,
        contentBoost: 10
      };
    case "drive":
    case "ev":
      return {
        terms: [],
        categories: [],
        closeDistanceMeters: null,
        farDistanceMeters: null,
        distanceBonus: 0,
        distancePenalty: 0,
        contentBoost: 0
      };
    case "auto":
    default:
      return {
        terms: [],
        categories: [],
        closeDistanceMeters: null,
        farDistanceMeters: null,
        distanceBonus: 0,
        distancePenalty: 0,
        contentBoost: 0
      };
  }
}

export function getExploreModeQueryHints(mode: ExploreTravelMode | null | undefined): string[] {
  switch (mode) {
    case "drive":
      return ["easy drive", "parking nearby"];
    case "ev":
      return ["parking nearby"];
    case "walk":
      return ["walkable", "nearby", "main street", "scenic walk"];
    case "bike":
      return ["bike trail", "rail trail", "greenway", "scenic ride"];
    case "auto":
    default:
      return [];
  }
}

export function shouldFavorNearby(mode: ExploreTravelMode | null | undefined): boolean {
  return mode === "walk" || mode === "bike";
}

export function shouldFavorOpenChargeMap(mode: ExploreTravelMode | null | undefined): boolean {
  return mode === "ev";
}

export function shouldFavorOutdoorDiscovery(mode: ExploreTravelMode | null | undefined): boolean {
  return mode === "walk" || mode === "bike";
}

export function getExploreModeRadiusMultiplier(mode: ExploreTravelMode | null | undefined): number {
  switch (mode) {
    case "drive":
    case "ev":
      return 1.25;
    case "walk":
      return 0.45;
    case "bike":
      return 0.8;
    case "auto":
    default:
      return 1;
  }
}

export function getExploreModeDistanceAdjustment(
  candidate: Pick<VenueCandidate, "category" | "name" | "address" | "types"> & {
    travelFromA?: { distanceMeters: number | null };
    travelFromB?: { distanceMeters: number | null };
  },
  mode: ExploreTravelMode | null | undefined
): number {
  const boosts = getExploreModeBoosts(mode);
  if (boosts.closeDistanceMeters == null || boosts.farDistanceMeters == null) return 0;

  const meters = representativeDistanceMeters(candidate);
  if (meters == null) return 0;

  if (meters <= boosts.closeDistanceMeters) return boosts.distanceBonus;
  if (meters >= boosts.farDistanceMeters) return boosts.distancePenalty;

  const span = boosts.farDistanceMeters - boosts.closeDistanceMeters;
  const progress = (meters - boosts.closeDistanceMeters) / span;
  const value = boosts.distanceBonus + progress * (boosts.distancePenalty - boosts.distanceBonus);
  return Math.round(value * 10) / 10;
}

export function applyExploreTravelModeRanking(
  results: ScoredVenue[],
  mode: ExploreTravelMode | null | undefined,
  context: ExploreModeRankingContext = {}
): ScoredVenue[] {
  if (!results.length || mode === "auto" || !mode) return results;

  return [...results].sort((left, right) => {
    const scoreLeft = exploreModeScore(left, mode, context);
    const scoreRight = exploreModeScore(right, mode, context);
    if (scoreRight !== scoreLeft) return scoreRight - scoreLeft;
    return right.fairnessScore - left.fairnessScore;
  });
}

function exploreModeScore(venue: RankedVenue, mode: ExploreTravelMode, context: ExploreModeRankingContext) {
  const boosts = getExploreModeBoosts(mode);
  let score = venue.fairnessScore;
  score += getExploreModeDistanceAdjustment(venue, mode);
  score += contentBoost(venue, boosts, context);

  if (mode === "ev" && venue.evCharging) {
    if (venue.evCharging.nearbyCount > 0) score += 12 + Math.min(venue.evCharging.nearbyCount, 4) * 3;
    else if (venue.evCharging.nearestDistanceMeters != null && venue.evCharging.nearestDistanceMeters <= 1600) score += 5;
  }

  return Math.round(score * 10) / 10;
}

function contentBoost(venue: VenueCandidate, boosts: ExploreModeBoosts, context: ExploreModeRankingContext) {
  if (!boosts.contentBoost) return 0;

  const category = venue.category.toLowerCase().replace(/\s+/g, "_");
  const contextCategory = context.category?.toLowerCase().replace(/\s+/g, "_") ?? "";
  let score = 0;

  if (boosts.categories.includes(category) || (contextCategory && boosts.categories.includes(contextCategory))) {
    score += boosts.contentBoost;
  }

  const haystack = [
    venue.name,
    venue.category,
    venue.address,
    context.query ?? "",
    ...(venue.types ?? [])
  ]
    .join(" ")
    .toLowerCase();

  const matchingTerms = boosts.terms.filter((term) => haystack.includes(term)).length;
  if (matchingTerms) {
    score += Math.min(matchingTerms, 2) * boosts.contentBoost;
  }

  return score;
}

function representativeDistanceMeters(candidate: {
  travelFromA?: { distanceMeters: number | null };
  travelFromB?: { distanceMeters: number | null };
}): number | null {
  const distances = [candidate.travelFromA?.distanceMeters, candidate.travelFromB?.distanceMeters].filter(
    (value): value is number => typeof value === "number"
  );
  if (!distances.length) return null;
  return Math.max(...distances);
}
