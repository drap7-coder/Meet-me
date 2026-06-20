const BASE_URL = process.env.PARSE_SEARCH_URL || "http://localhost:3000";

const PLACE_EXAMPLES = [
  { query: "breweries between Brooklyn and Manhattan", expectedBotMode: "places", expectedCategory: "breweries" },
  { query: "Italian between Hoboken and Edison", expectedBotMode: "places", expectedCategory: "italian" },
  { query: "coffee near Hoboken", expectedBotMode: "places", expectedCategory: "coffee" },
  { query: "where should we meet between Hoboken and Edison", expectedBotMode: "places", expectedCategory: "restaurant" }
];

const WATCH_EVENTS_EXAMPLES = [
  { query: "What should I watch tonight?", expectedBotMode: "watch_events" },
  { query: "Any comedy shows near Philly this weekend?", expectedBotMode: "watch_events" },
  { query: "Where can I stream Interstellar?", expectedBotMode: "watch_events" },
  { query: "Where can I watch the Phillies game tonight?", expectedBotMode: "watch_events" }
];

async function runExample(example: { query: string; expectedBotMode: string; expectedCategory?: string }) {
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
    (example.expectedCategory ? category === example.expectedCategory : Boolean(json?.watchEvents?.message));

  console.log(`\n=== ${example.query} ===`);
  console.log(JSON.stringify(json, null, 2));
  console.log(
    ok
      ? "PASS"
      : `FAIL (expected botMode: ${example.expectedBotMode}${example.expectedCategory ? `, category: ${example.expectedCategory}` : ""}; got botMode: ${botMode ?? "error"}${example.expectedCategory ? `, category: ${category ?? "n/a"}` : ""})`
  );

  return ok;
}

async function run() {
  let failed = 0;

  for (const example of [...PLACE_EXAMPLES, ...WATCH_EVENTS_EXAMPLES]) {
    const ok = await runExample(example);
    if (!ok) failed += 1;
  }

  if (failed > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
