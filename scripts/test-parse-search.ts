const BASE_URL = process.env.PARSE_SEARCH_URL || "http://localhost:3000";

const EXAMPLES = [
  { query: "breweries between Brooklyn and Manhattan", expectedCategory: "breweries" },
  { query: "Italian between Hoboken and Edison", expectedCategory: "italian" },
  { query: "coffee near Hoboken", expectedCategory: "coffee" },
  { query: "where should we meet between Hoboken and Edison", expectedCategory: "restaurant" }
];

async function run() {
  let failed = 0;

  for (const example of EXAMPLES) {
    const response = await fetch(`${BASE_URL}/api/parse-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: example.query })
    });
    const json = await response.json();
    const category = json?.form?.category;
    const ok = response.ok && category === example.expectedCategory;

    console.log(`\n=== ${example.query} ===`);
    console.log(JSON.stringify(json, null, 2));
    console.log(ok ? "PASS" : `FAIL (expected category: ${example.expectedCategory}, got: ${category ?? "error"})`);

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
