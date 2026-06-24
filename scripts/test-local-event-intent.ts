import { shouldFetchTicketmasterEvents, classifyLocalEventProfile } from "@/lib/localEventIntent";
import { detectEventsIntent } from "@/lib/watchEvents";

const SHOULD_TRIGGER = [
  { query: "things to do this weekend", profile: "weekend" },
  { query: "concerts near me", profile: "general" },
  { query: "comedy shows tonight", profile: "tonight" },
  { query: "date night", profile: "date_night" }
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

  if (failed > 0) process.exitCode = 1;
}

run();
