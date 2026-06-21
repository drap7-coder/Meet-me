import { resolveKoiBotMode } from "@/lib/watchEvents";

const EXAMPLES = [
  { query: "coffee near Hoboken", expected: "places" },
  { query: "breweries between Brooklyn and Manhattan", expected: "places" },
  { query: "What should I watch tonight?", expected: "watch" },
  { query: "Funny movies like Superbad", expected: "watch" },
  { query: "Any comedy shows near Philly this weekend?", expected: "events" },
  { query: "Where can I watch the Phillies game tonight?", expected: "events" },
  { query: "Street fairs near me this weekend", expected: "events" }
];

function run() {
  let failed = 0;

  for (const example of EXAMPLES) {
    const botMode = resolveKoiBotMode(example.query);
    const ok = botMode === example.expected;
    console.log(`${ok ? "PASS" : "FAIL"}  ${example.query} -> ${botMode} (expected ${example.expected})`);
    if (!ok) failed += 1;
  }

  if (failed > 0) {
    process.exitCode = 1;
  }
}

run();
