export type SportsTeamDefinition = {
  id: string;
  label: string;
  logo: string;
  searchTerm: string;
  ticketmasterKeyword: string;
};

export const SPORTS_TEAMS: SportsTeamDefinition[] = [
  { id: "yankees", label: "Yankees", logo: "⚾", searchTerm: "Yankees", ticketmasterKeyword: "New York Yankees" },
  { id: "mets", label: "Mets", logo: "⚾", searchTerm: "Mets", ticketmasterKeyword: "New York Mets" },
  { id: "red_sox", label: "Red Sox", logo: "⚾", searchTerm: "Red Sox", ticketmasterKeyword: "Boston Red Sox" },
  { id: "phillies", label: "Phillies", logo: "⚾", searchTerm: "Phillies", ticketmasterKeyword: "Philadelphia Phillies" },
  { id: "dodgers", label: "Dodgers", logo: "⚾", searchTerm: "Dodgers", ticketmasterKeyword: "Los Angeles Dodgers" },
  { id: "cubs", label: "Cubs", logo: "⚾", searchTerm: "Cubs", ticketmasterKeyword: "Chicago Cubs" },
  { id: "eagles", label: "Eagles", logo: "🏈", searchTerm: "Eagles", ticketmasterKeyword: "Philadelphia Eagles" },
  { id: "giants", label: "Giants", logo: "🏈", searchTerm: "Giants", ticketmasterKeyword: "New York Giants" },
  { id: "jets", label: "Jets", logo: "🏈", searchTerm: "Jets", ticketmasterKeyword: "New York Jets" },
  { id: "cowboys", label: "Cowboys", logo: "🏈", searchTerm: "Cowboys", ticketmasterKeyword: "Dallas Cowboys" },
  { id: "patriots", label: "Patriots", logo: "🏈", searchTerm: "Patriots", ticketmasterKeyword: "New England Patriots" },
  { id: "chiefs", label: "Chiefs", logo: "🏈", searchTerm: "Chiefs", ticketmasterKeyword: "Kansas City Chiefs" },
  { id: "knicks", label: "Knicks", logo: "🏀", searchTerm: "Knicks", ticketmasterKeyword: "New York Knicks" },
  { id: "lakers", label: "Lakers", logo: "🏀", searchTerm: "Lakers", ticketmasterKeyword: "Los Angeles Lakers" },
  { id: "celtics", label: "Celtics", logo: "🏀", searchTerm: "Celtics", ticketmasterKeyword: "Boston Celtics" },
  { id: "warriors", label: "Warriors", logo: "🏀", searchTerm: "Warriors", ticketmasterKeyword: "Golden State Warriors" },
  { id: "rangers", label: "Rangers", logo: "🏒", searchTerm: "Rangers", ticketmasterKeyword: "New York Rangers" },
  { id: "bruins", label: "Bruins", logo: "🏒", searchTerm: "Bruins", ticketmasterKeyword: "Boston Bruins" },
  { id: "flyers", label: "Flyers", logo: "🏒", searchTerm: "Flyers", ticketmasterKeyword: "Philadelphia Flyers" }
];

export function sportsTeamById(id: string | null | undefined) {
  if (!id) return null;
  return SPORTS_TEAMS.find((team) => team.id === id) ?? null;
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
