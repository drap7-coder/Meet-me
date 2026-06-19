import type { ScoredVenue } from "@/lib/types";

export type CalendarDetails = {
  placeName: string;
  address: string;
  start: string;
  durationMinutes: number;
  notes?: string;
  travelFromA: string;
  travelFromB: string;
  mapsUrl: string;
  shareUrl?: string;
};

export function buildGoogleCalendarUrl(details: CalendarDetails) {
  const start = new Date(details.start);
  const end = new Date(start.getTime() + details.durationMinutes * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Meet at ${details.placeName}`,
    dates: `${formatGoogleDate(start)}/${formatGoogleDate(end)}`,
    location: details.address,
    details: buildCalendarDescription(details)
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcsUrl(details: CalendarDetails) {
  const params = new URLSearchParams({
    title: `Meet at ${details.placeName}`,
    location: details.address,
    start: new Date(details.start).toISOString(),
    duration: String(details.durationMinutes),
    description: buildCalendarDescription(details),
    filename: `koi-meetup-${slugify(details.placeName)}.ics`
  });
  return `/api/calendar/ics?${params.toString()}`;
}

export function buildCalendarDescription(details: CalendarDetails) {
  return [
    "Koi recommendation.",
    `Travel time from first location: ${details.travelFromA}.`,
    `Travel time from second location: ${details.travelFromB}.`,
    details.shareUrl ? `Meetup link: ${details.shareUrl}` : "",
    `Maps: ${details.mapsUrl}`,
    details.notes ? `Notes: ${details.notes}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

export function defaultCalendarStart() {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 60);
  date.setMinutes(0, 0, 0);
  return toDateTimeLocalValue(date);
}

export function venueToCalendarDetails(params: {
  venue: ScoredVenue;
  start: string;
  durationMinutes: number;
  notes?: string;
  travelFromA: string;
  travelFromB: string;
  shareUrl?: string;
}): CalendarDetails {
  return {
    placeName: params.venue.name,
    address: params.venue.address,
    start: params.start,
    durationMinutes: params.durationMinutes,
    notes: params.notes,
    travelFromA: params.travelFromA,
    travelFromB: params.travelFromB,
    mapsUrl: params.venue.googleMapsUri,
    shareUrl: params.shareUrl
  };
}

function formatGoogleDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function toDateTimeLocalValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "meetup";
}
