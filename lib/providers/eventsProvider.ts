import { buildEventsResult } from "@/lib/eventsSearch";
import type { EventsProvider } from "@/lib/providers/types";

export const eventsProvider: EventsProvider = {
  search: buildEventsResult
};
