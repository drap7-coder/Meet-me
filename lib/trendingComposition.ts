import type { EventResult } from "@/lib/eventResult";
import { classifyResultExperienceType } from "@/lib/resultDiversityRanking";
import { isLikelyTeamGameEvent } from "@/lib/sportsEventFilter";
import {
  localTeamsForSport,
  SPORTS_TEAMS,
  type SportId,
  type SportsTeamDefinition
} from "@/lib/sportsTeams";
import type { LatLng, ScoredVenue } from "@/lib/types";

export type TrendingPickType =
  | "live_music"
  | "comedy"
  | "performing_arts"
  | "baseball"
  | "football"
  | "soccer"
  | "basketball"
  | "hockey"
  | "sports_other"
  | "seasonal_special"
  | "festival"
  | "farmers_market"
  | "outdoors"
  | "culture"
  | "family"
  | "food_drink"
  | "generic";

export type SeasonalSportPriority = {
  sport: SportId;
  inSeason: boolean;
  weight: number;
};

export type TrendingCompositionContext = {
  date?: Date;
  latitude?: number;
  longitude?: number;
  cap?: number;
  query?: string;
  sportsFocused?: boolean;
};

export type TrendingPick = EventResult | ScoredVenue;

export const DEFAULT_TRENDING_COMPOSITION_CAP = 10;

const SPORT_SUBTYPES = new Set<TrendingPickType>([
  "baseball",
  "football",
  "soccer",
  "basketball",
  "hockey",
  "sports_other"
]);

const SEASONAL_SPECIAL_PATTERN =
  /\b(?:world cup|fifa|uefa|euro 20\d{2}|copa america|copa américa|olympics|olympic|march madness|ncaa tournament|playoffs?|postseason|championship game|super bowl|bowl game|opening day|rivalry|derby day|all[-\s]?star game|stanley cup finals|world series|mls cup|nwsl championship)\b/i;

const BASEBALL_PATTERN =
  /\b(?:baseball|mlb|ballpark|softball|minor league|triple[-\s]?a|double[-\s]?a)\b/i;
const FOOTBALL_PATTERN =
  /\b(?:football|nfl|college football|ncaa football|gridiron|super bowl|bowl game)\b/i;
const SOCCER_PATTERN = /\b(?:soccer|mls|nwsl|fifa|football club|fc\b|football match)\b/i;
const BASKETBALL_PATTERN = /\b(?:basketball|nba|wnba|ncaa basketball|march madness)\b/i;
const HOCKEY_PATTERN = /\b(?:hockey|nhl|ice hockey)\b/i;

const COMPOSITION_TARGETS: Array<{
  types: TrendingPickType[];
  sport?: SportId;
}> = [
  { types: ["live_music"] },
  { types: ["baseball"], sport: "baseball" },
  { types: ["football"], sport: "football" },
  { types: ["soccer"], sport: "soccer" },
  { types: ["seasonal_special"] },
  { types: ["comedy", "performing_arts"] },
  { types: ["festival", "farmers_market"] },
  { types: ["outdoors"] },
  { types: ["culture"] },
  { types: ["family"] },
  { types: ["food_drink"] }
];

function isEventResult(result: TrendingPick): result is EventResult {
  return "title" in result && "source" in result;
}

function pickHaystack(result: TrendingPick): string {
  if (isEventResult(result)) {
    return `${result.title} ${result.category} ${result.venue} ${result.city} ${result.state} ${result.source}`;
  }
  return `${result.name} ${result.category} ${result.address} ${(result.types ?? []).join(" ")}`;
}

function originFromContext(context: TrendingCompositionContext): LatLng | null {
  if (context.latitude == null || context.longitude == null) return null;
  return { lat: context.latitude, lng: context.longitude };
}

/** World Cup 2026 host window — treat as an active soccer seasonal special. */
export function isWorldCupWindow(date: Date): boolean {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  if (year === 2026 && month >= 6 && month <= 7) return true;
  return false;
}

export function getSeasonalSportsPriorities(date: Date, location?: LatLng | null): SeasonalSportPriority[] {
  const month = date.getMonth() + 1;
  const worldCup = isWorldCupWindow(date);

  const baseballInSeason = month >= 3 && month <= 10;
  const footballInSeason = month >= 9 || month <= 2;
  const soccerInSeason = month >= 2 && month <= 11 || worldCup;
  const basketballInSeason = month >= 10 || month <= 6;
  const hockeyInSeason = month >= 10 || month <= 6;

  return [
    { sport: "baseball", inSeason: baseballInSeason, weight: baseballInSeason ? 1 : 0 },
    { sport: "football", inSeason: footballInSeason, weight: footballInSeason ? 1 : 0 },
    {
      sport: "soccer",
      inSeason: soccerInSeason,
      weight: worldCup ? 1.6 : soccerInSeason ? 1 : 0
    },
    { sport: "basketball", inSeason: basketballInSeason, weight: basketballInSeason ? 0.6 : 0 },
    { sport: "hockey", inSeason: hockeyInSeason, weight: hockeyInSeason ? 0.6 : 0 }
  ];
}

