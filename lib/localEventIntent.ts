import type { LocalEventProfile } from "@/lib/eventResult";
import { sportsTeamSearchPattern, sportsTeamById, SPORTS_TEAMS } from "@/lib/sportsTeams";
import type { VenueCategory } from "@/lib/types";
import { detectEventsIntent } from "@/lib/watchEvents";

const PLACE_ONLY_CATEGORIES = new Set<VenueCategory>([
  "restaurant",
  "coffee",
  "shopping",
  "malls",
  "outlets",
  "pizza",
  "sushi",
  "italian",
  "mexican",
  "thai",
  "indian",
  "steakhouse",
  "brunch",
  "breakfast",
  "bbq",
  "breweries",
  "cocktail_bars",
  "wine_bars",
  "dessert",
  "thrifting",
  "vintage",
  "bookstore"
]);

const PLACE_ONLY_QUERY =
  /\b(?:restaurant|restaurants|coffee shop|coffee|cafe|pizza|sushi|brunch|lunch|dinner|breakfast|brewery|breweries|bar|cafe|shopping|mall|store|stores|bookstore)\b/i;

const SPORTS_TEAM_PATTERN = sportsTeamSearchPattern();

const SPORTS_LEAGUE_PATTERN = /\b(?:nfl|nba|mlb|nhl|mls|ncaa|wnba)\b/i;

const TEAM_TICKETMASTER_KEYWORDS = Object.fromEntries(
  SPORTS_TEAMS.flatMap((team) => [
    [team.id, team.ticketmasterKeyword],
    [team.searchTerm.toLowerCase(), team.ticketmasterKeyword],
    [team.label.toLowerCase(), team.ticketmasterKeyword]
  ])
);

export function isSportsEventQuery(query: string): boolean {
  const value = query.toLowerCase();

  if (
    /\b(?:game tonight|games tonight|live sports|sports near|watch the .+ game|watch .+ game tonight)\b/i.test(
      value
    )
  ) {
    return true;
  }

  if (SPORTS_TEAM_PATTERN.test(value) || SPORTS_LEAGUE_PATTERN.test(value)) {
    return true;
  }

  if (
    /\b(?:football|baseball|basketball|hockey|soccer)\b/i.test(value) &&
    /\b(?:game|games|tickets?|near|tonight|weekend|saturday|sunday)\b/i.test(value)
  ) {
    return true;
  }

  if (/\b(?:sports?|games?)\b/i.test(value) && /\bnear\b/i.test(value)) {
    return true;
  }

  return false;
}

export function extractSportsSearchKeyword(query: string): string {
  const value = query.toLowerCase();

  const teamMatch = value.match(SPORTS_TEAM_PATTERN);
  if (teamMatch?.[0]) return teamMatch[0].replace(/\s+/g, " ").trim();

  const leagueMatch = value.match(SPORTS_LEAGUE_PATTERN);
  if (leagueMatch?.[1]) return leagueMatch[1];

  const sportMatch = value.match(/\b(football|baseball|basketball|hockey|soccer)\b/);
  if (sportMatch?.[1]) return sportMatch[1];

  const watchGameMatch = value.match(/\bwatch(?:ing)?(?: the)? ([a-z][a-z\s]{1,20}?) game\b/);
  if (watchGameMatch?.[1]) {
    const team = watchGameMatch[1].trim();
    if (!["a", "the", "this", "that"].includes(team)) return team;
  }

  return "";
}

export function isTeamSpecificSportsQuery(query: string): boolean {
  if (/\bnear me\b/i.test(query)) return false;

  const value = query.toLowerCase();
  if (SPORTS_TEAM_PATTERN.test(value)) return true;

  const watchGameMatch = value.match(/\bwatch(?:ing)?(?: the)? ([a-z][a-z\s]{1,20}?) game\b/);
  if (watchGameMatch?.[1]) {
    const team = watchGameMatch[1].trim();
    if (!["a", "the", "this", "that"].includes(team)) return true;
  }

  return false;
}

