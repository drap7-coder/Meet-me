import {
  formatEventDistanceChip,
  withEventStraightLineDistance
} from "@/lib/eventDistance";
import { eventCta, eventDistanceChip } from "@/lib/resultSignals";
import type { EventResult } from "@/lib/eventResult";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function event(overrides: Partial<EventResult> = {}): EventResult {
  return {
    id: "evt-1",
    title: "Jazz Night",
    category: "Jazz",
    venue: "Blue Note",
    startTime: "2026-07-01T20:00:00Z",
    city: "New York",
    state: "NY",
    source: "ticketmaster",
    ...overrides
  };
}

// Ticketmaster distance wins — no Haversine overwrite.
const tmDistance = withEventStraightLineDistance(
  event({ distance: 4.2, latitude: 40.73, longitude: -74.0 }),
  40.75,
  -73.99
);
assert(tmDistance.distance === 4.2, "keep Ticketmaster distance when present");

// Haversine fallback when TM omits distance but venue coords exist.
const computed = withEventStraightLineDistance(
  event({ latitude: 40.73, longitude: -74.0 }),
  40.75,
  -73.99
);
assert(typeof computed.distance === "number" && computed.distance > 0, "haversine fallback");

// No coords + no TM distance → hide chip.
const hidden = withEventStraightLineDistance(event(), 40.75, -73.99);
assert(hidden.distance == null, "no distance without TM or coords");
assert(eventDistanceChip(hidden) === null, "hide distance chip when unknown");

assert(formatEventDistanceChip(4.2) === "4 mi away", "format whole miles");
assert(formatEventDistanceChip(0.4) === "Under 1 mi", "format under one mile");

const directions = eventCta(event({ ticketUrl: undefined, venue: "Blue Note", city: "NYC", state: "NY" }));
assert(directions?.kind === "directions", "directions CTA when no tickets");
assert(Boolean(directions?.href.includes("google.com/maps")), "directions is outbound maps link only");

console.log("PASS event distance policy (straight-line only, no Routes)");
