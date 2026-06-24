import type { EventResult } from "@/lib/eventResult";
import { resolveMusicArtistSearch } from "@/lib/musicArtists";

const NON_SHOW_EVENT =
  /\b(?:parking|vip upgrade|merchandise|meet and greet package|hospitality package|premium package|club access only)\b/i;

export function isLikelyArtistShowEvent(event: EventResult, keyword: string): boolean {
  const title = event.title.toLowerCase();
  const needle = keyword.toLowerCase();
  if (!title.includes(needle)) return false;
  if (NON_SHOW_EVENT.test(title)) return false;
  return true;
}

export function filterNamedArtistEvents(events: EventResult[], query: string): EventResult[] {
  const artist = resolveMusicArtistSearch(query);
  if (!artist) return events;

  return events.filter((event) => isLikelyArtistShowEvent(event, artist.ticketmasterKeyword));
}
