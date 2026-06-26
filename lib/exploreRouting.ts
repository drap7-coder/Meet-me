import {
  exploreCategoryConfig,
  inferExploreCategoryFromQuery,
  inferExploreSubcategoryFromQuery,
  isTicketmasterExploreSubcategory,
  type ExploreCategory,
  type ExploreIntentPayload,
  type ExploreMode,
  type NormalizedExploreIntent,
  type ProviderKey,
  venueCategoryForExplore
} from "@/lib/exploreIntent";
import { isLocalHappeningsQuery } from "@/lib/localHappenings";
import { hasEventbriteApiKey } from "@/lib/providers/eventbriteEventProvider";
import { logApiError } from "@/lib/serverLog";
import { hasEventbriteFoodMarketSources, hasEventbriteSources } from "@/src/config/eventbriteSources";

const TEMPORAL_QUERY_PATTERN =
  /\b(?:things to do|fun|events?|outdoor activit(?:y|ies)|what should we do|what to do|what(?:'s| is) happening|plans?|ideas?|date ideas?|family things?)\b.*\b(?:this weekend|weekend|tonight|today|tomorrow|saturday|sunday|this afternoon|this evening)\b|\b(?:tonight|today|tomorrow|saturday|sunday|this afternoon|this evening)\b.*\b(?:things to do|fun|events?|outdoor activit(?:y|ies)|what should we do|what to do|what(?:'s| is) happening|plans?|ideas?|date ideas?|family things?)\b|\b(?:weekend ideas?|today ideas?|tonight ideas?)\b/i;

const TEMPORAL_EVENT_WORD_PATTERN =
  /\b(?:events?|concerts?|comedy|theat(?:er|re)|festivals?|street fairs?|farmers? markets?|live music|sports?|games?)\b.*\b(?:this weekend|weekend|tonight|today|tomorrow|saturday|sunday|this afternoon|this evening)\b/i;

const BARE_TEMPORAL_DISCOVERY_PATTERN =
  /^(?:tonight|today|tomorrow|saturday|sunday|this afternoon|this evening)$/i;

const PLACE_PRIMARY_TEMPORAL_CATEGORIES = new Set<ExploreCategory>(["food_drink", "nightlife"]);

export type ExploreRoutingInput = {
  query: string;
  mode?: ExploreMode | null;
  category?: ExploreCategory | null;
  subcategoryId?: string | null;
  /** When true, prefer chip-selected category over NLP inference. */
  structured?: boolean;
};

/** Lightweight debug trail — visible in server logs, not in consumer UI. */
export function logExploreRoutingDecision(intent: NormalizedExploreIntent, reason: string) {
  if (process.env.NODE_ENV === "production" && process.env.EXPLORE_ROUTING_DEBUG !== "1") return;
  console.info("[explore-routing]", {
    reason,
    category: intent.category,
    subcategoryId: intent.subcategoryId,
    providers: intent.providers,
    routeViaTicketmaster: intent.routeViaTicketmaster,
    preferOpenTripMap: intent.preferOpenTripMap,
    timeAwareExplore: intent.timeAwareExplore,
    venueCategory: intent.venueCategory,
    queryPreview: intent.query.slice(0, 80)
  });
}

function availableProviders(configured: ProviderKey[]): ProviderKey[] {
  const hasOtm = Boolean(process.env.OPENTRIPMAP_API_KEY?.trim());
  const hasEventbrite = hasEventbriteApiKey() && hasEventbriteSources();
  return configured.filter((provider) => {
    if (provider === "opentripmap" || provider === "openstreetmap") return hasOtm;
    if (provider === "national_parks") return false; // reserved — not wired yet
    if (provider === "tmdb") return false;
    if (provider === "eventbrite") return hasEventbrite;
    return true;
  });
}

export function selectProvidersForExplore(
  category: ExploreCategory,
  subcategoryId: string | null
): ProviderKey[] {
  if (subcategoryId === "farmers_markets") {
    const farmersProviders: ProviderKey[] = ["opentripmap", "google_places"];
    if (hasEventbriteApiKey() && hasEventbriteFoodMarketSources()) {
      farmersProviders.push("eventbrite");
    }
    const available = availableProviders(farmersProviders);
    return available.length ? available : ["google_places"];
  }

  const config = exploreCategoryConfig(category);
  let providers = [...config.providers];

  if (category === "sports" && subcategoryId && !isTicketmasterExploreSubcategory(category, subcategoryId)) {
    providers = ["google_places", "opentripmap"];
  }

  const available = availableProviders(providers);
  return available.length ? available : ["google_places"];
}

export function hasTemporalExploreIntent(query: string): boolean {
  const value = query.trim();
  if (!value) return false;
  return TEMPORAL_QUERY_PATTERN.test(value) || TEMPORAL_EVENT_WORD_PATTERN.test(value) || BARE_TEMPORAL_DISCOVERY_PATTERN.test(value);
}