export function shouldIncludeSeasonalSpecial(result: TrendingPick, context: TrendingCompositionContext = {}): boolean {
  const haystack = pickHaystack(result);
  if (SEASONAL_SPECIAL_PATTERN.test(haystack)) return true;
  if (isWorldCupWindow(context.date ?? new Date()) && /\b(?:world cup|fifa)\b/i.test(haystack)) return true;
  return false;
}

function classifySportsSubtype(haystack: string): TrendingPickType {
  if (SEASONAL_SPECIAL_PATTERN.test(haystack)) return "seasonal_special";
  if (BASEBALL_PATTERN.test(haystack)) return "baseball";
  if (SOCCER_PATTERN.test(haystack)) return "soccer";
  if (FOOTBALL_PATTERN.test(haystack)) return "football";
  if (BASKETBALL_PATTERN.test(haystack)) return "basketball";
  if (HOCKEY_PATTERN.test(haystack)) return "hockey";
  if (/\b(?:sports?|game|stadium|arena)\b/i.test(haystack)) return "sports_other";
  return "generic";
}

export function classifyTrendingPickType(result: TrendingPick): TrendingPickType {
  const haystack = pickHaystack(result);

  if (shouldIncludeSeasonalSpecial(result)) return "seasonal_special";

  const experience = classifyResultExperienceType(result);
  if (experience === "live_event" || experience === "performing_arts") {
    if (/\b(?:comedy|stand[-\s]?up|comedian)\b/i.test(haystack)) return "comedy";
    if (
      /\b(?:concert|live music|tour|festival lineup|music)\b/i.test(haystack) ||
      (isEventResult(result) && /\b(?:music|concert)\b/i.test(result.category))
    ) {
      return "live_music";
    }
    if (experience === "performing_arts") return "performing_arts";
  }

  if (isEventResult(result) && /\b(?:music|concert)\b/i.test(result.category)) {
    return "live_music";
  }

  const sportsType = classifySportsSubtype(haystack);
  if (sportsType !== "generic") return sportsType;

  switch (experience) {
    case "farmers_market":
      return "farmers_market";
    case "festival":
      return "festival";
    case "outdoors":
      return "outdoors";
    case "culture":
      return "culture";
    case "family":
      return "family";
    case "food_drink":
      return "food_drink";
    case "sports":
      return "sports_other";
    default:
      return "generic";
  }
}

function resolveLocalTeam(result: EventResult, origin: LatLng | null): SportsTeamDefinition | null {
  for (const team of SPORTS_TEAMS) {
    if (!isLikelyTeamGameEvent(result, team)) continue;
    if (!origin) return team;
    if (localTeamsForSport(team.sport, origin).some((entry) => entry.id === team.id)) return team;
  }
  return null;
}

function sportIdForPickType(type: TrendingPickType): SportId | null {
  if (type === "baseball") return "baseball";
  if (type === "football") return "football";
  if (type === "soccer") return "soccer";
  if (type === "basketball") return "basketball";
  if (type === "hockey") return "hockey";
  return null;
}

function isSportType(type: TrendingPickType): boolean {
  return SPORT_SUBTYPES.has(type) || type === "seasonal_special";
}

type ScoredTrendingPick = {
  result: TrendingPick;
  type: TrendingPickType;
  score: number;
  localTeam: boolean;
  seasonalSpecial: boolean;
  qualityFloor: boolean;
};

function scoreTrendingPick(
  result: TrendingPick,
  index: number,
  context: TrendingCompositionContext,
  origin: LatLng | null
): ScoredTrendingPick {
  const type = classifyTrendingPickType(result);
  let score = 1000 - index * 4;
  const seasonalSpecial = shouldIncludeSeasonalSpecial(result, context);

  if (isEventResult(result)) {
    if (result.imageUrl?.trim()) score += 10;
    const localTeam = resolveLocalTeam(result, origin);
    if (localTeam) score += 28;
  }

  if (seasonalSpecial) score += 42;
  if (type === "live_music") score += 6;

  const qualityFloor =
    !SPORT_SUBTYPES.has(type) ||
    type === "seasonal_special" ||
    (isEventResult(result) && Boolean(result.imageUrl?.trim()));

  return {
    result,
    type,
    score,
    localTeam: isEventResult(result) ? Boolean(resolveLocalTeam(result, origin)) : false,
    seasonalSpecial,
    qualityFloor
  };
}

