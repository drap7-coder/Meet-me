import { isCurrentLocationReference, looksLikeCurrentLocationQuery } from "@/lib/currentLocation";
import { resolveSearchCategoryFromQuery } from "@/lib/categories";
import { normalizeExploreIntent } from "@/lib/exploreRouting";
import type { ExploreCategory } from "@/lib/exploreIntent";
import type { ProviderKey } from "@/lib/exploreIntent";
import type { VenueCategory } from "@/lib/types";

export type RelatedFeatureId =
  | "trail"
  | "park"
  | "garden"
  | "museum"
  | "ev_charger"
  | "waterfront"
  | "overlook"
  | "scenic_walk"
  | "landmark"
  | "historic_site";

export type NearRelationIntent = {
  primaryQuery: string;
  relation: "near";
  relatedFeature: RelatedFeatureId | null;
  locationQuery: string | null;
};

const FEATURE_RULES: Array<{ id: RelatedFeatureId; pattern: RegExp }> = [
  {
    id: "ev_charger",
    pattern:
      /\b(?:ev\s+)?(?:charg(?:e|ing|ers?)|charging stations?|supercharg(?:e|er|ing))\b|^(?:an?\s+)?e[\s-]?v$/i
  },
  {
    id: "trail",
    pattern:
      /\b(?:(?:bike|rail|hiking|walking|multi[-\s]?use)\s+)?trails?|greenways?|bike paths?|bike trails?|rail trails?\b/i
  },
  { id: "scenic_walk", pattern: /\bscenic walks?\b/i },
  { id: "overlook", pattern: /\b(?:scenic\s+)?overlooks?\b|\bviewpoints?\b/i },
  { id: "park", pattern: /\b(?:national\s+|state\s+|city\s+)?parks?\b/i },
  { id: "garden", pattern: /\b(?:botanical\s+)?gardens?\b/i },
  { id: "museum", pattern: /\bmuseums?\b/i },
  { id: "waterfront", pattern: /\bwaterfronts?\b/i },
  { id: "historic_site", pattern: /\bhistoric sites?\b/i },
  { id: "landmark", pattern: /\blandmarks?\b/i }
];

const FEATURE_EXPLORE: Record<
  RelatedFeatureId,
  { category: ExploreCategory; subcategoryId: string | null; providers: ProviderKey[] }
> = {
  trail: { category: "outdoors", subcategoryId: "trails", providers: ["opentripmap", "national_parks", "google_places"] },
  park: { category: "outdoors", subcategoryId: "parks", providers: ["national_parks", "opentripmap", "google_places"] },
  garden: { category: "outdoors", subcategoryId: "gardens", providers: ["opentripmap", "google_places"] },
  museum: { category: "activities", subcategoryId: "museums", providers: ["opentripmap", "google_places"] },
  waterfront: { category: "outdoors", subcategoryId: "waterfront", providers: ["opentripmap", "google_places"] },
  overlook: { category: "outdoors", subcategoryId: "overlooks", providers: ["opentripmap", "google_places"] },
  scenic_walk: {
    category: "outdoors",
    subcategoryId: "scenic_drives",
    providers: ["opentripmap", "google_places"]
  },
  landmark: { category: "activities", subcategoryId: "landmarks", providers: ["opentripmap", "google_places"] },
  historic_site: {
    category: "activities",
    subcategoryId: "landmarks",
    providers: ["opentripmap", "google_places"]
  },
  ev_charger: { category: "food_drink", subcategoryId: null, providers: ["google_places"] }
};

