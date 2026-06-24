import { eventCta, eventDistanceChip, venueSignalChips } from "@/lib/resultSignals";
import type { EventResult, ScoredVenue } from "@/lib/types";

function venue(overrides: Partial<ScoredVenue> = {}): ScoredVenue {
  return {
    id: "v1",
    name: "Lilia",
    category: "Italian",
    address: "567 Union Ave",
    location: { lat: 40.7, lng: -73.9 },
    rating: 4.6,
    reviewCount: 1200,
    priceLevel: "PRICE_LEVEL_EXPENSIVE",
    openNow: true,
    googleMapsUri: "https://maps.example",
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
    title: "Phillies vs. Braves",
    category: "Sports",
    venue: "Citizens Bank Park",
    startTime: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
    city: "Philadelphia",
    state: "PA",
    distance: 4,
    ticketUrl: "https://tickets.example/phillies",
    imageUrl: "https://img.example/phillies.jpg",
    source: "ticketmaster",
    ...overrides
  } as EventResult;
}

let failed = 0;
function check(name: string, ok: boolean, detail?: string) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : detail ? `  -> ${detail}` : ""}`);
  if (!ok) failed += 1;
}

function eq(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// --- Strong restaurant data: all four chips, in order ---
const strong = venueSignalChips(venue(), "single");
check("strong restaurant: full chip set", eq(strong, ["12 min away", "Open now", "4.6 ★ (1.2k)", "$$$"]), JSON.stringify(strong));

// --- Thin restaurant data: hide everything missing ---
const thin = venueSignalChips(
  venue({
    rating: null,
    reviewCount: 0,
    openNow: null,
    priceLevel: undefined,
    travelFromA: { distanceMeters: null, durationMinutes: null, status: "ZERO_RESULTS" }
  }),
  "single"
);
check("thin restaurant: no chips invented", eq(thin, []), JSON.stringify(thin));

// --- Thin-ish: only rating known ---
const ratingOnly = venueSignalChips(
  venue({ openNow: null, priceLevel: undefined, travelFromA: { distanceMeters: null, durationMinutes: null, status: "OK" }, rating: 4.1, reviewCount: 8 }),
  "single"
);
check("partial data: only known chips show", eq(ratingOnly, ["4.1 ★ (8)"]), JSON.stringify(ratingOnly));

// --- Closed place: shows Closed, never Open now ---
const closed = venueSignalChips(venue({ openNow: false }), "single");
check("closed place: has Closed", closed.includes("Closed"), JSON.stringify(closed));
check("closed place: not Open now", !closed.includes("Open now"));

// --- Midpoint fairness chip ---
const fair = venueSignalChips(venue({ timeDifferenceMinutes: 4 }), "midpoint");
check("midpoint: fair-for-both chip", fair[0] === "Fair for both", JSON.stringify(fair));

// --- Event with image + tickets ---
const withTix = event();
check("event w/ tickets: ticket CTA", eq(eventCta(withTix), { label: "Get tickets", href: withTix.ticketUrl, kind: "tickets" }));
check("event: distance chip", eventDistanceChip(withTix) === "4 mi away", String(eventDistanceChip(withTix)));
check("event: under-a-mile chip", eventDistanceChip(event({ distance: 0.4 })) === "Under 1 mi");
check("event: no distance -> no chip", eventDistanceChip(event({ distance: undefined })) === null);

// --- Event without image + without tickets: fallback directions CTA ---
const noTix = event({ ticketUrl: undefined, imageUrl: undefined });
const fallback = eventCta(noTix);
check("event w/o tickets: directions CTA", fallback?.kind === "directions" && fallback.label === "Get directions", JSON.stringify(fallback));
check("event w/o tickets: directions points at venue", Boolean(fallback && fallback.href.includes("Citizens")), fallback?.href);

// --- Event with neither tickets nor any location: no CTA ---
const noCta = eventCta(event({ ticketUrl: undefined, venue: "", city: "", state: "" }));
check("event w/o tickets or location: no CTA", noCta === null);

console.log(failed === 0 ? "\nAll result-signals tests passed." : `\n${failed} test(s) failed.`);
if (failed > 0) process.exit(1);
