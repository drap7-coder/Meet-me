export interface EventResult {
  id: string;
  title: string;
  category: string;
  venue: string;
  startTime: string;
  endTime?: string;
  city: string;
  state: string;
  distance?: number;
  latitude?: number;
  longitude?: number;
  ticketUrl?: string;
  imageUrl?: string;
  source: string;
}

export type LocalEventProfile =
  | "date_night"
  | "family"
  | "weekend"
  | "tonight"
  | "sports"
  | "music"
  | "general";

export type EventSearchRequest = {
  query: string;
  latitude: number;
  longitude: number;
  radiusMiles?: number;
  profile?: LocalEventProfile;
  /** Override the default profile time window (ISO strings). */
  startDateTime?: string;
  endDateTime?: string;
  /** Cap ranked results — defaults to search-local-events limits. */
  resultCap?: number;
  /** Ticketmaster segment override (e.g. Sports, Music, Arts & Theatre). */
  segmentName?: string;
};
