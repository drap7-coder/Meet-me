import type { EventResult } from "../lib/eventResult";
import {
  classifyTrendingPickType,
  composeTrendingPicks,
  getSeasonalSportsPriorities,
  isWorldCupWindow,
  shouldIncludeSeasonalSpecial
} from "../lib/trendingComposition";
import type { ScoredVenue } from "../lib/types";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function event(
  id: string,
  title: string,
  category: string,
  options: Partial<EventResult> = {}
): EventResult {
  return {
    id,
    title,
    category,
    venue: "Wells Fargo Center",
    startTime: "2026-06-28T19:00:00Z",
    city: "Philadelphia",
    state: "PA",
    source: "ticketmaster",
    imageUrl: "https://img.example/event.jpg",
    ticketUrl: "https://ticketmaster.com/event",
    ...options
  };
}

function place(id: string, name: string, category: string): ScoredVenue {
  return {
    id,
    name,
    category,
    address: "123 Main St, Philadelphia, PA",
    location: { lat: 39.95, lng: -75.17 },
    rating: 4.5,
    reviewCount: 100,
    openNow: true,
    googleMapsUri: "https://maps.google.com",
    fairnessScore: 80,
    travelFromA: { distanceMeters: 1200, durationMinutes: 8, status: "OK" },
    travelFromB: { distanceMeters: 1200, durationMinutes: 8, status: "OK" },
    timeDifferenceMinutes: 0,
    totalTravelMinutes: 16,
    preferenceScore: 0,
    preferenceMatches: [],
    types: []
  };
}

const summerWeekend = new Date(2026, 5, 28, 12, 0, 0);
const philly = { lat: 39.9526, lng: -75.1652 };
const phillyContext = { latitude: philly.lat, longitude: philly.lng, date: summerWeekend };

const summerPriorities = getSeasonalSportsPriorities(summerWeekend, philly);
assert(summerPriorities.find((entry) => entry.sport === "baseball")?.inSeason === true, "baseball in season during June");
assert(summerPriorities.find((entry) => entry.sport === "football")?.inSeason === false, "football out of season in late June");
assert(isWorldCupWindow(summerWeekend), "World Cup window active in June 2026");

const curatedSummer = composeTrendingPicks(
  [
    event("concert-1", "Indie Night at The Fillmore", "Music"),
    event("phillies-1", "Philadelphia Phillies vs New York Mets", "Baseball"),
    event("union-1", "Philadelphia Union vs NYCFC", "Soccer"),
    event("football-far", "NFL Preseason Classic", "Football"),
    event("world-cup", "FIFA World Cup 2026 - Group Stage", "Soccer"),
    event("comedy-1", "Stand-up Saturday", "Comedy"),
    place("market-1", "Headhouse Farmers Market", "farmers market"),
    place("trail-1", "Schuylkill River Trail Walk", "scenic walk"),
    place("museum-1", "Philadelphia Museum of Art Late Night", "museum"),
    place("family-1", "Please Touch Museum Family Day", "family"),
    place("generic-1", "Community Recreation Center", "community center")
  ],
  { ...phillyContext, cap: 10 }
);

assert(
  curatedSummer.some((item) => "title" in item && /concert|fillmore|music/i.test(item.title)),
  "curated feed includes a concert when available"
);
assert(
  curatedSummer.some((item) => "title" in item && /phillies|baseball/i.test(item.title)),
  "baseball included during baseball season when available"
);
assert(
  !curatedSummer.some((item) => "title" in item && /nfl preseason classic/i.test(item.title)),
  "ordinary football skipped outside football season"
);
assert(
  curatedSummer.some((item) => "title" in item && /world cup|fifa/i.test(item.title)),
  "World Cup can appear as a seasonal special"
);

const worldCupIndex = curatedSummer.findIndex(
  (item) => "title" in item && /world cup|fifa/i.test(item.title)
);
const genericIndex = curatedSummer.findIndex(
  (item) => "name" in item && /community recreation center/i.test(item.name)
);
if (worldCupIndex >= 0 && genericIndex >= 0) {
  assert(worldCupIndex < genericIndex, "seasonal special ranks ahead of generic place");
}

const weakSportsOnly = composeTrendingPicks(
  [
    event("concert-best", "Sold Out Concert", "Music"),
    event("weak-baseball", "Obscure Exhibition Game", "Baseball", { imageUrl: undefined })
  ],
  { ...phillyContext, cap: 4 }
);
assert(
  weakSportsOnly[0] && "title" in weakSportsOnly[0] && /concert/i.test(weakSportsOnly[0].title),
  "strong concert beats weak/no-image baseball"
);
assert(
  !weakSportsOnly.some((item) => "title" in item && /exhibition game/i.test(item.title)),
  "weak baseball without image is not forced into the feed"
);

const sportsHeavy = composeTrendingPicks(
  [
    event("s1", "Philadelphia Phillies Game 1", "Baseball"),
    event("s2", "Philadelphia Phillies Game 2", "Baseball"),
    event("s3", "Philadelphia Union Match", "Soccer"),
    event("s4", "Local Baseball Night", "Baseball"),
    event("m1", "Summer Concert Series", "Music"),
    event("c1", "Comedy Showcase", "Comedy")
  ],
  { ...phillyContext, cap: 6 }
);
const sportsCount = sportsHeavy.filter((item) => {
  if (!("title" in item)) return false;
  const type = classifyTrendingPickType(item);
  return type === "baseball" || type === "football" || type === "soccer" || type === "sports_other";
}).length;
assert(sportsCount <= 2, "sports does not dominate a general feed");

const sportsFocused = composeTrendingPicks(
  [
    event("s1", "Philadelphia Phillies Game 1", "Baseball"),
    event("s2", "Philadelphia Phillies Game 2", "Baseball"),
    event("s3", "Philadelphia Union Match", "Soccer"),
    event("m1", "Summer Concert Series", "Music")
  ],
  { ...phillyContext, cap: 6, sportsFocused: true }
);
assert(sportsFocused.length >= 3, "sports-focused context can include more games");

assert(
  shouldIncludeSeasonalSpecial(event("wc", "FIFA World Cup 2026 Match", "Soccer"), { date: summerWeekend }),
  "shouldIncludeSeasonalSpecial detects World Cup"
);
assert(classifyTrendingPickType(event("p", "Philadelphia Phillies vs Mets", "Baseball")) === "baseball", "classifies baseball");

console.log("PASS trending composition");
