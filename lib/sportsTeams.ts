import type { LatLng } from "@/lib/types";

export type SportId = "baseball" | "basketball" | "football" | "hockey" | "soccer";

export type TeamHomeMarket = {
  label: string;
  latitude: number;
  longitude: number;
};

export type MajorSportDefinition = {
  id: SportId;
  label: string;
  logo: string;
  /** Ticketmaster classification genre name used to scope sports searches. */
  ticketmasterKeyword: string;
};

export type SportsTeamDefinition = {
  id: string;
  label: string;
  logo: string;
  searchTerm: string;
  ticketmasterKeyword: string;
  sport: SportId;
  homeMarket: TeamHomeMarket;
};

/** Default radius for "near you" team chips (home market to user origin). */
export const LOCAL_TEAM_RADIUS_MILES = 100;

export const MAJOR_SPORTS: MajorSportDefinition[] = [
  { id: "baseball", label: "Baseball", logo: "⚾", ticketmasterKeyword: "Baseball" },
  { id: "basketball", label: "Basketball", logo: "🏀", ticketmasterKeyword: "Basketball" },
  { id: "football", label: "Football", logo: "🏈", ticketmasterKeyword: "Football" },
  { id: "hockey", label: "Hockey", logo: "🏒", ticketmasterKeyword: "Hockey" },
  { id: "soccer", label: "Soccer", logo: "⚽", ticketmasterKeyword: "Soccer" }
];

