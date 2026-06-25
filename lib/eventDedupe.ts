import type { EventResult } from "@/lib/eventResult";

export function normalizeEventShowKey(event: EventResult): string {
  const title = event.title
    .toLowerCase()
    .replace(/\*[^*]+\*/g, " ")
    .replace(
      /\b(?:mon|tue|wed|thu|fri|sat|sun)(?:day|night)?\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}\b|\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/gi,
      " "
    )
    .replace(/\b(?:premium seating|vip|suite package|ticket package|parking only|parking pass)\b/gi, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const venue = event.venue
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const city = event.city.toLowerCase().trim();

  return `${event.source}:${title}:${venue}:${city}`;
}

export function eventInstanceKey(event: EventResult): string {
  return `${event.source}:${event.id}`;
}

function eventStartMs(event: EventResult): number {
  const parsed = Date.parse(event.startTime);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

/** Prefer the soonest showtime, then image quality, then proximity. */
export function preferEventInstance(existing: EventResult, candidate: EventResult): EventResult {
  const existingStart = eventStartMs(existing);
  const candidateStart = eventStartMs(candidate);
  if (existingStart !== candidateStart) {
    return candidateStart < existingStart ? candidate : existing;
  }

  const existingImage = Boolean(existing.imageUrl?.trim());
  const candidateImage = Boolean(candidate.imageUrl?.trim());
  if (existingImage !== candidateImage) {
    return candidateImage ? candidate : existing;
  }

  const existingDistance = existing.distance ?? Number.POSITIVE_INFINITY;
  const candidateDistance = candidate.distance ?? Number.POSITIVE_INFINITY;
  return candidateDistance < existingDistance ? candidate : existing;
}

export function dedupeTrendingEvents(events: EventResult[]): EventResult[] {
  const seenIds = new Set<string>();
  const byShow = new Map<string, EventResult>();

  for (const event of events) {
    const idKey = eventInstanceKey(event);
    if (seenIds.has(idKey)) continue;
    seenIds.add(idKey);

    const showKey = normalizeEventShowKey(event);
    const existing = byShow.get(showKey);
    if (!existing) {
      byShow.set(showKey, event);
      continue;
    }

    byShow.set(showKey, preferEventInstance(existing, event));
  }

  return [...byShow.values()];
}