export function teamTicketmasterKeyword(query: string): string {
  const token = extractSportsSearchKeyword(query).toLowerCase();
  if (!token) return "";

  const byId = sportsTeamById(token.replace(/\s+/g, "_"));
  if (byId) return byId.ticketmasterKeyword;

  return TEAM_TICKETMASTER_KEYWORDS[token] ?? token;
}

export function eventMatchesTeamQuery(eventTitle: string, query: string): boolean {
  const token = extractSportsSearchKeyword(query).toLowerCase();
  if (!token) return true;

  const haystack = eventTitle.toLowerCase();
  const fullName = TEAM_TICKETMASTER_KEYWORDS[token]?.toLowerCase() ?? "";
  return haystack.includes(token) || (fullName ? haystack.includes(fullName) : false);
}

export function shouldFetchTicketmasterEvents(query: string, category?: VenueCategory): boolean {
  const trimmed = query.trim();
  if (!trimmed) return false;

  if (category && PLACE_ONLY_CATEGORIES.has(category) && !detectEventsIntent(trimmed)) {
    return false;
  }

  if (PLACE_ONLY_QUERY.test(trimmed) && !detectEventsIntent(trimmed)) {
    return false;
  }

  return detectEventsIntent(trimmed) || hasLocalEventProfile(trimmed) || category === "events";
}

function hasLocalEventProfile(query: string): boolean {
  return (
    /\b(?:things to do|date night|fun tonight|family activit|concerts?|comedy shows?|festivals?|live entertainment|what(?:'s| is) (?:happening|on) tonight|this weekend)\b/i.test(
      query
    ) ||
    isSportsEventQuery(query) ||
    classifyLocalEventProfile(query) !== "general"
  );
}

export function classifyLocalEventProfile(query: string): LocalEventProfile {
  const value = query.toLowerCase();

  if (isSportsEventQuery(query)) {
    return "sports";
  }

  if (/\b(?:tonight|today|this evening|right now)\b/i.test(value)) {
    return "tonight";
  }

  if (/\b(?:date night|romantic|couples?)\b/i.test(value)) {
    return "date_night";
  }

  if (/\b(?:family|kids?|children)\b/i.test(value)) {
    return "family";
  }

  if (/\b(?:this weekend|saturday|sunday|weekend)\b/i.test(value)) {
    return "weekend";
  }

  return "general";
}

export function eventTimeWindow(profile: LocalEventProfile, query = ""): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  const value = query.toLowerCase();

  switch (profile) {
    case "tonight":
      end.setDate(end.getDate() + 1);
      end.setHours(5, 0, 0, 0);
      return { start: now, end };
    case "sports": {
      if (/\b(?:tonight|today|this evening|right now)\b/i.test(value)) {
        end.setDate(end.getDate() + 1);
        end.setHours(5, 0, 0, 0);
        return { start: now, end };
      }
      if (/\b(?:this weekend|saturday|sunday|weekend)\b/i.test(value)) {
        const day = now.getDay();
        const daysUntilSaturday = (6 - day + 7) % 7;
        start.setDate(start.getDate() + daysUntilSaturday);
        end.setTime(start.getTime());
        end.setDate(end.getDate() + 2);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
      end.setTime(now.getTime());
      end.setDate(end.getDate() + 21);
      end.setHours(23, 59, 59, 999);
      return { start: now, end };
    }
    case "weekend": {
      const day = now.getDay();
      const daysUntilSaturday = (6 - day + 7) % 7;
      start.setDate(start.getDate() + daysUntilSaturday);
      end.setTime(start.getTime());
      end.setDate(end.getDate() + 2);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    default:
      end.setDate(end.getDate() + 14);
      end.setHours(23, 59, 59, 999);
      return { start: now, end };
  }
}