export const SPORTS_TEAMS: SportsTeamDefinition[] = [
  {
    id: "yankees",
    label: "Yankees",
    logo: "⚾",
    searchTerm: "Yankees",
    ticketmasterKeyword: "New York Yankees",
    sport: "baseball",
    homeMarket: { label: "New York", latitude: 40.8296, longitude: -73.9262 }
  },
  {
    id: "mets",
    label: "Mets",
    logo: "⚾",
    searchTerm: "Mets",
    ticketmasterKeyword: "New York Mets",
    sport: "baseball",
    homeMarket: { label: "New York", latitude: 40.7571, longitude: -73.8458 }
  },
  {
    id: "red_sox",
    label: "Red Sox",
    logo: "⚾",
    searchTerm: "Red Sox",
    ticketmasterKeyword: "Boston Red Sox",
    sport: "baseball",
    homeMarket: { label: "Boston", latitude: 42.3467, longitude: -71.0972 }
  },
  {
    id: "phillies",
    label: "Phillies",
    logo: "⚾",
    searchTerm: "Phillies",
    ticketmasterKeyword: "Philadelphia Phillies",
    sport: "baseball",
    homeMarket: { label: "Philadelphia", latitude: 39.9062, longitude: -75.1665 }
  },
  {
    id: "dodgers",
    label: "Dodgers",
    logo: "⚾",
    searchTerm: "Dodgers",
    ticketmasterKeyword: "Los Angeles Dodgers",
    sport: "baseball",
    homeMarket: { label: "Los Angeles", latitude: 34.0739, longitude: -118.24 }
  },
  {
    id: "cubs",
    label: "Cubs",
    logo: "⚾",
    searchTerm: "Cubs",
    ticketmasterKeyword: "Chicago Cubs",
    sport: "baseball",
    homeMarket: { label: "Chicago", latitude: 41.9484, longitude: -87.6553 }
  },
  {
    id: "knicks",
    label: "Knicks",
    logo: "🏀",
    searchTerm: "Knicks",
    ticketmasterKeyword: "New York Knicks",
    sport: "basketball",
    homeMarket: { label: "New York", latitude: 40.7505, longitude: -73.9934 }
  },
  {
    id: "lakers",
    label: "Lakers",
    logo: "🏀",
    searchTerm: "Lakers",
    ticketmasterKeyword: "Los Angeles Lakers",
    sport: "basketball",
    homeMarket: { label: "Los Angeles", latitude: 34.043, longitude: -118.2673 }
  },
  {
    id: "celtics",
    label: "Celtics",
    logo: "🏀",
    searchTerm: "Celtics",
    ticketmasterKeyword: "Boston Celtics",
    sport: "basketball",
    homeMarket: { label: "Boston", latitude: 42.3662, longitude: -71.0621 }
  },
  {
    id: "warriors",
    label: "Warriors",
    logo: "🏀",
    searchTerm: "Warriors",
    ticketmasterKeyword: "Golden State Warriors",
    sport: "basketball",
    homeMarket: { label: "San Francisco", latitude: 37.768, longitude: -122.3877 }
  },
  {
    id: "eagles",
    label: "Eagles",
    logo: "🏈",
    searchTerm: "Eagles",
    ticketmasterKeyword: "Philadelphia Eagles",
    sport: "football",
    homeMarket: { label: "Philadelphia", latitude: 39.9008, longitude: -75.1675 }
  },
  {
    id: "giants",
    label: "Giants",
    logo: "🏈",
    searchTerm: "Giants",
    ticketmasterKeyword: "New York Giants",
    sport: "football",
    homeMarket: { label: "New York", latitude: 40.8128, longitude: -74.0742 }
  },
  {
    id: "jets",
    label: "Jets",
    logo: "🏈",
    searchTerm: "Jets",
    ticketmasterKeyword: "New York Jets",
    sport: "football",
    homeMarket: { label: "New York", latitude: 40.8128, longitude: -74.0742 }
  },
  {
    id: "cowboys",
    label: "Cowboys",
    logo: "🏈",
    searchTerm: "Cowboys",
    ticketmasterKeyword: "Dallas Cowboys",
    sport: "football",
    homeMarket: { label: "Dallas", latitude: 32.7473, longitude: -97.0945 }
  },
  {
    id: "patriots",
    label: "Patriots",
    logo: "🏈",
    searchTerm: "Patriots",
    ticketmasterKeyword: "New England Patriots",
    sport: "football",
    homeMarket: { label: "Boston", latitude: 42.0909, longitude: -71.2643 }
  },
  {
    id: "chiefs",
    label: "Chiefs",
    logo: "🏈",
    searchTerm: "Chiefs",
    ticketmasterKeyword: "Kansas City Chiefs",
    sport: "football",
    homeMarket: { label: "Kansas City", latitude: 39.0489, longitude: -94.4839 }
  },
  {
    id: "rangers",
    label: "Rangers",
    logo: "🏒",
    searchTerm: "Rangers",
    ticketmasterKeyword: "New York Rangers",
    sport: "hockey",
    homeMarket: { label: "New York", latitude: 40.7505, longitude: -73.9934 }
  },
  {
    id: "bruins",
    label: "Bruins",
    logo: "🏒",
    searchTerm: "Bruins",
    ticketmasterKeyword: "Boston Bruins",
    sport: "hockey",
    homeMarket: { label: "Boston", latitude: 42.3662, longitude: -71.0621 }
  },
  {
    id: "flyers",
    label: "Flyers",
    logo: "🏒",
    searchTerm: "Flyers",
    ticketmasterKeyword: "Philadelphia Flyers",
    sport: "hockey",
    homeMarket: { label: "Philadelphia", latitude: 39.9012, longitude: -75.172 }
  },
  {
    id: "nycfc",
    label: "NYCFC",
    logo: "⚽",
    searchTerm: "NYCFC",
    ticketmasterKeyword: "New York City FC",
    sport: "soccer",
    homeMarket: { label: "New York", latitude: 40.8296, longitude: -73.9262 }
  },
  {
    id: "ny_red_bulls",
    label: "NY Red Bulls",
    logo: "⚽",
    searchTerm: "NY Red Bulls",
    ticketmasterKeyword: "New York Red Bulls",
    sport: "soccer",
    homeMarket: { label: "New York", latitude: 40.7368, longitude: -74.1501 }
  },
  {
    id: "phi_union",
    label: "Philadelphia Union",
    logo: "⚽",
    searchTerm: "Philadelphia Union",
    ticketmasterKeyword: "Philadelphia Union",
    sport: "soccer",
    homeMarket: { label: "Philadelphia", latitude: 39.8328, longitude: -75.3785 }
  },
  {
    id: "la_galaxy",
    label: "LA Galaxy",
    logo: "⚽",
    searchTerm: "LA Galaxy",
    ticketmasterKeyword: "LA Galaxy",
    sport: "soccer",
    homeMarket: { label: "Los Angeles", latitude: 33.8643, longitude: -118.2619 }
  }
];

export function sportsTeamById(id: string | null | undefined) {
  if (!id) return null;
  return SPORTS_TEAMS.find((team) => team.id === id) ?? null;
}

export function majorSportById(id: string | null | undefined) {
  if (!id) return null;
  return MAJOR_SPORTS.find((sport) => sport.id === id) ?? null;
}

