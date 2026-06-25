import { normalizeExploreIntent } from "../lib/exploreRouting";
import {
  classifyResultExperienceType,
  diversifyExploreResults,
  shouldApplyDiversityRanking
} from "../lib/resultDiversityRanking";
import type { EventResult, ScoredVenue } from "../lib/types";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

process.env.OPENTRIPMAP_API_KEY = "test-key";

const BROAD_QUERIES = [
  "things to do this weekend",
  "fun this weekend",
  "what should we do today",
  "things to do tonight",
  "weekend ideas",
  "date ideas this weekend",
  "family things to do this weekend"
];

const SPECIFIC_QUERIES = [
  "sushi near me",
  "coffee near me",
  "EV chargers near me",
  "Phillies game",
  "concerts this weekend",
  "museums near me"
];

for (const query of BROAD_QUERIES) {
  const intent = normalizeExploreIntent({ query, structured: false });
  assert(intent.timeAwareExplore, `${query} is time-aware Explore`);
  assert(shouldApplyDiversityRanking(query, intent), `${query} applies diversity ranking`);
}

for (const query of SPECIFIC_QUERIES) {
  const intent = normalizeExploreIntent({ query, structured: false });
  assert(!shouldApplyDiversityRanking(query, intent), `${query} does not apply diversity ranking`);
}

const mixedEvents = diversifyExploreResults(
  [
    event("concert-1", "Indie Concert", "Music", "ticketmaster"),
    event("concert-2", "Jazz Concert", "Music", "ticketmaster"),
    event("concert-3", "Rock Concert", "Music", "ticketmaster"),
    event("concert-4", "Folk Concert", "Music", "ticketmaster"),
    event("market-1", "Saturday Farmers Market", "Market", "eventbrite"),
    event("comedy-1", "Comedy Night", "Comedy", "ticketmaster"),
    event("festival-1", "Summer Street Fair", "Festival", "eventbrite"),
    event("sports-1", "Baseball Game", "Sports", "ticketmaster"),
    event("park-1", "Guided Waterfront Walk", "Outdoors", "opentripmap"),
    event("museum-1", "Museum Late Night", "Culture", "opentripmap"),
    event("family-1", "Family Discovery Day", "Family", "eventbrite"),
    event("festival-2", "Neighborhood Pop-up Festival", "Festival", "local"),
    event("garden-1", "Garden Evening Walk", "Outdoors", "opentripmap")
  ],
  {
    query: "things to do this weekend",
    intent: normalizeExploreIntent({ query: "things to do this weekend", structured: false }),
    getProvider: (item) => item.source,
    getScore: (_item, index) => 100 - index * 2,
    maxRelevanceGap: 24
  }
);

assert(maxTypeCount(mixedEvents.slice(0, 6)) <= 2, "top 6 has no more than two of one event type");
assert(maxProviderCount(mixedEvents.slice(0, 10)) <= 3, "top 10 has no more than three from one provider when alternatives exist");

const highScoringEvent = event("best", "Can’t Miss Festival", "Festival", "eventbrite");
const highScoreResults = diversifyExploreResults(
  [
    highScoringEvent,
    event("concert-1", "Concert One", "Music", "ticketmaster"),
    event("concert-2", "Concert Two", "Music", "ticketmaster"),
    event("concert-3", "Concert Three", "Music", "ticketmaster"),
    event("museum-1", "Museum Late Night", "Culture", "eventbrite"),
    event("sports-1", "Baseball Game", "Sports", "ticketmaster")
  ],
  {
    query: "things to do this weekend",
    intent: normalizeExploreIntent({ query: "things to do this weekend", structured: false }),
    getScore: (item) => (item.id === "best" ? 200 : 100),
    maxRelevanceGap: 20
  }
);

assert(highScoreResults[0].id === "best", "obvious high-scoring event remains first");

const venueResults = diversifyExploreResults(
  [
    venue("generic-1", "Township Community Center", "activities", 100),
    venue("generic-2", "Indoor Play Place", "activities", 98),
    venue("generic-3", "Fitness Center", "activities", 96),
    venue("generic-4", "Recreation Center", "activities", 94),
    venue("museum-1", "Local History Museum", "museums", 92),
    venue("park-1", "Waterfront Park", "park", 90),
    venue("garden-1", "Botanical Garden", "gardens", 88),
    venue("zoo-1", "Family Zoo", "zoos", 86)
  ],
  {
    query: "things to do this weekend",
    intent: normalizeExploreIntent({ query: "things to do this weekend", structured: false }),
    getProvider: (_item, index) => (index < 4 ? "google_places" : "opentripmap"),
    getScore: (_item, index) => 100 - index * 2
  }
);

assert(
  venueResults.slice(0, 6).filter((item) => classifyResultExperienceType(item) === "generic_place").length <= 2,
  "generic places do not dominate broad temporal venue results"
);

console.log("PASS result diversity ranking");

function event(id: string, title: string, category: string, source: string): EventResult {
  return {
    id,
    title,
    category,
    venue: title,
    startTime: "2026-06-27T19:00:00-04:00",
    city: "Philadelphia",
    state: "PA",
    source
  };
}

function venue(id: string, name: string, category: string, fairnessScore: number): ScoredVenue {
  return {
    id,
    name,
    category,
    address: "Philadelphia, PA",
    location: { lat: 39.95, lng: -75.16 },
    rating: 4.5,
    reviewCount: 100,
    openNow: true,
    googleMapsUri: "https://maps.google.com",
    types: [category, name.toLowerCase()],
    travelFromA: { distanceMeters: 1000, durationMinutes: 10, status: "OK" },
    travelFromB: { distanceMeters: 1000, durationMinutes: 10, status: "OK" },
    timeDifferenceMinutes: 0,
    totalTravelMinutes: 20,
    fairnessScore,
    preferenceScore: 0,
    preferenceMatches: []
  };
}

function maxTypeCount(results: EventResult[]) {
  const counts = new Map<string, number>();
  for (const result of results) {
    const type = classifyResultExperienceType(result);
    counts.set(type, (counts.get(type) ?? 0) + 1);
  }
  return Math.max(...counts.values());
}

function maxProviderCount(results: EventResult[]) {
  const counts = new Map<string, number>();
  for (const result of results) {
    counts.set(result.source, (counts.get(result.source) ?? 0) + 1);
  }
  return Math.max(...counts.values());
}
