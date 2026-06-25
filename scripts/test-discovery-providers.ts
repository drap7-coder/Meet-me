import {
  categoriesToKinds,
  getOpenTripMapApiKey,
  openTripMapProvider,
  OPENTRIPMAP_CATEGORIES
} from "@/lib/providers/openTripMapProvider";
import { fetchWikipediaSummary, getPlaceSummary, searchWikipediaTitle } from "@/lib/providers/wikipediaProvider";
import { applyPlaceInsight, isPlaceCuriosityQuery } from "@/lib/placeInsight";
import type { ScoredVenue } from "@/lib/types";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function venue(name: string, address: string): ScoredVenue {
  return {
    id: name,
    name,
    category: "Park",
    address,
    location: { lat: 40, lng: -75 },
    rating: 4.6,
    reviewCount: 100,
    openNow: true,
    googleMapsUri: "https://maps.google.com",
    types: ["park"],
    travelFromA: { distanceMeters: 1000, durationMinutes: 5, status: "OK" },
    travelFromB: { distanceMeters: 1000, durationMinutes: 5, status: "OK" },
    timeDifferenceMinutes: 0,
    totalTravelMinutes: 10,
    fairnessScore: 1,
    preferenceScore: 0,
    preferenceMatches: []
  };
}

type FetchResponder = (url: string) => { ok?: boolean; status?: number; body: unknown };

function withMockedFetch(responder: FetchResponder, run: () => Promise<void>) {
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const result = responder(url);
    return {
      ok: result.ok ?? true,
      status: result.status ?? 200,
      async json() {
        return result.body;
      },
      async text() {
        return JSON.stringify(result.body);
      }
    } as Response;
  }) as typeof fetch;
  return run().finally(() => {
    globalThis.fetch = original;
  });
}

