import type { LocalEventProfile } from "@/lib/eventResult";
import { parseEventDateWindowFromQuery } from "@/lib/eventDates";
import { extractMusicGenreFromQuery } from "@/lib/musicGenres";
import { hasNamedMusicArtistInQuery } from "@/lib/musicArtists";
import { hasNamedTeamInQuery, resolveNamedSportsTeam } from "@/lib/sportsEventFilter";
import {
  SPORTS_CONTEXT_PATTERN,
  SPORTS_TEAMS,
  sportsTeamById,
  sportsTeamStrongPattern,
  sportsTeamWeakPattern
} from "@/lib/sportsTeams";
import { isOpenTripMapFriendlyQuery } from "@/lib/exploreQueryClassification";
import { isLocalHappeningsQuery } from "@/lib/localHappenings";
import type { VenueCategory } from "@/lib/types";
import { detectEventsIntent, hasStreamingWatchContext } from "@/lib/watchEvents";

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
  "bookstore",
  "farmers_markets",
  "park",
  "hiking",
  "gardens",
  "waterfronts",
  "scenic_spots",
  "nature_preserves",
  "museums",
  "bowling",
  "arcades",
  "escape_rooms",
  "pickleball",
  "driving_range"
]);

const PLACE_ONLY_QUERY =
  /\b(?:restaurant|restaurants|coffee shop|coffee|cafe|pizza|sushi|brunch|lunch|dinner|breakfast|brewery|breweries|bar|cafe|shopping|mall|store|stores|bookstore)\b/i;

const SPORTS_TEAM_PATTERN = sportsTeamStrongPattern();
const SPORTS_TEAM_WEAK_PATTERN = sportsTeamWeakPattern();

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

  // Singular team names ("Yankee game") only when sports context is also present.
  if (SPORTS_TEAM_WEAK_PATTERN.test(value) && SPORTS_CONTEXT_PATTERN.test(value)) {
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
  const team = resolveNamedSportsTeam(query);
  if (team) return team.searchTerm;

  const value = query.toLowerCase();

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
  return hasNamedTeamInQuery(query) && !/\bnear me\b/i.test(query);
}

/**
 * Concrete event-type signals (concerts, comedy, festivals, theater, sports, named
 * teams). These are "event-first" asks that should resolve straight to Ticketmaster
 * without spinning up a Google Places/Routes shell.
 */
const CONCRETE_EVENT_TYPE_PATTERN =
  /\b(?:concerts?|comedy|stand[- ]?up|festivals?|theat(?:er|re)|broadway|live music|gigs?|tickets?)\b/i;

/** Concert / live-music asks — use Ticketmaster Music segment, not keyword=concert. */
export const MUSIC_EVENT_PATTERN = /\b(?:concerts?|live music|gigs?)\b/i;

export function isMusicEventQuery(query: string): boolean {
  return MUSIC_EVENT_PATTERN.test(query) || Boolean(extractMusicGenreFromQuery(query)) || hasNamedMusicArtistInQuery(query);
}

/** Local event/sports/concert asks that require a resolved origin before searching. */
export function queryRequiresEventLocation(query: string): boolean {
  const value = query.trim();
  if (!value) return false;
  if (isTeamSpecificSportsQuery(value)) return false;
  if (hasStreamingWatchContext(value)) return false;
  return isPureEventQuery(value) || detectEventsIntent(value) || shouldFetchTicketmasterEvents(value);
}

/**
 * True for pure event/sports/concert/team queries that should be answered by the
 * event provider alone. Generic discovery asks ("date night", "things to do",
 * "fun saturday", "family activities") return false so they still blend with
 * Google local venues.
 */
export function isPureEventQuery(query: string): boolean {
  const value = query.trim();
  if (!value) return false;
  if (/\b(?:date night|festivals?)\b/i.test(value)) return false;
  if (isSportsEventQuery(value) || hasNamedTeamInQuery(value)) return true;
  if (isMusicEventQuery(value)) return true;
  return CONCRETE_EVENT_TYPE_PATTERN.test(value);
}

export { hasNamedTeamInQuery, resolveNamedSportsTeam } from "@/lib/sportsEventFilter";

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

  if (/\b(?:things to do|fun|plans?|what(?:'s| is) happening)\b.*\b(?:this weekend|weekend|tonight|today|tomorrow|saturday|sunday|this afternoon|this evening)\b/i.test(trimmed)) {
    return true;
  }

  // Farmers markets, flea markets, street fairs, etc. are Places-first — Ticketmaster
  // adds unrelated concerts when blended onto these results.
  // OpenTripMap-friendly discovery (markets, museums, parks, etc.) stays Places-first.
  if (isOpenTripMapFriendlyQuery(trimmed)) {
    return false;
  }

  if (isLocalHappeningsQuery(trimmed)) {
    return false;
  }

  if (category && PLACE_ONLY_CATEGORIES.has(category)) {
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

  if (isMusicEventQuery(query)) {
    return "music";
  }

  return "general";
}

export function eventTimeWindow(profile: LocalEventProfile, query = ""): { start: Date; end: Date } {
  const specificDay = parseEventDateWindowFromQuery(query);
  if (specificDay) return specificDay;

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
      // Unqualified sport/team picks: just surface the NEXT games, regardless of how
      // far out they are (e.g. a team on an in-season break). Ticketmaster sorts by
      // date ascending, so a wide window returns the soonest upcoming games first.
      end.setTime(now.getTime());
      end.setFullYear(end.getFullYear() + 1);
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
    case "music": {
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
      // Unqualified concert picks: wide window so tours and on-sale dates aren't clipped.
      end.setTime(now.getTime());
      end.setFullYear(end.getFullYear() + 1);
      end.setHours(23, 59, 59, 999);
      return { start: now, end };
    }
    default:
      end.setDate(end.getDate() + 14);
      end.setHours(23, 59, 59, 999);
      return { start: now, end };
  }
}
