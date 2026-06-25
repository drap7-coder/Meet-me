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
 *
 * VALIDATED LIMITATION (live test against the production token, 2026-06):
 *   Eventbrite only works for organizers/venues AUTHORIZED to this token.
 *   Public /o/<id> page IDs are NOT guaranteed to be fetchable — the API
 *   returned 404 ("organization_id does not exist") or 403 ("not authorized")
 *   for every curated public Philadelphia organizer. Treat Eventbrite as an
 *   OWNED/AUTHORIZED SOURCE ONLY: list IDs of organizations or venues that this
 *   account owns or has been granted access to. Eventbrite is intentionally
 *   deprioritized behind Ticketmaster in the event pipeline.
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
 * Example (authorized org only — get IDs from GET /v3/users/me/organizations/):
 *   export const EVENTBRITE_ORGANIZATION_SOURCES: EventbriteSource[] = [
 *     { id: "YOUR_ORG_ID", label: "Headhouse Farmers Market", city: "Philadelphia", category: "food_markets" },
 *   ];
 *
 * Sources with category "food_markets" optionally enrich the Trending Near You
 * farmers market card (OpenTripMap is primary). Only those sources are queried
 * for that enrichment, keeping Eventbrite API calls minimal.
 */

/**
 * Organizations whose upcoming public events we surface. Empty = Eventbrite shows nothing.
 *
 * Add ONLY organization IDs that this Eventbrite token owns or is authorized for
 * (find your org IDs via GET /v3/users/me/organizations/). Public /o/ page IDs do
 * NOT work — see the VALIDATED LIMITATION note above.
 *
 * The curated Philadelphia/Wyndmoor public organizers we tried (all returned
 * 404/403 and were removed): Comic Cure (8458421368), Wagner Free Institute
 * (3279885602), Philadelphia Vendor Collective (121434036349), Studio 16 @ Cherry
 * St Pier (73776162233), Elise Mark (55227403493), Girard College / Kathy Haas
 * (30844233775), JJ Tiziou (2329870725), Alyssa Reynoso-Morris (52253118223),
 * Bread & Roses / Charity Tooze (98586833661). Kept here only as a record of what
 * is NOT fetchable without authorization.
 */
export const EVENTBRITE_ORGANIZATION_SOURCES: EventbriteSource[] = [];

/**
 * Venues whose upcoming public events we surface. Empty = Eventbrite shows nothing.
 * Same rule as organizations: only venues this token is authorized to read.
 */
export const EVENTBRITE_VENUE_SOURCES: EventbriteSource[] = [];

export function hasEventbriteSources(): boolean {
  return EVENTBRITE_ORGANIZATION_SOURCES.length > 0 || EVENTBRITE_VENUE_SOURCES.length > 0;
}

/** Sources tagged for optional farmers market enrichment — limits Eventbrite API calls. */
export function getEventbriteFoodMarketSources(): {
  organizations: EventbriteSource[];
  venues: EventbriteSource[];
} {
  return {
    organizations: EVENTBRITE_ORGANIZATION_SOURCES.filter((source) => source.category === "food_markets"),
    venues: EVENTBRITE_VENUE_SOURCES.filter((source) => source.category === "food_markets")
  };
}

export function hasEventbriteFoodMarketSources(): boolean {
  const { organizations, venues } = getEventbriteFoodMarketSources();
  return organizations.length > 0 || venues.length > 0;
}
