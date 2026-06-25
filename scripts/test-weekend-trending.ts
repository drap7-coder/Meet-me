import {
  blendTrendingNearYouMix,
  blendWeekendTrendingMix,
  finalizeTrendingEvents,
  upcomingWeekendWindow,
  weekendTrendingWeekKey
} from "../lib/weekendTrendingEvents";
import type { EventResult } from "../lib/eventResult";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function localDateKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

// Thursday Jun 25, 2026 — upcoming Fri Jun 26 through Sun Jun 28
const thursday = new Date(2026, 5, 25, 15, 0, 0);
const thuWindow = upcomingWeekendWindow(thursday);
assert(localDateKey(thuWindow.start) === "2026-06-26", "Thu -> window starts Friday");
assert(localDateKey(thuWindow.end) === "2026-06-28", "Thu -> window ends Sunday");

// Friday — now through Sunday
const friday = new Date(2026, 5, 26, 18, 0, 0);
const friWindow = upcomingWeekendWindow(friday);
assert(friWindow.start.getTime() === friday.getTime(), "Fri -> window starts now");
assert(localDateKey(friWindow.end) === "2026-06-28", "Fri -> window ends Sunday");

// Sunday — rest of today only
const sunday = new Date(2026, 5, 28, 11, 0, 0);
const sunWindow = upcomingWeekendWindow(sunday);
assert(sunWindow.start.getTime() === sunday.getTime(), "Sun -> window starts now");
assert(localDateKey(sunWindow.end) === "2026-06-28", "Sun -> window ends today");

assert(typeof weekendTrendingWeekKey(thursday) === "string", "week key is string");
assert(weekendTrendingWeekKey(thursday).includes("2026"), "week key includes year");

function stubEvent(id: string, category = "Sports"): EventResult {
  return {
    id,
    title: `${id} Event`,
    category,
    venue: "Arena",
    startTime: "2026-06-28T19:00:00Z",
    city: "Philadelphia",
    state: "PA",
    source: "ticketmaster",
    imageUrl: "https://img.example/event.jpg"
  };
}

const sports = [stubEvent("s1", "Sports")];
const music = [stubEvent("m1", "Music"), stubEvent("m2", "Music")];
const arts = [stubEvent("a1", "Arts")];
const mixed = blendWeekendTrendingMix(sports, music, arts, 5);
assert(mixed.length >= 3, "blend uses available buckets");
assert(mixed.some((event) => event.id === "s1"), "blend can include sports");
assert(mixed.some((event) => event.id === "m1"), "blend includes music");

const comedy = [stubEvent("c1", "Comedy")];
const nearYou = blendTrendingNearYouMix(sports, comedy, music, 4);
assert(nearYou.some((item) => item.id === "s1"), "near-you composition can include sports");
assert(nearYou.some((item) => item.id === "m1" || item.id === "c1"), "near-you composition includes music or comedy");
assert(nearYou.length === 4, "near-you composition fills to cap");

const sparseImages = finalizeTrendingEvents(
  [
    stubEvent("img-1", "Music"),
    { ...stubEvent("no-img-1", "Music"), imageUrl: undefined },
    { ...stubEvent("no-img-2", "Comedy"), imageUrl: undefined },
    { ...stubEvent("no-img-3", "Sports"), imageUrl: undefined },
    { ...stubEvent("no-img-4", "Arts"), imageUrl: undefined }
  ],
  { cap: 4 }
);
assert(sparseImages.length === 4, "trending fills to cap when only one event has an image");

function baseballEvent(id: string, withImage: boolean): EventResult {
  return {
    id,
    title: "Philadelphia Phillies vs New York Mets",
    category: "Baseball",
    venue: "Citizens Bank Park",
    startTime: "2026-06-28T19:00:00Z",
    city: "Philadelphia",
    state: "PA",
    source: "ticketmaster",
    imageUrl: withImage ? "https://img.example/phillies.jpg" : undefined
  };
}

const imageHeavyMusic = [
  stubEvent("img-m1", "Music"),
  stubEvent("img-m2", "Music"),
  stubEvent("img-m3", "Music")
];

const sportsWithoutImageRecovery = finalizeTrendingEvents(
  [...imageHeavyMusic, baseballEvent("phillies-no-img", false), stubEvent("img-c1", "Comedy")],
  { cap: 6, latitude: 39.9526, longitude: -75.1652, date: new Date(2026, 5, 28) }
);
assert(
  sportsWithoutImageRecovery.some((event) => /phillies|baseball/i.test(event.title)),
  "in-season baseball without image is included when ranked pool reaches composition"
);

console.log("PASS weekend trending");
