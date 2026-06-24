import { shouldFetchTicketmasterEvents, classifyLocalEventProfile, isSportsEventQuery, isTeamSpecificSportsQuery, hasNamedTeamInQuery } from "@/lib/localEventIntent";
import { detectEventsIntent } from "@/lib/watchEvents";

const SHOULD_TRIGGER = [
  { query: "things to do this weekend", profile: "weekend" },
  { query: "concerts near me", profile: "general" },
  { query: "comedy shows tonight", profile: "tonight" },
  { query: "date night", profile: "date_night" },
  { query: "Phillies game tonight", profile: "sports" },
  { query: "live sports near me", profile: "sports" },
  { query: "NBA games this weekend", profile: "sports" }
] as const;

const SHOULD_NOT_TRIGGER = ["coffee near me", "sushi near me", "pizza near me"];

function run() {
  let failed = 0;

  for (const { query, profile } of SHOULD_TRIGGER) {
    const eventsIntent = detectEventsIntent(query);
    const shouldFetch = shouldFetchTicketmasterEvents(query);
    const classified = classifyLocalEventProfile(query);
    const ok = eventsIntent && shouldFetch && classified === profile;
    console.log(`${ok ? "PASS" : "FAIL"}  trigger  ${query} -> profile=${classified} (expected ${profile})`);
    if (!ok) failed += 1;
  }

  for (const query of SHOULD_NOT_TRIGGER) {
    const shouldFetch = shouldFetchTicketmasterEvents(query);
    const ok = !shouldFetch && !detectEventsIntent(query);
    console.log(`${ok ? "PASS" : "FAIL"}  skip     ${query} -> shouldFetch=${shouldFetch}`);
    if (!ok) failed += 1;
  }

  const sportsOnly = isSportsEventQuery("Yankees tickets near me") && !isSportsEventQuery("comedy shows tonight");
  console.log(`${sportsOnly ? "PASS" : "FAIL"}  sports   detects team queries without catching comedy`);
  if (!sportsOnly) failed += 1;

  const teamNationwide =
    isTeamSpecificSportsQuery("Yankees game this weekend") &&
    hasNamedTeamInQuery("Yankees games near me") &&
    !isTeamSpecificSportsQuery("Yankees games near me") &&
    isTeamSpecificSportsQuery("Phillies game tonight") &&
    !isTeamSpecificSportsQuery("live sports near me") &&
    !isTeamSpecificSportsQuery("NBA games this weekend");
  console.log(`${teamNationwide ? "PASS" : "FAIL"}  team     nationwide team intent only for named teams`);
  if (!teamNationwide) failed += 1;

  if (failed > 0) process.exitCode = 1;
}

run();
