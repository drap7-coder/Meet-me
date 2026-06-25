import { shouldFetchTicketmasterEvents, classifyLocalEventProfile, isMusicEventQuery, isSportsEventQuery, isTeamSpecificSportsQuery, hasNamedTeamInQuery, isPureEventQuery, eventTimeWindow, queryRequiresEventLocation } from "@/lib/localEventIntent";
import { detectEventsIntent } from "@/lib/watchEvents";

const SHOULD_TRIGGER = [
  { query: "things to do this weekend", profile: "weekend" },
  { query: "concerts near me", profile: "music" },
  { query: "live music near me", profile: "music" },
  { query: "jazz near me", profile: "music" },
  { query: "comedy shows tonight", profile: "tonight" },
  { query: "Phillies game tonight", profile: "sports" },
  { query: "live sports near me", profile: "sports" },
  { query: "NBA games this weekend", profile: "sports" }
] as const;

const SHOULD_NOT_TRIGGER = [
  "coffee near me",
  "sushi near me",
  "pizza near me",
  "farmers market near me",
  "Farmers markets in Philadelphia today",
  "flea markets open this Saturday",
  "street fairs near me this weekend"
];

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
    const ok = !shouldFetch;
    console.log(`${ok ? "PASS" : "FAIL"}  skip     ${query} -> shouldFetch=${shouldFetch}`);
    if (!ok) failed += 1;
  }

  const farmersStillEventsIntent = detectEventsIntent("farmers market near me");
  console.log(
    `${farmersStillEventsIntent ? "PASS" : "FAIL"}  farmers  parser can still classify happenings as events`
  );
  if (!farmersStillEventsIntent) failed += 1;

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

  const pureEvents = [
    "baseball game this weekend",
    "concerts near me",
    "jazz near me",
    "comedy shows tonight",
    "Phillies tickets Saturday"
  ];
  const blendedEvents = ["date night Friday", "festivals this weekend", "things to do this weekend", "fun saturday", "family activities"];

  const pureOk =
    pureEvents.every((query) => isPureEventQuery(query)) &&
    blendedEvents.every((query) => !isPureEventQuery(query));
  console.log(`${pureOk ? "PASS" : "FAIL"}  pure     event-first queries vs blended discovery`);
  if (!pureOk) failed += 1;

  const singularOk =
    detectEventsIntent("Yankee game") &&
    isSportsEventQuery("Yankee game") &&
    hasNamedTeamInQuery("Yankee game") &&
    isTeamSpecificSportsQuery("Yankee game") &&
    // Singular team words without sports context must NOT be treated as sports.
    !isSportsEventQuery("yankee candle store near me") &&
    !hasNamedTeamInQuery("yankee candle store near me") &&
    !detectEventsIntent("met a friend for coffee");
  console.log(`${singularOk ? "PASS" : "FAIL"}  singular singular team + context matches, ambiguous words don't`);
  if (!singularOk) failed += 1;

  const dayMs = 24 * 60 * 60 * 1000;
  const spanDays = (q: string) => {
    const win = eventTimeWindow(classifyLocalEventProfile(q), q);
    return (win.end.getTime() - win.start.getTime()) / dayMs;
  };
  const windowOk =
    spanDays("Yankees games") > 300 && // unqualified team -> next games (wide window)
    spanDays("Red Bulls games near me") > 300 &&
    spanDays("Phillies game tonight") < 2 && // explicit tonight stays tight
    spanDays("NBA games this weekend") <= 3 && // explicit weekend stays tight
    spanDays("concerts near me") > 300 && // unqualified music -> wide window
    spanDays("concerts tonight near me") < 2; // explicit tonight stays tight
  console.log(`${windowOk ? "PASS" : "FAIL"}  window   sports/music windows: wide by default, tight when explicit`);
  if (!windowOk) failed += 1;

  const musicOk =
    isMusicEventQuery("concerts near me") &&
    isMusicEventQuery("live music this weekend") &&
    !isMusicEventQuery("comedy shows tonight");
  console.log(`${musicOk ? "PASS" : "FAIL"}  music    detects concert/live music without catching comedy`);
  if (!musicOk) failed += 1;

  const locationGateOk =
    queryRequiresEventLocation("comedy shows tonight") &&
    queryRequiresEventLocation("concerts near me") &&
    queryRequiresEventLocation("events near me") &&
    !queryRequiresEventLocation("Yankees games") &&
    !queryRequiresEventLocation("coffee near me");
  console.log(`${locationGateOk ? "PASS" : "FAIL"}  location event queries require location except nationwide teams`);
  if (!locationGateOk) failed += 1;

  if (failed > 0) process.exitCode = 1;
}

run();
