import { buildTopPick } from "@/lib/topPick";
import type { EventResult, LocalEventProfile, ScoredVenue, SearchHalfwayResponse, VenueCategory } from "@/lib/types";

function venue(overrides: Partial<ScoredVenue> = {}): ScoredVenue {
  return {
    id: "v1",
    name: "Blue Bell Inn",
    category: "American",
    address: "601 Skippack Pike, Blue Bell, PA",
    location: { lat: 40.15, lng: -75.27 },
    rating: 4.6,
    reviewCount: 900,
    priceLevel: "PRICE_LEVEL_EXPENSIVE",
    openNow: true,
    googleMapsUri: "https://maps.google.com/?q=bluebellinn",
    websiteUri: "https://bluebellinn.example",
    types: ["restaurant"],
    travelFromA: { distanceMeters: 3000, durationMinutes: 9, status: "OK" },
    travelFromB: { distanceMeters: null, durationMinutes: null, status: "OK" },
    timeDifferenceMinutes: null,
    totalTravelMinutes: 9,
    fairnessScore: 1,
    preferenceScore: 0,
    preferenceMatches: [],
    ...overrides
  } as ScoredVenue;
}

function event(overrides: Partial<EventResult> = {}): EventResult {
  const tonight = new Date();
  tonight.setHours(20, 5, 0, 0);
  return {
    id: "e1",
    title: "Sebastian Maniscalco",
    category: "Comedy",
    venue: "Helium Comedy Club",
    startTime: tonight.toISOString(),
    city: "Philadelphia",
    state: "PA",
    distance: 3,
    latitude: 40.16,
    longitude: -75.28,
    ticketUrl: "https://tickets.example/helium",
    imageUrl: "https://img.example/helium.jpg",
    source: "ticketmaster",
    ...overrides
  } as EventResult;
}

function response(overrides: Partial<SearchHalfwayResponse> = {}): SearchHalfwayResponse {
  return {
    searchMode: "single",
    category: "restaurant" as VenueCategory,
    venues: [],
    query: "test",
    ...overrides
  } as unknown as SearchHalfwayResponse;
}

let failed = 0;
function check(name: string, ok: boolean, detail?: string) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : detail ? `  -> ${detail}` : ""}`);
  if (!ok) failed += 1;
}

// --- Profile-aware copy, no "people love it" ---
const dateNight = buildTopPick(
  response({ eventProfile: "date_night" as LocalEventProfile, venues: [venue()] })
);
check("date night eyebrow", dateNight?.eyebrow === "Best bet", dateNight?.eyebrow);
check("date night lead phrasing", Boolean(dateNight && /date-night/i.test(dateNight.summary)), dateNight?.summary);
check("never uses 'people love it'", Boolean(dateNight && !/people love it/i.test(dateNight.summary)));

const halfway = buildTopPick(
  response({ searchMode: "midpoint", venues: [venue({ timeDifferenceMinutes: 3 })] })
);
check("halfway eyebrow", halfway?.eyebrow === "Good halfway pick", halfway?.eyebrow);
check(
  "halfway leads with fairness + signals",
  Boolean(halfway && /similar drive for both of you/i.test(halfway.summary) && /highly rated/.test(halfway.summary)),
  halfway?.summary
);

// --- Sports event copy ---
const sat = new Date();
sat.setDate(sat.getDate() + ((6 - sat.getDay() + 7) % 7 || 7));
sat.setHours(19, 5, 0, 0);
const sports = buildTopPick(
  response({
    eventProfile: "sports" as LocalEventProfile,
    events: [event({ title: "Phillies vs. Braves", category: "Sports", venue: "Citizens Bank Park", startTime: sat.toISOString() })]
  })
);
check("sports eyebrow", sports?.eyebrow === "Koi's pick", sports?.eyebrow);
check("sports summary has time + venue", Boolean(sports && /at 7:05/i.test(sports.summary) && /Citizens Bank Park/.test(sports.summary)), sports?.summary);

// --- Thin data: hedge, don't overclaim ---
const thin = buildTopPick(
  response({ venues: [venue({ rating: null, reviewCount: 0, openNow: null, priceLevel: undefined, travelFromA: { distanceMeters: null, durationMinutes: null, status: "ZERO_RESULTS" } })] })
);
check("thin data hedges", thin?.summary === "Worth a look.", thin?.summary);
check("thin data has no fake signals", Boolean(thin && !/highly rated|open now|drive/i.test(thin.summary)));

// --- Closed place: stay honest ---
const closed = buildTopPick(response({ venues: [venue({ openNow: false })] }));
check("closed place flagged", Boolean(closed && /closed right now/i.test(closed.summary)), closed?.summary);
check("closed place not called open", Boolean(closed && !/open now/i.test(closed.summary)));
check("closed place hedges lead", Boolean(closed && !/strong|solid/i.test(closed.summary)), closed?.summary);

// --- Event without ticket URL ---
const noTix = buildTopPick(response({ eventProfile: "sports" as LocalEventProfile, events: [event({ ticketUrl: undefined })] }));
check("event without tickets -> Maps", noTix?.primary.label === "Open in Maps", noTix?.primary.label);

// --- Blended pairing SHOWN (same evening, close, open) ---
const shown = buildTopPick(
  response({ eventProfile: "date_night" as LocalEventProfile, venues: [venue()], events: [event()] })
);
check("pairing shown -> night_out", shown?.kind === "night_out", shown?.kind);
check("pairing pairs dinner + comedy", Boolean(shown && /Blue Bell Inn/.test(shown.summary) && /comedy/i.test(shown.summary)), shown?.summary);

// --- Blended pairing SUPPRESSED (event not same day) ---
const nextWeek = new Date();
nextWeek.setDate(nextWeek.getDate() + 5);
nextWeek.setHours(20, 0, 0, 0);
const suppressedDay = buildTopPick(
  response({ eventProfile: "date_night" as LocalEventProfile, venues: [venue()], events: [event({ startTime: nextWeek.toISOString() })] })
);
check("pairing suppressed when not same day", suppressedDay?.kind === "place", suppressedDay?.kind);

// --- Blended pairing SUPPRESSED (too far apart) ---
const suppressedFar = buildTopPick(
  response({ eventProfile: "date_night" as LocalEventProfile, venues: [venue()], events: [event({ latitude: 41.5, longitude: -74.0 })] })
);
check("pairing suppressed when too far", suppressedFar?.kind === "place", suppressedFar?.kind);

// --- Blended pairing SUPPRESSED (place hours unknown) ---
const suppressedClosed = buildTopPick(
  response({ eventProfile: "date_night" as LocalEventProfile, venues: [venue({ openNow: null })], events: [event()] })
);
check("pairing suppressed when hours unknown", suppressedClosed?.kind === "place", suppressedClosed?.kind);

// --- Event-primary suppressed falls back to event, not place ---
const suppressedSports = buildTopPick(
  response({ eventProfile: "sports" as LocalEventProfile, venues: [venue()], events: [event({ startTime: nextWeek.toISOString() })] })
);
check("event-primary suppressed -> event pick", suppressedSports?.kind === "event", suppressedSports?.kind);

// --- Empty ---
check("empty -> null", buildTopPick(response({ venues: [], events: [] })) === null);

console.log(failed === 0 ? "\nAll top-pick tests passed." : `\n${failed} test(s) failed.`);
if (failed > 0) process.exit(1);
