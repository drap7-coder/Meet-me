export type EventWhen = "tonight" | "weekend" | "date";

export const EVENT_WHEN_OPTIONS: Array<{ id: EventWhen; label: string }> = [
  { id: "tonight", label: "Tonight" },
  { id: "weekend", label: "This Weekend" },
  { id: "date", label: "Pick a Date" }
];

const ISO_DATE_IN_QUERY = /\bon\s+(\d{4}-\d{2}-\d{2})\b/i;

/** Natural-language timing phrase for event chip queries (before the location suffix). */
export function eventWhenPhrase(input: {
  exploreCategory?: string | null;
  /** @deprecated use exploreCategory */
  localWhat?: string | null;
  typeId: string | null;
  eventWhen?: EventWhen | null;
  eventDate?: string | null;
}): string {
  const category = input.exploreCategory ?? input.localWhat;
  if (category !== "events") return "";
  if (input.typeId === "weekend") return "";

  if (input.eventWhen === "tonight") return "tonight";
  if (input.eventWhen === "weekend") return "this weekend";
  if (input.eventWhen === "date" && input.eventDate?.trim()) return `on ${input.eventDate.trim()}`;

  return "";
}

export function eventWhenChipLabel(when: EventWhen, date: string | null): string {
  if (when === "tonight") return "Tonight";
  if (when === "weekend") return "This Weekend";
  if (when === "date" && date) return formatEventDateLabel(date);
  return "Pick a Date";
}

export function formatEventDateLabel(isoDate: string): string {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) return isoDate;
  return parsed.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function minSelectableEventDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** If the query names a calendar day, return that day's search window. */
export function parseEventDateWindowFromQuery(query: string): { start: Date; end: Date } | null {
  const match = query.match(ISO_DATE_IN_QUERY);
  if (!match?.[1]) return null;
  return calendarDayWindow(match[1]);
}

function calendarDayWindow(isoDate: string): { start: Date; end: Date } | null {
  const start = parseIsoDate(isoDate);
  if (!start) return null;

  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function parseIsoDate(value: string): Date | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}
