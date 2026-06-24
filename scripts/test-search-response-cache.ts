import { buildKoiSearchCacheKey, withSearchResponseCache } from "@/lib/searchResponseCache";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  let failed = 0;
  const check = (name: string, ok: boolean) => {
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
    if (!ok) failed += 1;
  };

  // --- key building ---
  const base = { query: "Yankees game", form: { locationACoordinates: { lat: 40.8296, lng: -73.9262 } } };
  const sameDiffCase = { query: "  yankees   GAME ", form: { locationACoordinates: { lat: 40.8296, lng: -73.9262 } } };
  check("key normalizes whitespace/case", buildKoiSearchCacheKey(base) === buildKoiSearchCacheKey(sameDiffCase));

  const diffQuery = { ...base, query: "Mets game" };
  check("key differs by query", buildKoiSearchCacheKey(base) !== buildKoiSearchCacheKey(diffQuery));

  const diffLoc = { query: "Yankees game", form: { locationACoordinates: { lat: 34.05, lng: -118.24 } } };
  check("key differs by location", buildKoiSearchCacheKey(base) !== buildKoiSearchCacheKey(diffLoc));

  // --- miss -> fresh ---
  let calls = 0;
  const loader = async () => {
    calls += 1;
    return { kind: "places", n: calls } as { kind: string; n: number };
  };
  const key1 = `test:fresh:${Date.now()}`;
  const first = await withSearchResponseCache({ key: key1, freshTtlSeconds: 60, staleTtlSeconds: 600, loader });
  const second = await withSearchResponseCache({ key: key1, freshTtlSeconds: 60, staleTtlSeconds: 600, loader });
  check("first call is a miss", first.state === "miss");
  check("second call is a fresh hit (no reload)", second.state === "fresh" && calls === 1 && second.value.n === 1);

  // --- concurrent misses share one load ---
  let concurrentCalls = 0;
  const slowLoader = async () => {
    concurrentCalls += 1;
    await wait(20);
    return { kind: "events", n: concurrentCalls } as { kind: string; n: number };
  };
  const key2 = `test:concurrent:${Date.now()}`;
  const [a, b] = await Promise.all([
    withSearchResponseCache({ key: key2, freshTtlSeconds: 60, staleTtlSeconds: 600, loader: slowLoader }),
    withSearchResponseCache({ key: key2, freshTtlSeconds: 60, staleTtlSeconds: 600, loader: slowLoader })
  ]);
  check("racing prefetch+submit triggers a single provider load", concurrentCalls === 1 && a.value.n === 1 && b.value.n === 1);

  // --- stale serves immediately and revalidates in background ---
  let staleCalls = 0;
  const staleLoader = async () => {
    staleCalls += 1;
    return { kind: "places", n: staleCalls } as { kind: string; n: number };
  };
  const key3 = `test:stale:${Date.now()}`;
  await withSearchResponseCache({ key: key3, freshTtlSeconds: 0, staleTtlSeconds: 600, loader: staleLoader }); // miss, freshUntil=now
  await wait(2);
  const staleHit = await withSearchResponseCache({ key: key3, freshTtlSeconds: 0, staleTtlSeconds: 600, loader: staleLoader });
  check("expired entry serves stale instantly", staleHit.state === "stale" && staleHit.value.n === 1);
  await wait(30); // let background revalidation run
  check("stale entry revalidated in background", staleCalls === 2);

  // --- shouldCache gate ---
  let gatedCalls = 0;
  const gatedLoader = async () => {
    gatedCalls += 1;
    return { kind: "needs_location" } as { kind: string };
  };
  const key4 = `test:gated:${Date.now()}`;
  await withSearchResponseCache({
    key: key4,
    freshTtlSeconds: 60,
    staleTtlSeconds: 600,
    loader: gatedLoader,
    shouldCache: (value) => value.kind !== "needs_location"
  });
  const gatedSecond = await withSearchResponseCache({
    key: key4,
    freshTtlSeconds: 60,
    staleTtlSeconds: 600,
    loader: gatedLoader,
    shouldCache: (value) => value.kind !== "needs_location"
  });
  check("non-cacheable results are never stored", gatedSecond.state === "miss" && gatedCalls === 2);

  console.log(failed === 0 ? "\nAll search-response-cache tests passed." : `\n${failed} test(s) failed.`);
  if (failed > 0) process.exit(1);
}

void run();
