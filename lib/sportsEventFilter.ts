import type { EventResult } from "@/lib/eventResult";
import type { SportsTeamDefinition } from "@/lib/sportsTeams";
import { SPORTS_TEAMS } from "@/lib/sportsTeams";

const NON_GAME_EVENT =
  /\b(?:parking|stadium tour|ballpark tour|venue tour|season ticket|waitlist|merchandise|fan fest|experience pass|hospitality only)\b/i;

const SPORTS_GAME_CATEGORY =
  /\b(?:baseball|football|basketball|hockey|soccer|mlb|nba|nfl|nhl|mls|college|sports)\b/i;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function resolveNamedSportsTeam(query: string): SportsTeamDefinition | null {
  const value = query.toLowerCase();

  for (const team of SPORTS_TEAMS) {
    const aliases = [team.searchTerm, team.label, team.id.replace(/_/g, " ")].map((part) => part.toLowerCase());
    if (aliases.some((alias) => new RegExp(`\\b${escapeRegex(alias)}\\b`, "i").test(value))) {
      return team;
    }
  }

  const watchGameMatch = value.match(/\bwatch(?:ing)?(?: the)? ([a-z][a-z\s]{1,20}?) game\b/);
  if (watchGameMatch?.[1]) {
    const candidate = watchGameMatch[1].trim();
    if (!["a", "the", "this", "that"].includes(candidate)) {
      return (
        SPORTS_TEAMS.find((team) => team.searchTerm.toLowerCase() === candidate || team.label.toLowerCase() === candidate) ??
        null
      );
    }
  }

  return null;
}

export function hasNamedTeamInQuery(query: string): boolean {
  return resolveNamedSportsTeam(query) !== null;
}

export function isLikelyTeamGameEvent(event: EventResult, team: SportsTeamDefinition): boolean {
  const title = event.title.toLowerCase();
  const names = [team.searchTerm, team.label, team.ticketmasterKeyword].map((part) => part.toLowerCase());
  const mentionsTeam = names.some((name) => title.includes(name));
  if (!mentionsTeam) return false;

  if (NON_GAME_EVENT.test(title)) return false;

  const haystack = `${event.title} ${event.category}`.toLowerCase();
  if (SPORTS_GAME_CATEGORY.test(haystack)) return true;

  return /\b(?:vs\.?|v\.| at )\b/i.test(title);
}

export function normalizeTeamGameKey(event: EventResult): string {
  let title = event.title
    .toLowerCase()
    .replace(/\*[^*]+\*/g, " ")
    .replace(/\b(premium seating|pinstripe pass|suite package|flex pack|ticket package)\b/gi, " ")
    .replace(/\bv\.?\b/g, " vs ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const dateKey = event.startTime.slice(0, 10);
  return `${title}:${dateKey}`;
}

export function filterNamedTeamGameEvents(events: EventResult[], query: string): EventResult[] {
  const team = resolveNamedSportsTeam(query);
  if (!team) return events;

  const filtered = events.filter((event) => isLikelyTeamGameEvent(event, team));
  const seen = new Set<string>();
  const deduped: EventResult[] = [];

  for (const event of filtered) {
    const key = normalizeTeamGameKey(event);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(event);
  }

  return deduped;
}
