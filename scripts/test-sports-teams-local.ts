import {
  localTeamsForSport,
  otherTeamsForSport,
  teamsForSport,
  SPORTS_TEAMS
} from "../lib/sportsTeams";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const nyc = { lat: 40.758, lng: -73.9855 };
const la = { lat: 34.0522, lng: -118.2437 };
const kansasCity = { lat: 39.0997, lng: -94.5786 };

assert(SPORTS_TEAMS.every((team) => team.homeMarket?.latitude && team.homeMarket?.longitude), "every team has homeMarket");

const nyBaseballLocal = localTeamsForSport("baseball", nyc).map((t) => t.id);
assert(nyBaseballLocal.includes("yankees"), `NYC local baseball includes Yankees: ${nyBaseballLocal.join(",")}`);
assert(nyBaseballLocal.includes("mets"), `NYC local baseball includes Mets: ${nyBaseballLocal.join(",")}`);
assert(!nyBaseballLocal.includes("dodgers"), "NYC local baseball excludes Dodgers");

const nyBaseballOther = otherTeamsForSport("baseball", nyc).map((t) => t.id);
assert(nyBaseballOther.includes("dodgers"), "NYC other baseball includes Dodgers");
assert(!nyBaseballOther.includes("yankees"), "NYC other baseball excludes Yankees");

const laBaseballLocal = localTeamsForSport("baseball", la).map((t) => t.id);
assert(laBaseballLocal.includes("dodgers"), "LA local baseball includes Dodgers");
assert(!laBaseballLocal.includes("yankees"), "LA local baseball excludes Yankees");

const kcFootballLocal = localTeamsForSport("football", kansasCity).map((t) => t.id);
assert(kcFootballLocal.includes("chiefs"), "KC local football includes Chiefs");
assert(!kcFootballLocal.includes("eagles"), "KC local football excludes Eagles");

assert(localTeamsForSport("baseball", null).length === 0, "no origin -> no local teams");
assert(otherTeamsForSport("baseball", null).length === teamsForSport("baseball").length, "no origin -> all teams in other");

const localIds = new Set(localTeamsForSport("soccer", nyc).map((t) => t.id));
const otherIds = new Set(otherTeamsForSport("soccer", nyc).map((t) => t.id));
for (const id of localIds) assert(!otherIds.has(id), `no overlap for soccer local/other: ${id}`);

console.log("PASS sports teams local vs all");
