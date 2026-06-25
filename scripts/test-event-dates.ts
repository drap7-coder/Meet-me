import { buildPlaceQuery, type BuilderState } from "../app/components/SearchPromptAssist";
import {
  eventWhenPhrase,
  formatEventDateLabel,
  minSelectableEventDate,
  parseEventDateWindowFromQuery
} from "../lib/eventDates";
import { eventTimeWindow } from "../lib/localEventIntent";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const eventsBase: BuilderState = {
  selectedMode: "explore",
  exploreCategory: "events",
  typeId: "concerts",
  sportsTeamId: null,
  musicArtistId: null,
  extras: new Set(),
  where: "near",
  streamingType: null,
  streamingVibe: null,
  genre: null,
  streamingServices: new Set(),
  eventWhen: null,
  eventDate: null
};

assert(eventWhenPhrase(eventsBase) === "", "no when chip -> empty phrase");

const tonight = { ...eventsBase, eventWhen: "tonight" as const };
assert(eventWhenPhrase(tonight) === "tonight", "tonight phrase");
assert(buildPlaceQuery(tonight) === "Concerts tonight near me", "concerts tonight query");

const weekend = { ...eventsBase, eventWhen: "weekend" as const };
assert(buildPlaceQuery(weekend) === "Concerts this weekend near me", "concerts weekend query");

const pickDate = { ...eventsBase, eventWhen: "date" as const, eventDate: "2026-07-04" };
assert(eventWhenPhrase(pickDate) === "on 2026-07-04", "specific date phrase");
assert(buildPlaceQuery(pickDate) === "Concerts on 2026-07-04 near me", "concerts on date query");

const weekendType = { ...eventsBase, typeId: "weekend", eventWhen: "tonight" as const };
assert(eventWhenPhrase(weekendType) === "", "weekend type suppresses when chips in query");
assert(buildPlaceQuery(weekendType) === "Things to do this weekend near me", "weekend type ignores when chip");

const taylorTonight = {
  ...eventsBase,
  musicArtistId: "taylor_swift",
  eventWhen: "tonight" as const
};
assert(buildPlaceQuery(taylorTonight) === "Taylor Swift concerts tonight near me", "artist + tonight");

const minDate = minSelectableEventDate();
assert(/^\d{4}-\d{2}-\d{2}$/.test(minDate), "min date is ISO");

const label = formatEventDateLabel("2026-07-04");
assert(label.includes("Jul") && label.includes("4"), `formatted label: ${label}`);

const window = parseEventDateWindowFromQuery("concerts on 2026-07-04 near me");
assert(window !== null, "parses on YYYY-MM-DD from query");
if (window) {
  assert(window.start.getFullYear() === 2026, "window year");
  assert(window.start.getMonth() === 6, "window month (July)");
  assert(window.start.getDate() === 4, "window day");
}

const tmWindow = eventTimeWindow("music", "jazz concerts on 2026-12-25 near me");
assert(tmWindow.start.getMonth() === 11 && tmWindow.start.getDate() === 25, "eventTimeWindow uses query date");

console.log("PASS event dates");
