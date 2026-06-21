const BASE_URL = process.env.PARSE_SEARCH_URL || "http://localhost:3000";

const PLACE_EXAMPLES = [
  { query: "breweries between Brooklyn and Manhattan", expectedBotMode: "places", expectedCategory: "breweries" },
  { query: "Italian between Hoboken and Edison", expectedBotMode: "places", expectedCategory: "italian" },
  { query: "coffee near Hoboken", expectedBotMode: "places", expectedCategory: "coffee" },
  { query: "where should we meet between Hoboken and Edison", expectedBotMode: "places", expectedCategory: "restaurant" }
];

const WATCH_EXAMPLES = [
  { query: "What should I watch tonight?", expectedBotMode: "watch" },
  { query: "Where can I stream Interstellar?", expectedBotMode: "watch" },
  { query: "Funny movies like Superbad", expectedBotMode: "watch" },
  { query: "Netflix comedy", expectedBotMode: "watch" },
  { query: "Funny comedy shows on Netflix", expectedBotMode: "watch" }
];

const EVENTS_EXAMPLES = [
  { query: "Any comedy shows near Philly this weekend?", expectedBotMode: "events", expectedIntent: "live_event" },
  { query: "Where can I watch the Phillies game tonight?", expectedBotMode: "events", expectedIntent: "sports" },
  { query: "Street fairs near me this weekend", expectedBotMode: "events", expectedIntent: "things_to_do" },
  { query: "Farmers markets in Philadelphia today", expectedBotMode: "events", expectedIntent: "things_to_do" },
  { query: "Flea markets open this Saturday", expectedBotMode: "events", expectedIntent: "things_to_do" }
];

async function runParseExample(example: {
  query: string;
  expectedBotMode: string;
  expectedCategory?: string;
}) {
  const response = await fetch(`${BASE_URL}/api/parse-search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: example.query })
  });
  const json = await response.json();
  const botMode = json?.botMode;
  const category = json?.form?.category;
  const ok =
    response.ok &&
    botMode === example.expectedBotMode &&
    (example.expectedCategory ? category === example.expectedCategory : true);

  console.log(`\n=== parse-search: ${example.query} ===`);
  console.log(JSON.stringify(json, null, 2));
  console.log(
    ok
      ? "PASS"
      : `FAIL (expected botMode: ${example.expectedBotMode}${example.expectedCategory ? `, category: ${example.expectedCategory}` : ""}; got botMode: ${botMode ?? "error"}${example.expectedCategory ? `, category: ${category ?? "n/a"}` : ""})`
  );

  return ok;
}

async function runEventsExample(example: { query: string; expectedIntent: string }) {
  const response = await fetch(`${BASE_URL}/api/watch-events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: example.query })
  });
  const json = await response.json();
  const ok =
    response.ok &&
    json?.botMode === "events" &&
    json?.intent === example.expectedIntent &&
    Array.isArray(json?.recommendations) &&
    json.recommendations.length >= 3;

  console.log(`\n=== watch-events: ${example.query} ===`);
  console.log(JSON.stringify(json, null, 2));
  console.log(
    ok
      ? "PASS"
      : `FAIL (expected intent: ${example.expectedIntent}, recommendations >= 3; got intent: ${json?.intent ?? "error"}, count: ${json?.recommendations?.length ?? 0})`
  );

  return ok;
}

async function run() {
  let failed = 0;

  for (const example of PLACE_EXAMPLES) {
    const ok = await runParseExample(example);
    if (!ok) failed += 1;
  }

  for (const example of WATCH_EXAMPLES) {
    const ok = await runParseExample(example);
    if (!ok) failed += 1;
  }

  for (const example of EVENTS_EXAMPLES) {
    const parseOk = await runParseExample(example);
    const eventsOk = await runEventsExample(example);
    if (!parseOk || !eventsOk) failed += 1;
  }

  if (failed > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