function cleanupNearTarget(value: string): string {
  return value
    .replace(/^(?:me|my location|current location|here|us)\b/i, "me")
    .replace(/[?.!,]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function resolveRelatedFeature(nearTarget: string): RelatedFeatureId | null {
  const normalized = nearTarget.trim();
  if (!normalized) return null;
  for (const rule of FEATURE_RULES) {
    if (rule.pattern.test(normalized)) return rule.id;
  }
  return null;
}

export function isGenericNearTarget(value: string | null | undefined): boolean {
  if (!value?.trim()) return false;
  return resolveRelatedFeature(value) !== null;
}

function extractNearParts(query: string): { primary: string; nearTarget: string } | null {
  if (/\bbetween\b/i.test(query)) return null;

  const match = query.match(
    /^(.*?)\bnear\s+(?:an?\s+|the\s+)?(.+?)(?:\s+(?:with|that|where|open|tonight|today|this weekend|right now)\b.*)?$/i
  );
  if (!match) return null;

  const primary = match[1]?.trim() ?? "";
  const nearTarget = cleanupNearTarget(match[2] ?? "");
  if (!nearTarget) return null;

  return { primary, nearTarget };
}

export function parseNearFeatureQuery(query: string): NearRelationIntent | null {
  const trimmed = query.trim();
  if (!/\bnear\b/i.test(trimmed)) return null;

  const parts = extractNearParts(trimmed);
  if (!parts) return null;

  const primaryQuery = parts.primary || trimmed.replace(/\bnear\b.+/i, "").trim() || trimmed;
  const nearTarget = parts.nearTarget;

  if (looksLikeCurrentLocationQuery(`near ${nearTarget}`) || isCurrentLocationReference(nearTarget)) {
    return {
      primaryQuery,
      relation: "near",
      relatedFeature: null,
      locationQuery: "me"
    };
  }

  const relatedFeature = resolveRelatedFeature(nearTarget);
  if (relatedFeature) {
    return {
      primaryQuery,
      relation: "near",
      relatedFeature,
      locationQuery: null
    };
  }

  return {
    primaryQuery,
    relation: "near",
    relatedFeature: null,
    locationQuery: nearTarget
  };
}

export function sanitizeLocationForNearRelation(
  location: string,
  query: string
): string {
  const near = parseNearFeatureQuery(query);
  if (near?.relatedFeature) {
    return near.locationQuery ?? "me";
  }
  if (near?.locationQuery) {
    return near.locationQuery;
  }
  if (isGenericNearTarget(location)) {
    return "me";
  }
  return location;
}

export function primaryCategoryForNearRelation(query: string, fallbackCategory = ""): VenueCategory {
  const near = parseNearFeatureQuery(query);
  const categoryQuery = near?.primaryQuery?.trim() || query;
  return resolveSearchCategoryFromQuery(categoryQuery, fallbackCategory).category;
}

export function customQueryForNearRelation(query: string, fallback = ""): string {
  const near = parseNearFeatureQuery(query);
  if (!near?.relatedFeature) return fallback;
  return near.primaryQuery.trim() || fallback;
}

export function exploreIntentFromNearRelation(
  near: NearRelationIntent | null,
  query: string
) {
  if (!near?.relatedFeature) return null;
  const mapping = FEATURE_EXPLORE[near.relatedFeature];
  if (!mapping) return null;

  return normalizeExploreIntent({
    query: near.primaryQuery || query,
    category: mapping.category,
    subcategoryId: mapping.subcategoryId,
    structured: true
  });
}

export function mergeProvidersForNearRelation(
  providers: ProviderKey[],
  near: NearRelationIntent | null
): ProviderKey[] {
  if (!near?.relatedFeature || near.relatedFeature === "ev_charger") {
    return providers;
  }

  const featureIntent = exploreIntentFromNearRelation(near, near.primaryQuery);
  const merged = new Set<ProviderKey>(providers);
  merged.add("google_places");
  for (const provider of featureIntent?.providers ?? FEATURE_EXPLORE[near.relatedFeature].providers) {
    merged.add(provider);
  }
  return [...merged];
}

export function shouldEnrichWithOpenTripMapForNearRelation(near: NearRelationIntent | null): boolean {
  if (!near?.relatedFeature || near.relatedFeature === "ev_charger") return false;
  return FEATURE_EXPLORE[near.relatedFeature].providers.includes("opentripmap");
}

export function shouldUseEvEnrichmentForNearRelation(near: NearRelationIntent | null): boolean {
  return near?.relatedFeature === "ev_charger";
}
