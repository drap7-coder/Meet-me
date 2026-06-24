import type { EventResult, EventSearchRequest, LocalEventProfile } from "@/lib/eventResult";

export type EventSearchParams = EventSearchRequest & {
  startDateTime?: string;
  endDateTime?: string;
};

export interface EventProvider {
  searchEvents(request: EventSearchParams): Promise<EventResult[]>;
  isConfigured(): boolean;
}
