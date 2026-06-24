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

export function sportsTeamSearchPattern(): RegExp {
  const tokens = SPORTS_TEAMS.flatMap((team) => [team.id.replace(/_/g, " "), team.searchTerm, team.label])
    .map((token) => token.toLowerCase().replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const unique = [...new Set(tokens)].sort((a, b) => b.length - a.length);
  return new RegExp(`\\b(?:${unique.map(escapeRegex).join("|")})\\b`, "i");
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
