import { upcomingWeekendWindow, weekendTrendingWeekKey } from "../lib/weekendTrendingEvents";

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

console.log("PASS weekend trending");
