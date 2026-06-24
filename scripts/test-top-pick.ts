import { buildTopPick } from "@/lib/topPick";
import type { EventResult, ScoredVenue, SearchHalfwayResponse } from "@/lib/types";

function venue(overrides: Partial<ScoredVenue> = {}): ScoredVenue {
  return {
    id: "v1",
    name: "Lilia",
    category: "Italian",
    address: "567 Union Ave, Brooklyn, NY",
    location: { lat: 40.7, lng: -73.9 },
    rating: 4.6,
    reviewCount: 1200,
    priceLevel: "PRICE_LEVEL_EXPENSIVE",
    openNow: true,
    googleMapsUri: "https://maps.google.com/?q=lilia",
    websiteUri: "https://lilia.example",
    types: ["restaurant"],
    travelFromA: { distanceMeters: 4000, durationMinutes: 12, status: "OK" },
    travelFromB: { distanceMeters: null, durationMinutes: null, status: "OK" },
    timeDifferenceMinutes: null,
    totalTravelMinutes: 12,
    fairnessScore: 1,
    preferenceScore: 0,
    preferenceMatches: [],
    ...overrides
  } as ScoredVenue;
}

function event(overrides: Partial<EventResult> = {}): EventResult {
  return {
    id: "e1",
    title: "New York Yankees vs Boston Red Sox",
    category: "Sports",
    venue: "Yankee Stadium",
    startTime: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
    city: "Bronx",
    state: "NY",
    distance: 6,
    ticketUrl: "https://tickets.example/yankees",
    imageUrl: "https://img.example/yankees.jpg",
    source: "ticketmaster",
    ...overrides
  } as EventResult;
}

function response(overrides: Partial<SearchHalfwayResponse> = {}): SearchHalfwayResponse {
  return {
    searchMode: "single",
    venues: [],
    query: "test",
    ...overrides
  } as unknown as SearchHalfwayResponse;
}

let failed = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) failed += 1;
}

// Place-only
const place = buildTopPick(response({ venues: [venue()] }));
check("place: kind", place?.kind === "place");
check("place: headline", place?.headline === "Lilia");
check("place: primary directions", place?.primary.label === "Get directions");
check("place: chips have travel/open/rating/price", Boolean(
  place && place.chips.includes("12 min away") && place.chips.includes("Open now") &&
  place.chips.some((c) => c.includes("4.6 ★")) && place.chips.includes("$$$")
));
check("place: confident summary", Boolean(place && /love it/i.test(place.summary)));

// Event-only
const ev = buildTopPick(response({ venues: [], events: [event()] }));
check("event: kind", ev?.kind === "event");
check("event: primary tickets", ev?.primary.label === "Get tickets");
check("event: chip distance", Boolean(ev && ev.chips.some((c) => c.includes("6 mi away"))));

// Event without tickets falls back to maps
const evNoTix = buildTopPick(response({ venues: [], events: [event({ ticketUrl: undefined })] }));
check("event: maps fallback when no tickets", evNoTix?.primary.label === "Open in Maps");

// Blended -> night out
const night = buildTopPick(response({ venues: [venue()], events: [event()] }));
check("blended: kind night_out", night?.kind === "night_out");
check("blended: pairs venue + event", Boolean(night && /Lilia/.test(night.summary) && /Yankees/.test(night.summary)));
check("blended: secondary then-tickets", Boolean(night?.secondary?.label.startsWith("Then:")));

// Empty
check("empty: null", buildTopPick(response({ venues: [], events: [] })) === null);

// Midpoint fair-trip phrasing
const fair = buildTopPick(response({
  searchMode: "midpoint",
  venues: [venue({ timeDifferenceMinutes: 4, openNow: null, rating: null, priceLevel: undefined })]
}));
check("midpoint: fair-for-both chip", Boolean(fair && fair.chips.includes("Fair for both")));

console.log(failed === 0 ? "\nAll top-pick tests passed." : `\n${failed} test(s) failed.`);
if (failed > 0) process.exit(1);