async function run() {
  // --- OpenTripMap: category mapping -------------------------------------
  assert(categoriesToKinds(["viewpoints"]) === "view_points", "viewpoints maps to view_points");
  assert(categoriesToKinds(["amusement"]) === "amusements", "amusement maps to amusements");
  assert(
    categoriesToKinds(["historic", "museums"]) === "historic,museums",
    "multiple categories join with commas"
  );
  assert(categoriesToKinds().split(",").length === OPENTRIPMAP_CATEGORIES.length, "default uses all categories");

  // --- OpenTripMap: gracefully skips without an API key ------------------
  delete process.env.OPENTRIPMAP_API_KEY;
  assert(getOpenTripMapApiKey() === undefined, "no key resolves to undefined");
  assert(openTripMapProvider.isConfigured() === false, "provider not configured without key");
  const noKeyResults = await openTripMapProvider.discoverNearby({ origin: { lat: 40, lng: -75 } });
  assert(noKeyResults.length === 0, "discoverNearby returns [] without a key");

  // --- OpenTripMap: normalizes radius response when key present ----------
  process.env.OPENTRIPMAP_API_KEY = "test-key";
  await withMockedFetch(
    () => ({
      body: [
        {
          xid: "N123",
          name: "Liberty Bell",
          dist: 412.7,
          rate: "3h",
          kinds: "historic,interesting_places",
          wikidata: "Q188384",
          point: { lon: -75.15, lat: 39.95 }
        },
        { name: "missing xid", point: { lon: -75, lat: 40 } }
      ]
    }),
    async () => {
      const places = await openTripMapProvider.discoverNearby({
        origin: { lat: 39.95, lng: -75.15 },
        categories: ["historic"]
      });
      assert(places.length === 1, "skips features missing an xid");
      const place = places[0];
      assert(place.name === "Liberty Bell", "name normalized");
      assert(place.category === "historic", "category derived from kinds");
      assert(place.distanceMeters === 413, "distance rounded to meters");
      assert(place.rating === 3, "rating parsed from '3h'");
      assert(place.sourceUrl === "https://www.wikidata.org/wiki/Q188384", "wikidata source url built");
    }
  );
  delete process.env.OPENTRIPMAP_API_KEY;

  // --- Wikipedia: works without a key, normalizes summary ----------------
  await withMockedFetch(
    (url) => {
      if (url.includes("/w/api.php")) {
        return { body: { query: { search: [{ title: "Wissahickon Valley Park" }] } } };
      }
      return {
        body: {
          type: "standard",
          title: "Wissahickon Valley Park",
          extract: "Wissahickon Valley Park is a park in Philadelphia.",
          description: "Park in Philadelphia",
          content_urls: { desktop: { page: "https://en.wikipedia.org/wiki/Wissahickon_Valley_Park" } },
          thumbnail: { source: "https://example.org/thumb.jpg" }
        }
      };
    },
    async () => {
      const title = await searchWikipediaTitle("Wissahickon Valley Park Philadelphia");
      assert(title === "Wissahickon Valley Park", "search resolves a title");

      const summary = await getPlaceSummary({ name: "Wissahickon Valley Park", locality: "Philadelphia, PA" });
      assert(summary !== null, "summary resolved");
      assert(summary?.extract.startsWith("Wissahickon Valley Park is") === true, "extract normalized");
      assert(summary?.url.includes("Wissahickon_Valley_Park") === true, "url present");
      assert(summary?.thumbnailUrl === "https://example.org/thumb.jpg", "thumbnail captured");
    }
  );

  // --- Wikipedia: disambiguation pages are rejected ----------------------
  await withMockedFetch(
    () => ({ body: { type: "disambiguation", title: "Mercury", extract: "Mercury may refer to..." } }),
    async () => {
      const summary = await fetchWikipediaSummary("Mercury");
      assert(summary === null, "disambiguation pages return null");
    }
  );

  // --- Wikipedia: missing article degrades to null -----------------------
  await withMockedFetch(
    () => ({ ok: false, status: 404, body: {} }),
    async () => {
      const summary = await fetchWikipediaSummary("Nonexistent Place 9000");
      assert(summary === null, "404 summary returns null");
    }
  );

  // --- Place insight: curiosity intent detection ------------------------
  assert(isPlaceCuriosityQuery("why is Valley Green Inn interesting") === true, "why...interesting matches");
  assert(isPlaceCuriosityQuery("tell me about Wissahickon") === true, "tell me about matches");
  assert(isPlaceCuriosityQuery("what makes this place special") === true, "what makes matches");
  assert(isPlaceCuriosityQuery("coffee near me") === false, "ordinary query does not match");
  assert(isPlaceCuriosityQuery("") === false, "empty query does not match");

  // --- Place insight: only enriches on curiosity intent -----------------
  const venues = [venue("Wissahickon Valley Park", "Forbidden Dr, Philadelphia, PA 19128")];

  let fetchCount = 0;
  await withMockedFetch(
    (url) => {
      fetchCount += 1;
      if (url.includes("/w/api.php")) {
        return { body: { query: { search: [{ title: "Wissahickon Valley Park" }] } } };
      }
      return {
        body: {
          type: "standard",
          title: "Wissahickon Valley Park",
          extract: "Wissahickon Valley Park is a 1,800-acre park in Philadelphia.",
          content_urls: { desktop: { page: "https://en.wikipedia.org/wiki/Wissahickon_Valley_Park" } }
        }
      };
    },
    async () => {
      const ordinary = await applyPlaceInsight(venues, { query: "park near me" });
      assert(ordinary === venues, "no enrichment without curiosity intent");
      assert(fetchCount === 0, "no network call without curiosity intent");

      const enriched = await applyPlaceInsight(venues, { query: "why is this park interesting" });
      assert(enriched !== venues, "returns a new array when enriched");
      assert(enriched[0].insight?.source === "wikipedia", "insight source is wikipedia");
      assert(
        enriched[0].insight?.blurb.startsWith("Wissahickon Valley Park is") === true,
        "insight blurb populated"
      );
    }
  );

  console.log("PASS Wikipedia + OpenTripMap discovery providers");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
