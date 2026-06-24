import type { EventResult } from "@/lib/eventResult";
import {
  filterNamedTeamGameEvents,
  hasNamedTeamInQuery,
  isLikelyTeamGameEvent,
  resolveNamedSportsTeam
} from "@/lib/sportsEventFilter";

function event(title: string, category = "Baseball"): EventResult {
  return {
    id: title,
    title,
    category,
    venue: "Yankee Stadium",
    startTime: "2026-06-28T19:05:00",
    city: "Bronx",
    state: "NY",
    source: "ticketmaster"
  };
}

let failed = 0;

if (!hasNamedTeamInQuery("Yankees games near me")) {
  console.log("FAIL named team near me");
  failed += 1;
} else {
  console.log("PASS named team near me");
}

const yankees = resolveNamedSportsTeam("Yankees games near me");
if (!yankees || yankees.id !== "yankees") {
  console.log("FAIL resolve yankees");
  failed += 1;
} else {
  console.log("PASS resolve yankees");
}

const samples = [
  event("New York Yankees vs. Detroit Tigers"),
  event("New York Yankees v. Detroit Tigers * Premium Seating *"),
  event("Pinstripe Pass * New York Yankees v. Detroit Tigers"),
  event("Yankee Stadium Tour"),
  event("Central Park Summer Concert", "Music"),
  event("New York Giants vs. Dallas Cowboys", "Football")
];

const filtered = filterNamedTeamGameEvents(samples, "Yankees games near me");
if (filtered.length !== 1) {
  console.log(`FAIL filter count expected 1 got ${filtered.length}`);
  failed += 1;
} else {
  console.log("PASS filter keeps yankee games only");
}

if (isLikelyTeamGameEvent(event("Yankee Stadium Parking"), yankees!)) {
  console.log("FAIL excludes parking");
  failed += 1;
} else {
  console.log("PASS excludes parking");
}

if (failed > 0) process.exitCode = 1;