export function teamsForSport(sportId: string | null | undefined): SportsTeamDefinition[] {
  if (!sportId) return [];
  return SPORTS_TEAMS.filter((team) => team.sport === sportId);
}

/** Teams whose home market is within `radiusMiles` of the user's origin, nearest first. */
export function localTeamsForSport(
  sportId: string | null | undefined,
  origin?: LatLng | null,
  radiusMiles = LOCAL_TEAM_RADIUS_MILES
): SportsTeamDefinition[] {
  if (!sportId || !origin) return [];
  return teamsForSport(sportId)
    .map((team) => ({
      team,
      distance: haversineMiles(origin.lat, origin.lng, team.homeMarket.latitude, team.homeMarket.longitude)
    }))
    .filter((entry) => entry.distance <= radiusMiles)
    .sort((left, right) => left.distance - right.distance)
    .map((entry) => entry.team);
}

/** Teams outside the local radius — shown under "All teams" when local chips are visible. */
export function otherTeamsForSport(
  sportId: string | null | undefined,
  origin?: LatLng | null,
  radiusMiles = LOCAL_TEAM_RADIUS_MILES
): SportsTeamDefinition[] {
  const all = teamsForSport(sportId);
  if (!origin) return all;
  const localIds = new Set(localTeamsForSport(sportId, origin, radiusMiles).map((team) => team.id));
  return all.filter((team) => !localIds.has(team.id));
}

export function sportIdForTeam(teamId: string | null | undefined): SportId | null {
  return sportsTeamById(teamId)?.sport ?? null;
}

export function sportsTeamTicketmasterKeywords(): Record<string, string> {
  return Object.fromEntries(SPORTS_TEAMS.map((team) => [team.id, team.ticketmasterKeyword]));
}

function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMiles * c;
}

/** Words that signal a sports/event context (used to disambiguate singular team names). */
export const SPORTS_CONTEXT_PATTERN =
  /\b(?:games?|tickets?|schedule|matchup|playoffs?|vs\.?|tonight|today|this weekend|saturday|sunday)\b/i;

/**
 * Singular forms that collide with common words; only ever match these as a team
 * when explicit sports context is present elsewhere — never on their own.
 */
const AMBIGUOUS_SINGULAR_TOKENS = new Set(["giant", "chief", "flyer", "red bull", "ny red bull"]);

function normalizeToken(token: string) {
  return token.toLowerCase().replace(/\s+/g, " ").trim();
}

function singularToken(token: string): string | null {
  if (!token.endsWith("s")) return null;
  const singular = token.slice(0, -1).trim();
  // Require length >= 4 to avoid short, ambiguous stems (e.g. "met", "jet").
  return singular.length >= 4 ? singular : null;
}

/** Unambiguous team aliases (full / plural names) safe to match without context. */
export function teamStrongTokens(team: SportsTeamDefinition): string[] {
  return [...new Set([team.id.replace(/_/g, " "), team.searchTerm, team.label].map(normalizeToken))].filter(Boolean);
}

/** Strong aliases plus singular variants; singulars should be gated by sports context. */
export function teamWeakTokens(team: SportsTeamDefinition): string[] {
  const strong = teamStrongTokens(team);
  const singulars = strong
    .map(singularToken)
    .filter((token): token is string => Boolean(token) && !AMBIGUOUS_SINGULAR_TOKENS.has(token as string));
  return [...new Set([...strong, ...singulars])];
}

function buildTeamPattern(tokensFor: (team: SportsTeamDefinition) => string[]): RegExp {
  const tokens = SPORTS_TEAMS.flatMap(tokensFor).filter(Boolean);
  const unique = [...new Set(tokens)].sort((a, b) => b.length - a.length);
  return new RegExp(`\\b(?:${unique.map(escapeRegex).join("|")})\\b`, "i");
}

/** Matches full/plural team names only (safe to use without sports context). */
export function sportsTeamStrongPattern(): RegExp {
  return buildTeamPattern(teamStrongTokens);
}

/** Matches full/plural names plus singular variants (use together with SPORTS_CONTEXT_PATTERN). */
export function sportsTeamWeakPattern(): RegExp {
  return buildTeamPattern(teamWeakTokens);
}

/** @deprecated Prefer sportsTeamStrongPattern / sportsTeamWeakPattern. */
export function sportsTeamSearchPattern(): RegExp {
  return sportsTeamStrongPattern();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
