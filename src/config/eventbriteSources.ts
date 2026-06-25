/**
 * Hyper-local Eventbrite sources (data-driven).
 *
 * Eventbrite shut down its public Event Search API in 2020, so there is no
 * "events near me by lat/lng" endpoint. The supported, ToS-clean path is to
 * pull upcoming public events from specific organizers and venues we trust to
 * post grassroots, community-flavored events (markets, workshops, indie shows,
 * food crawls) that Ticketmaster does not surface.
 *
 * Add coverage WITHOUT touching component or provider code — just list IDs here.
 *
 * Finding an organization ID:
 *   Open the organizer's Eventbrite profile, e.g.
 *   https://www.eventbrite.com/o/some-organizer-12345678  ->  "12345678"
 *
 * Finding a venue ID:
 *   Visit an event's venue page or inspect an event payload's `venue.id`.
 *
 * Events from these sources are still distance-filtered against the searcher's
 * location at request time, so listing organizers from many cities is safe —
 * only nearby events are shown.
 */

export type EventbriteSource = {
  /** Eventbrite organization or venue ID. */
  id: string;
  /** Human label for logs/telemetry only — not shown to users. */
  label: string;
  /** Optional home city, for our own reference when curating. */
  city?: string;
};

/**
 * IMPORTANT: Eventbrite shows NOTHING until you add at least one organizer or
 * venue ID below. Having EVENTBRITE_API_KEY set is necessary but not sufficient —
 * with both lists empty, the provider is a deliberate no-op and the developer
 * diagnostic reports status "no_sources_configured".
 *
 * To verify your setup at any time:
 *   - Dev endpoint:  GET /api/dev/eventbrite-diagnostic
 *   - CLI:           npm run diagnose:eventbrite
 *
 * Example (replace with real IDs):
 *   export const EVENTBRITE_ORGANIZATION_SOURCES: EventbriteSource[] = [
 *     { id: "12345678", label: "Smorgasburg", city: "Brooklyn" },
 *   ];
 */

/** Organizations whose upcoming public events we surface. Empty = Eventbrite shows nothing. */
export const EVENTBRITE_ORGANIZATION_SOURCES: EventbriteSource[] = [];

/** Venues whose upcoming public events we surface. Empty = Eventbrite shows nothing. */
export const EVENTBRITE_VENUE_SOURCES: EventbriteSource[] = [];

export function hasEventbriteSources(): boolean {
  return EVENTBRITE_ORGANIZATION_SOURCES.length > 0 || EVENTBRITE_VENUE_SOURCES.length > 0;
}
