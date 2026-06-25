import { normalizeEventbriteEvent, eventbriteEventProvider } from "../lib/providers/eventbriteEventProvider";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const normalized = normalizeEventbriteEvent({
  id: "evt-1",
  name: { text: "Brooklyn Night Market" },
  url: "https://eventbrite.com/e/evt-1",
  status: "live",
  online_event: false,
  category_id: "110",
  start: { utc: "2026-07-04T23:00:00Z" },
  end: { utc: "2026-07-05T03:00:00Z" },
  logo: { url: "https://img/logo.jpg" },
  venue: {
    name: "Smorgasburg",
    address: { city: "Brooklyn", region: "NY", latitude: "40.7218", longitude: "-73.9619" }
  }
});

assert(normalized !== null, "valid event normalizes");
assert(normalized!.source === "eventbrite", "source tagged eventbrite");
assert(normalized!.category === "Food & Drink", "category id mapped");
assert(normalized!.city === "Brooklyn" && normalized!.state === "NY", "venue address mapped");
assert(normalized!.latitude === 40.7218 && normalized!.longitude === -73.9619, "coordinates parsed");

assert(
  normalizeEventbriteEvent({ id: "x", name: { text: "Webinar" }, online_event: true, start: { utc: "2026-07-04T23:00:00Z" } }) === null,
  "online events dropped"
);
assert(
  normalizeEventbriteEvent({ id: "y", name: { text: "Canceled" }, status: "canceled", start: { utc: "2026-07-04T23:00:00Z" } }) === null,
  "non-live events dropped"
);
assert(normalizeEventbriteEvent({ id: "z", name: { text: "No date" } }) === null, "events without start dropped");

// Without a token the provider is a safe no-op regardless of configured sources.
delete process.env.EVENTBRITE_API_KEY;
delete process.env.EVENTBRITE_PRIVATE_TOKEN;
delete process.env.EVENTBRITE_OAUTH_TOKEN;
assert(eventbriteEventProvider.isConfigured() === false, "no-op without a token");

// With a token AND curated sources present, the provider activates.
process.env.EVENTBRITE_API_KEY = "test-token";
assert(eventbriteEventProvider.isConfigured() === true, "configured with token + curated sources");

console.log("PASS eventbrite provider");