function dedupePicks(items: ScoredTrendingPick[]): ScoredTrendingPick[] {
  const seen = new Set<string>();
  const results: ScoredTrendingPick[] = [];

  for (const item of items) {
    const key = isEventResult(item.result)
      ? `${item.result.source}:${item.result.id}`
      : `place:${item.result.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(item);
  }

  return results;
}

function countSportSubtypes(selected: ScoredTrendingPick[]) {
  return {
    baseball: selected.filter((item) => item.type === "baseball").length,
    football: selected.filter((item) => item.type === "football").length,
    soccer: selected.filter((item) => item.type === "soccer").length,
    seasonalSpecial: selected.filter((item) => item.seasonalSpecial).length,
    total: selected.filter((item) => isSportType(item.type)).length
  };
}

function canAddPick(
  item: ScoredTrendingPick,
  selected: ScoredTrendingPick[],
  context: TrendingCompositionContext,
  inSeasonSports: Set<SportId>,
  bestScore: number
): boolean {
  if (item.score < bestScore - 36 && !item.seasonalSpecial) return false;
  if (isSportType(item.type) && !item.qualityFloor) return false;

  const sportCounts = countSportSubtypes(selected);
  const sportsFocused = context.sportsFocused ?? false;
  const maxSports = sportsFocused ? context.cap ?? DEFAULT_TRENDING_COMPOSITION_CAP : item.seasonalSpecial ? 4 : 2;

  if (isSportType(item.type) && !sportsFocused) {
    if (sportCounts.total >= maxSports && !item.seasonalSpecial) return false;

    const sportId = sportIdForPickType(item.type);
    if (sportId && !inSeasonSports.has(sportId) && !item.seasonalSpecial) return false;

    if (item.type === "baseball" && sportCounts.baseball >= 1 && !item.seasonalSpecial) return false;
    if (item.type === "football" && sportCounts.football >= 1 && !item.seasonalSpecial) return false;
    if (item.type === "soccer" && sportCounts.soccer >= 1 && !item.seasonalSpecial) return false;
  }

  return true;
}

function pickBestMatching(
  pool: ScoredTrendingPick[],
  selected: ScoredTrendingPick[],
  types: TrendingPickType[],
  context: TrendingCompositionContext,
  inSeasonSports: Set<SportId>,
  bestScore: number,
  preferLocal = false
): ScoredTrendingPick | undefined {
  const selectedKeys = new Set(
    selected.map((item) =>
      isEventResult(item.result) ? `${item.result.source}:${item.result.id}` : `place:${item.result.id}`
    )
  );

  const candidates = pool
    .filter((item) => {
      const key = isEventResult(item.result)
        ? `${item.result.source}:${item.result.id}`
        : `place:${item.result.id}`;
      return !selectedKeys.has(key) && types.includes(item.type);
    })
    .sort((left, right) => {
      if (preferLocal && left.localTeam !== right.localTeam) return left.localTeam ? -1 : 1;
      return right.score - left.score;
    });

  return candidates.find((item) => canAddPick(item, selected, context, inSeasonSports, bestScore));
}

export function composeTrendingPicks<T extends TrendingPick>(
  results: T[],
  context: TrendingCompositionContext = {}
): T[] {
  if (!results.length) return [];

  const cap = context.cap ?? DEFAULT_TRENDING_COMPOSITION_CAP;
  const date = context.date ?? new Date();
  const origin = originFromContext(context);
  const priorities = getSeasonalSportsPriorities(date, origin);
  const inSeasonSports = new Set(priorities.filter((entry) => entry.inSeason).map((entry) => entry.sport));

  const pool = dedupePicks(results.map((result, index) => scoreTrendingPick(result, index, context, origin))).sort(
    (left, right) => right.score - left.score
  );
  const bestScore = pool[0]?.score ?? 0;
  const selected: ScoredTrendingPick[] = [];

  function add(item: ScoredTrendingPick | undefined) {
    if (!item || selected.length >= cap) return;
    selected.push(item);
  }

  for (const target of COMPOSITION_TARGETS) {
    if (selected.length >= cap) break;
    if (target.sport && !inSeasonSports.has(target.sport)) continue;
    add(
      pickBestMatching(pool, selected, target.types, context, inSeasonSports, bestScore, Boolean(target.sport))
    );
  }

  for (const item of pool) {
    if (selected.length >= cap) break;
    const key = isEventResult(item.result)
      ? `${item.result.source}:${item.result.id}`
      : `place:${item.result.id}`;
    if (
      selected.some((entry) => {
        const entryKey = isEventResult(entry.result)
          ? `${entry.result.source}:${entry.result.id}`
          : `place:${entry.result.id}`;
        return entryKey === key;
      })
    ) {
      continue;
    }
    if (canAddPick(item, selected, context, inSeasonSports, bestScore)) selected.push(item);
  }

  return selected.map((item) => item.result as T);
}

export function inSeasonSportIds(date: Date, location?: LatLng | null): Set<SportId> {
  return new Set(getSeasonalSportsPriorities(date, location).filter((entry) => entry.inSeason).map((entry) => entry.sport));
}
