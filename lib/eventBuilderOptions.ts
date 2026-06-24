import type { BuilderRefinement } from "@/lib/searchBuilderOptions";
import { SPORTS_TEAMS } from "@/lib/sportsTeams";

export const EVENT_TYPE_REFINEMENTS: BuilderRefinement[] = [
  { id: "concerts", label: "🎵 Concerts", group: "type", noun: "concerts" },
  { id: "comedy", label: "😂 Comedy", group: "type", noun: "comedy shows" },
  { id: "sports", label: "🏈 Sports", group: "type", noun: "live sports" },
  { id: "festivals", label: "🎪 Festivals", group: "type", noun: "festivals" },
  { id: "theater", label: "🎭 Theater", group: "type", noun: "theater shows" },
  { id: "date_night", label: "💕 Date Night", group: "type", noun: "date night events" },
  { id: "weekend", label: "🎉 This Weekend", group: "type", noun: "things to do this weekend" }
];

export { SPORTS_TEAMS };

export function resolveEventTypeRefinement(typeId: string | null) {
  if (!typeId) return null;
  return EVENT_TYPE_REFINEMENTS.find((item) => item.id === typeId) ?? null;
}

export function isEventSportsType(typeId: string | null) {
  return typeId === "sports";
}

export function sportsTeamChipLabel(teamId: string) {
  const team = SPORTS_TEAMS.find((item) => item.id === teamId);
  if (!team) return teamId;
  return `${team.logo} ${team.label}`;
}