export function isTimeAwareExploreCategory(category: ExploreCategory | null): boolean {
  return Boolean(category && !PLACE_PRIMARY_TEMPORAL_CATEGORIES.has(category));
}

export function selectProvidersForTimeAwareExplore(category: ExploreCategory | null): ProviderKey[] {
  const providers: ProviderKey[] = ["ticketmaster"];
  if (hasEventbriteApiKey() && hasEventbriteSources()) providers.push("eventbrite");
  if (category === "activities" || category === "outdoors" || category === "events" || category === "sports") {
    providers.push("opentripmap");
  }
  providers.push("google_places");
  return providers;
}

function inferSubcategoryFromQuery(category: ExploreCategory, query: string, subcategoryId: string | null): string | null {
  return inferExploreSubcategoryFromQuery(category, query, subcategoryId);
}

export function normalizeExploreIntent(input: ExploreRoutingInput): NormalizedExploreIntent {
  const query = input.query.trim();
  const mode: ExploreMode = input.mode === "streaming" ? "streaming" : "explore";

  const inferredCategory =
    input.structured && input.category
      ? input.category
      : input.category ?? inferExploreCategoryFromQuery(query);

  const category = mode === "explore" ? inferredCategory : null;
  const subcategoryId =
    category && mode === "explore"
      ? inferSubcategoryFromQuery(category, query, input.subcategoryId ?? null)
      : input.subcategoryId ?? null;

  if (!category || mode !== "explore") {
    return {
      mode,
      category: null,
      subcategoryId: null,
      query,
      providers: [],
      venueCategory: "restaurant",
      routeViaTicketmaster: false,
      preferOpenTripMap: false,
      timeAwareExplore: false
    };
  }

  const timeAwareExplore = hasTemporalExploreIntent(query) && isTimeAwareExploreCategory(category);
  const providers = timeAwareExplore
    ? selectProvidersForTimeAwareExplore(category)
    : selectProvidersForExplore(category, subcategoryId);
  const routeViaTicketmaster =
    !timeAwareExplore &&
    !isLocalHappeningsQuery(query) &&
    providers.includes("ticketmaster") &&
    isTicketmasterExploreSubcategory(category, subcategoryId);
  const preferOpenTripMap = !timeAwareExplore && providers[0] === "opentripmap";

  const intent: NormalizedExploreIntent = {
    mode,
    category,
    subcategoryId,
    query,
    providers,
    venueCategory: venueCategoryForExplore(category, subcategoryId),
    routeViaTicketmaster,
    preferOpenTripMap,
    timeAwareExplore
  };

  logExploreRoutingDecision(
    intent,
    input.structured ? "structured_chip_selection" : input.category ? "explicit_category" : "inferred_from_query"
  );

  return intent;
}

export function exploreIntentFromPayload(
  query: string,
  payload?: ExploreIntentPayload | null
): NormalizedExploreIntent {
  try {
    return normalizeExploreIntent({
      query,
      mode: payload?.mode,
      category: payload?.category,
      subcategoryId: payload?.subcategoryId ?? null,
      structured: Boolean(payload?.category)
    });
  } catch (error) {
    logApiError("explore-intent-normalize", error);
    return normalizeExploreIntent({ query });
  }
}

export function shouldRouteExploreToTicketmaster(intent: NormalizedExploreIntent): boolean {
  return intent.mode === "explore" && intent.routeViaTicketmaster;
}

export function filterAvailableProviders(configured: ProviderKey[]): ProviderKey[] {
  return availableProviders(configured);
}

export function shouldSupplementWithOpenTripMap(intent: NormalizedExploreIntent): boolean {
  return (
    intent.mode === "explore" &&
    intent.providers.includes("opentripmap") &&
    !intent.routeViaTicketmaster
  );
}

/** Typed or chip queries that should use Places + OpenTripMap instead of Ticketmaster-only. */
export function shouldUseOpenTripMapExplorePath(intent: NormalizedExploreIntent): boolean {
  return intent.mode === "explore" && intent.category !== null && !intent.timeAwareExplore && shouldSupplementWithOpenTripMap(intent);
}

export function shouldUseTimeAwareExplorePath(intent: NormalizedExploreIntent): boolean {
  return intent.mode === "explore" && intent.category !== null && intent.timeAwareExplore;
}

/** Prevent streaming and explore chip sets from appearing together in structured state. */
export function validateExploreBuilderIsolation(input: {
  selectedMode: ExploreMode | null;
  hasStreamingSelections: boolean;
  hasExploreCategory: boolean;
}): boolean {
  if (!input.selectedMode) return !input.hasStreamingSelections && !input.hasExploreCategory;
  if (input.selectedMode === "streaming") return !input.hasExploreCategory;
  return !input.hasStreamingSelections;
}
