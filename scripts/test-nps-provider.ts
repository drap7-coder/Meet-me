import { discoverNationalParkExploreVenues } from "../lib/npsExplore";
import {
  activityRefinement,
  exploreRefinementsWithNps,
  haversineMeters,
  npsActivityIdFromSubcategory,
  stateCodeFromAddress
} from "../lib/npsExploreCatalog";
import { normalizeExploreIntent } from "../lib/exploreRouting";
import { getNpsApiKey, npsProvider, clearNpsProviderCacheForTests } from "../lib/providers/npsProvider";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
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

const philly = { lat: 39.9526, lng: -75.1652 };

async function run() {
  delete process.env.NPS_API_KEY;
  assert(getNpsApiKey() === undefined, "no key resolves to undefined");
  assert(npsProvider.isConfigured() === false, "provider not configured without key");
  assert((await npsProvider.listActivities()).length === 0, "activities returns [] without key");

  assert(stateCodeFromAddress("123 Market St, Philadelphia, PA 19107") === "PA", "parses PA state code");
  assert(
    haversineMeters(philly, { lat: 39.97, lng: -75.15 }) > 0,
    "haversine distance is positive"
  );

  process.env.NPS_API_KEY = "test-key";
  clearNpsProviderCacheForTests();

  await withMockedFetch((url) => {
    const path = new URL(url).pathname;
    if (path.endsWith("/activities/parks")) {
      return {
        body: {
          data: [
            {
              parkCode: "indep",
              fullName: "Independence National Historical Park",
              description: "Birthplace of American democracy.",
              states: "PA",
              latitude: "39.9494",
              longitude: "-75.1503",
              url: "https://www.nps.gov/indep/"
            }
          ]
        }
      };
    }
    if (path.endsWith("/activities")) {
      return {
        body: {
          data: [
            { id: "Hiking", name: "Hiking" },
            { id: "Camping", name: "Camping" }
          ]
        }
      };
    }
    if (path.endsWith("/amenities/parksplaces")) {
      return {
        body: {
          data: [
            {
              id: "place-1",
              title: "Valley Forge Picnic Area",
              parkCode: "vafo",
              latitude: "40.0961",
              longitude: "-75.4377",
              listingDescription: "Shaded picnic tables near the trail network."
            }
          ]
        }
      };
    }
    if (path.endsWith("/amenities")) {
      return {
        body: {
          data: [{ id: "Picnic Area", name: "Picnic Area" }]
        }
      };
    }
    if (path.endsWith("/alerts")) {
      return {
        body: {
          data: [
            {
              id: "alert-1",
              title: "Trail closure",
              description: "North loop closed for maintenance.",
              category: "Closure",
              parkCode: "indep",
              url: "https://www.nps.gov/indep/planyourvisit/conditions.htm"
            }
          ]
        }
      };
    }
    if (path.endsWith("/parks")) {
      return {
        body: {
          data: [
            {
              parkCode: "indep",
              fullName: "Independence National Historical Park",
              description: "Historic district in Philadelphia.",
              states: "PA",
              latitude: "39.9494",
              longitude: "-75.1503",
              url: "https://www.nps.gov/indep/"
            }
          ]
        }
      };
    }
    return { body: { data: [] } };
  }, async () => {
    const activities = await npsProvider.listActivities();
    assert(activities.some((item) => item.name === "Hiking"), "loads activities catalog");

    const refinements = await exploreRefinementsWithNps("outdoors");
    assert(refinements.some((item) => item.id.startsWith("nps_act_")), "adds dynamic outdoor activity chips");

    const hikingRefinement = activityRefinement({ id: "Hiking", name: "Hiking" });
    assert(npsActivityIdFromSubcategory(hikingRefinement.id) === "Hiking", "extracts activity id from chip");

    const intent = normalizeExploreIntent({
      query: "hiking near me",
      category: "outdoors",
      subcategoryId: hikingRefinement.id,
      structured: true
    });
    assert(intent.providers.includes("national_parks"), "outdoors routing includes national parks provider");

    const hikingResults = await discoverNationalParkExploreVenues(intent, philly, "auto", {
      stateCode: "PA",
      limit: 5
    });
    assert(hikingResults.length > 0, "activity parks produce nearby outdoor venues");
    assert(hikingResults[0]?.id.startsWith("nps:"), "venues use nps ids");
    assert(Boolean(hikingResults[0]?.notices?.length), "alerts enrich venues with notices");
    assert(hikingResults[0]?.notices?.[0]?.severity === "closure", "closure alerts map to closure severity");
  });

  console.log("PASS nps provider");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
