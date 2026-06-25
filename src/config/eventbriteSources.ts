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

export type EventbriteSourceCategory =
  | "festivals"
  | "food_markets"
  | "arts_culture"
  | "museums"
  | "comedy"
  | "music"
  | "community"
  | "family"
  | "outdoor";

export type EventbriteSource = {
  /** Eventbrite organization or venue ID (the number in an organizer's /o/<slug>-<id> URL). */
  id: string;
  /** Human label for logs/telemetry only — not shown to users. */
  label: string;
  /** Home city/metro, for our own reference when curating. */
  city?: string;
  /** The kind of recurring events this source tends to create. */
  category?: EventbriteSourceCategory;
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

/**
 * Organizations whose upcoming public events we surface. Empty = Eventbrite shows nothing.
 *
 * Starter set: Philadelphia / Wyndmoor metro. IDs were curated from public Eventbrite
 * organizer pages. Because Eventbrite has no geo search, every event is still
 * distance-filtered to the searcher, so quiet weeks simply yield fewer cards.
 * Validate which IDs actually return events with the dev diagnostic.
 */
export const EVENTBRITE_ORGANIZATION_SOURCES: EventbriteSource[] = [
  { id: "8458421368", label: "Comic Cure", city: "Philadelphia", category: "comedy" },
  { id: "3279885602", label: "Wagner Free Institute of Science", city: "Philadelphia", category: "museums" },
  { id: "121434036349", label: "Philadelphia Vendor Collective", city: "Philadelphia", category: "food_markets" },
  { id: "73776162233", label: "Studio 16 @ Cherry St Pier (Bonnie MacAllister)", city: "Philadelphia", category: "arts_culture" },
  { id: "55227403493", label: "Elise Mark — The Community Stage Open Mic", city: "Philadelphia", category: "music" },
  { id: "30844233775", label: "Girard College Historical Resources (Kathy Haas)", city: "Philadelphia", category: "arts_culture" },
  { id: "2329870725", label: "JJ Tiziou — public art & community", city: "Philadelphia", category: "community" },
  { id: "52253118223", label: "Alyssa Reynoso-Morris — author & community", city: "Philadelphia", category: "family" },
  { id: "98586833661", label: "Bread & Roses Consultant (Charity Tooze)", city: "Philadelphia", category: "community" }
];

/** Venues whose upcoming public events we surface. Empty = Eventbrite shows nothing. */
export const EVENTBRITE_VENUE_SOURCES: EventbriteSource[] = [];

export function hasEventbriteSources(): boolean {
  return EVENTBRITE_ORGANIZATION_SOURCES.length > 0 || EVENTBRITE_VENUE_SOURCES.length > 0;
}
