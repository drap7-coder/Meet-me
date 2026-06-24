export type SportId = "baseball" | "basketball" | "football" | "hockey" | "soccer";

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
};

export const MAJOR_SPORTS: MajorSportDefinition[] = [
  { id: "baseball", label: "Baseball", logo: "⚾", ticketmasterKeyword: "Baseball" },
  { id: "basketball", label: "Basketball", logo: "🏀", ticketmasterKeyword: "Basketball" },
  { id: "football", label: "Football", logo: "🏈", ticketmasterKeyword: "Football" },
  { id: "hockey", label: "Hockey", logo: "🏒", ticketmasterKeyword: "Hockey" },
  { id: "soccer", label: "Soccer", logo: "⚽", ticketmasterKeyword: "Soccer" }
];

export const SPORTS_TEAMS: SportsTeamDefinition[] = [
  { id: "yankees", label: "Yankees", logo: "⚾", searchTerm: "Yankees", ticketmasterKeyword: "New York Yankees", sport: "baseball" },
  { id: "mets", label: "Mets", logo: "⚾", searchTerm: "Mets", ticketmasterKeyword: "New York Mets", sport: "baseball" },
  { id: "red_sox", label: "Red Sox", logo: "⚾", searchTerm: "Red Sox", ticketmasterKeyword: "Boston Red Sox", sport: "baseball" },
  { id: "phillies", label: "Phillies", logo: "⚾", searchTerm: "Phillies", ticketmasterKeyword: "Philadelphia Phillies", sport: "baseball" },
  { id: "dodgers", label: "Dodgers", logo: "⚾", searchTerm: "Dodgers", ticketmasterKeyword: "Los Angeles Dodgers", sport: "baseball" },
  { id: "cubs", label: "Cubs", logo: "⚾", searchTerm: "Cubs", ticketmasterKeyword: "Chicago Cubs", sport: "baseball" },
  { id: "knicks", label: "Knicks", logo: "🏀", searchTerm: "Knicks", ticketmasterKeyword: "New York Knicks", sport: "basketball" },
  { id: "lakers", label: "Lakers", logo: "🏀", searchTerm: "Lakers", ticketmasterKeyword: "Los Angeles Lakers", sport: "basketball" },
  { id: "celtics", label: "Celtics", logo: "🏀", searchTerm: "Celtics", ticketmasterKeyword: "Boston Celtics", sport: "basketball" },
  { id: "warriors", label: "Warriors", logo: "🏀", searchTerm: "Warriors", ticketmasterKeyword: "Golden State Warriors", sport: "basketball" },
  { id: "eagles", label: "Eagles", logo: "🏈", searchTerm: "Eagles", ticketmasterKeyword: "Philadelphia Eagles", sport: "football" },
  { id: "giants", label: "Giants", logo: "🏈", searchTerm: "Giants", ticketmasterKeyword: "New York Giants", sport: "football" },
  { id: "jets", label: "Jets", logo: "🏈", searchTerm: "Jets", ticketmasterKeyword: "New York Jets", sport: "football" },
  { id: "cowboys", label: "Cowboys", logo: "🏈", searchTerm: "Cowboys", ticketmasterKeyword: "Dallas Cowboys", sport: "football" },
  { id: "patriots", label: "Patriots", logo: "🏈", searchTerm: "Patriots", ticketmasterKeyword: "New England Patriots", sport: "football" },
  { id: "chiefs", label: "Chiefs", logo: "🏈", searchTerm: "Chiefs", ticketmasterKeyword: "Kansas City Chiefs", sport: "football" },
  { id: "rangers", label: "Rangers", logo: "🏒", searchTerm: "Rangers", ticketmasterKeyword: "New York Rangers", sport: "hockey" },
  { id: "bruins", label: "Bruins", logo: "🏒", searchTerm: "Bruins", ticketmasterKeyword: "Boston Bruins", sport: "hockey" },
  { id: "flyers", label: "Flyers", logo: "🏒", searchTerm: "Flyers", ticketmasterKeyword: "Philadelphia Flyers", sport: "hockey" },
  { id: "nycfc", label: "NYCFC", logo: "⚽", searchTerm: "NYCFC", ticketmasterKeyword: "New York City FC", sport: "soccer" },
  { id: "ny_red_bulls", label: "NY Red Bulls", logo: "⚽", searchTerm: "NY Red Bulls", ticketmasterKeyword: "New York Red Bulls", sport: "soccer" },
  { id: "phi_union", label: "Philadelphia Union", logo: "⚽", searchTerm: "Philadelphia Union", ticketmasterKeyword: "Philadelphia Union", sport: "soccer" },
  { id: "la_galaxy", label: "LA Galaxy", logo: "⚽", searchTerm: "LA Galaxy", ticketmasterKeyword: "LA Galaxy", sport: "soccer" }
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

export function sportIdForTeam(teamId: string | null | undefined): SportId | null {
  return sportsTeamById(teamId)?.sport ?? null;
}

export function sportsTeamTicketmasterKeywords(): Record<string, string> {
  return Object.fromEntries(SPORTS_TEAMS.map((team) => [team.id, team.ticketmasterKeyword]));
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
