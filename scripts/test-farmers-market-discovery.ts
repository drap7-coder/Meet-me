import type { EventResult } from "../lib/eventResult";
import {
  discoverFarmersMarketPick,
  filterFarmersMarketVenues,
  filterOpenTripMapFarmersMarkets,
  isFarmersMarketVenue,
  isFarmersMarketPlaceName
} from "../lib/farmersMarketDiscovery";
import { farmersMarketCardFromEvent, pickFarmersMarketEvent } from "../lib/eventbriteFarmersMarket";
import { EVENTBRITE_ORGANIZATION_SOURCES, hasEventbriteFoodMarketSources } from "../src/config/eventbriteSources";

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

const sampleEvent: EventResult = {
  id: "evt-1",
  source: "eventbrite",
  title: "Headhouse Farmers Market",
  category: "Food & Drink",
  venue: "Headhouse Square",
  city: "Philadelphia",
  state: "PA",
  startTime: "2026-06-28T10:00:00Z",
  distance: 2.1,
  ticketUrl: "https://eventbrite.com/e/headhouse",
  imageUrl: undefined,
  latitude: 39.94,
  longitude: -75.15
};

async function run() {
  // --- Name / filter helpers ------------------------------------------------
  assert(isFarmersMarketPlaceName("Rittenhouse Farmers Market"), "recognizes farmers market names");
  assert(!isFarmersMarketPlaceName("The Fresh Market"), "does not treat fresh market grocery chain as farmers market");
  assert(!isFarmersMarketPlaceName("Liberty Bell"), "rejects unrelated POI names");
  assert(
    isFarmersMarketVenue({ name: "Headhouse Farmers Market", category: "farmers_markets", types: ["point_of_interest"] }),
    "recognizes farmers market venues"
  );
  assert(
    !isFarmersMarketVenue({ name: "ACME Markets", category: "farmers_markets", types: ["grocery_store", "supermarket"] }),
    "rejects grocery stores returned by places fallback"
  );
  assert(
    !isFarmersMarketVenue({ name: "The Fresh Market", category: "farmers_markets", types: ["grocery_store"] }),
    "rejects fresh market grocery chain"
  );
  const filteredVenues = filterFarmersMarketVenues([
    { name: "ACME Markets", category: "farmers_markets", types: ["grocery_store"] },
    { name: "Rittenhouse Farmers Market", category: "farmers_markets", types: ["point_of_interest"] }
  ]);
  assert(filteredVenues.length === 1 && filteredVenues[0]?.name === "Rittenhouse Farmers Market", "filters grocery venues from farmers market results");

  const filtered = filterOpenTripMapFarmersMarkets([
    {
      xid: "a",
      name: "Liberty Bell",
      lat: 39.95,
      lng: -75.15,
      kinds: ["historic"],
      category: "historic",
      distanceMeters: 100,
      rating: 3
    },
    {
      xid: "b",
      name: "Headhouse Farmers Market",
      lat: 39.94,
      lng: -75.15,
      kinds: ["interesting_places"],
      category: "interesting_places",
      distanceMeters: 500,
      rating: 2
    }
  ]);
  assert(filtered[0]?.name === "Headhouse Farmers Market", "filters OTM results to market-like POIs");

  // --- Eventbrite enrichment helpers ----------------------------------------
  const eventPick = pickFarmersMarketEvent([sampleEvent]);
  assert(eventPick?.title === "Headhouse Farmers Market", "pickFarmersMarketEvent selects market event");
  const eventCard = farmersMarketCardFromEvent(sampleEvent);
  assert(eventCard.badge === "Farmers Market", "event card badge is provider-agnostic");
  assert(!eventCard.title.toLowerCase().includes("eventbrite"), "UI label stays Farmers Market not Eventbrite");

  // --- OpenTripMap primary without Eventbrite sources -----------------------
  assert(hasEventbriteFoodMarketSources() === false, "fixture starts with no food_market sources");

  process.env.OPENTRIPMAP_API_KEY = "test-key";
  delete process.env.Eventbrite_API_Key;
  delete process.env.EVENTBRITE_API_KEY;

  let eventbriteFetchCount = 0;

  await withMockedFetch(
    (url) => {
      if (url.includes("eventbriteapi.com")) {
        eventbriteFetchCount += 1;
        return { body: { events: [] } };
      }
      if (url.includes("opentripmap.com")) {
        return {
          body: [
            {
              xid: "M123",
              name: "Clark Park Farmers Market",
              dist: 800,
              rate: "2h",
              kinds: "interesting_places,foods",
              point: { lon: -75.21, lat: 39.95 }
            }
          ]
        };
      }
      return { ok: false, status: 404, body: {} };
    },
    async () => {
      const result = await discoverFarmersMarketPick(39.95, -75.15);
      assert(result.card !== null, "card appears when OpenTripMap has market results");
      assert(result.card?.kind === "farmers_market", "card kind is farmers_market");
      assert(result.card?.badge === "Farmers Market", "badge is provider-agnostic");
      assert(result.card?.id.startsWith("farmers-otm-") === true, "primary source is OpenTripMap");
      assert(result.eventbriteFetchAttempted === false, "Eventbrite not attempted without food_market sources");
      assert(eventbriteFetchCount === 0, "no Eventbrite API calls without food_market sources");
    }
  );

  // --- Eventbrite enrichment when authorized food_market sources exist --------
  const sourceBackup = EVENTBRITE_ORGANIZATION_SOURCES.slice();
  EVENTBRITE_ORGANIZATION_SOURCES.push({
    id: "99999",
    label: "Test Market Org",
    category: "food_markets"
  });
  process.env.Eventbrite_API_Key = "test-token";

  eventbriteFetchCount = 0;

  await withMockedFetch(
    (url) => {
      if (url.includes("eventbriteapi.com")) {
        eventbriteFetchCount += 1;
        if (url.includes("/users/me")) {
          return { body: { name: "Test User" } };
        }
        if (url.includes("/organizations/99999/events")) {
          return {
            body: {
              events: [
                {
                  id: "evt-1",
                  status: "live",
                  name: { text: "Headhouse Farmers Market" },
                  start: { utc: "2026-06-28T10:00:00Z" },
                  url: "https://eventbrite.com/e/headhouse",
                  venue: {
                    name: "Headhouse Square",
                    latitude: "39.94",
                    longitude: "-75.15",
                    address: { city: "Philadelphia", region: "PA" }
                  }
                }
              ]
            }
          };
        }
        return { body: { events: [] } };
      }
      if (url.includes("opentripmap.com")) {
        return { body: [] };
      }
      return { ok: false, status: 404, body: {} };
    },
    async () => {
      assert(hasEventbriteFoodMarketSources() === true, "test food_market source registered");

      const result = await discoverFarmersMarketPick(39.95, -75.15);
      assert(result.eventbriteFetchAttempted === true, "Eventbrite fetch attempted when sources configured");
      assert(eventbriteFetchCount > 0, "Eventbrite API called when food_market sources exist");
      assert(result.card !== null, "card still appears via Eventbrite enrichment when OTM empty");
      assert(result.card?.id.startsWith("farmers-eventbrite-") === true, "enrichment uses Eventbrite event when OTM empty");
    }
  );

  EVENTBRITE_ORGANIZATION_SOURCES.length = 0;
  EVENTBRITE_ORGANIZATION_SOURCES.push(...sourceBackup);
  delete process.env.OPENTRIPMAP_API_KEY;
  delete process.env.Eventbrite_API_Key;

  console.log("PASS farmers market discovery");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
