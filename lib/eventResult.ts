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
  ticketUrl?: string;
  imageUrl?: string;
  source: string;
}

export type LocalEventProfile = "date_night" | "family" | "weekend" | "tonight" | "sports" | "general";

export type EventSearchRequest = {
  query: string;
  latitude: number;
  longitude: number;
  radiusMiles?: number;
  profile?: LocalEventProfile;
};
