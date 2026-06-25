import { exploreRefinementsFor, type ExploreCategory } from "@/lib/exploreIntent";
import { npsProvider } from "@/lib/providers/npsProvider";
import type { BuilderRefinement } from "@/lib/searchBuilderOptions";

export const NPS_ACTIVITY_REFINEMENT_PREFIX = "nps_act_";
export const NPS_AMENITY_REFINEMENT_PREFIX = "nps_amen_";

const OUTDOOR_ACTIVITY_PATTERN =
  /\b(?:hik(?:e|ing)|camp(?:ing)?|climb(?:ing)?|fish(?:ing)?|kayak(?:ing)?|canoe(?:ing)?|boat(?:ing)?|swim(?:ming)?|wildlife|bird(?:ing)?|photograph(?:y)?|snow(?:shoe|sport)?|ski(?:ing)?|backpack(?:ing)?|caving|stargaz(?:ing)?|scenic|trail|waterfall|beach|river|mountain|nature|outdoor)\b/i;

const AMENITY_SUBCATEGORY_HINTS: Array<{ subcategoryId: string; pattern: RegExp }> = [
  { subcategoryId: "campgrounds", pattern: /\b(?:camp(?:ing|ground)s?)\b/i },
  { subcategoryId: "overlooks", pattern: /\b(?:scenic view|overlook|viewpoint)\b/i },
  { subcategoryId: "trails", pattern: /\b(?:trailhead|trail head)\b/i },
  { subcategoryId: "waterfront", pattern: /\b(?:boat launch|boat ramp|marina)\b/i },
  { subcategoryId: "parks", pattern: /\b(?:picnic area|picnic shelter|day use)\b/i }
];

const AMENITY_NAME_HINTS: Array<{ subcategoryId: string; pattern: RegExp }> = [
  { subcategoryId: "campgrounds", pattern: /\bcamp(?:ing|ground)\b/i },
  { subcategoryId: "overlooks", pattern: /\b(?:scenic view|overlook)\b/i },
  { subcategoryId: "trails", pattern: /\btrailhead\b/i },
  { subcategoryId: "waterfront", pattern: /\bboat launch\b/i },
  { subcategoryId: "parks", pattern: /\b(?:picnic area|picnic shelter)\b/i },
  { subcategoryId: "parks", pattern: /\brestroom\b/i }
];

function normalizeLabel(value: string) {
  return value.trim().toLowerCase();
}

function dedupeRefinements(items: BuilderRefinement[]): BuilderRefinement[] {
  const seen = new Set<string>();
  const out: BuilderRefinement[] = [];
  for (const item of items) {
    const key = normalizeLabel(item.label);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function isNpsActivitySubcategory(subcategoryId: string | null): boolean {
  return Boolean(subcategoryId?.startsWith(NPS_ACTIVITY_REFINEMENT_PREFIX));
}

export function isNpsAmenitySubcategory(subcategoryId: string | null): boolean {
  return Boolean(subcategoryId?.startsWith(NPS_AMENITY_REFINEMENT_PREFIX));
}

export function npsActivityIdFromSubcategory(subcategoryId: string | null): string | null {
  if (!isNpsActivitySubcategory(subcategoryId)) return null;
  return subcategoryId!.slice(NPS_ACTIVITY_REFINEMENT_PREFIX.length);
}

export function npsAmenityIdFromSubcategory(subcategoryId: string | null): string | null {
  if (!isNpsAmenitySubcategory(subcategoryId)) return null;
  return subcategoryId!.slice(NPS_AMENITY_REFINEMENT_PREFIX.length);
}

export function activityRefinement(activity: { id: string; name: string }): BuilderRefinement {
  return {
    id: `${NPS_ACTIVITY_REFINEMENT_PREFIX}${activity.id}`,
    label: activity.name,
    group: "type",
    noun: activity.name.toLowerCase(),
    category: "park"
  };
}

export function amenityRefinement(amenity: { id: string; name: string }): BuilderRefinement {
  return {
    id: `${NPS_AMENITY_REFINEMENT_PREFIX}${amenity.id}`,
    label: amenity.name,
    group: "type",
    noun: amenity.name.toLowerCase(),
    category: "park"
  };
}

export async function npsDynamicExploreRefinements(category: ExploreCategory): Promise<BuilderRefinement[]> {
  if (!npsProvider.isConfigured()) return [];
  if (category !== "outdoors") return [];

  const [activities, amenities] = await Promise.all([npsProvider.listActivities(), npsProvider.listAmenities()]);

  const activityRefinements = activities
    .filter((activity) => OUTDOOR_ACTIVITY_PATTERN.test(activity.name))
    .slice(0, 12)
    .map((activity) => activityRefinement(activity));

  const amenityRefinements = amenities
    .filter((amenity) => AMENITY_NAME_HINTS.some((hint) => hint.pattern.test(amenity.name)))
    .slice(0, 8)
    .map((amenity) => amenityRefinement(amenity));

  return dedupeRefinements([...activityRefinements, ...amenityRefinements]);
}

export async function exploreRefinementsWithNps(category: ExploreCategory): Promise<BuilderRefinement[]> {
  const staticRefinements = exploreRefinementsFor(category);
  const dynamicRefinements = await npsDynamicExploreRefinements(category);
  return dedupeRefinements([...staticRefinements, ...dynamicRefinements]);
}

export function resolveAmenitySubcategoryFromQuery(query: string, subcategoryId: string | null): string | null {
  if (subcategoryId && subcategoryId !== "parks") return subcategoryId;
  const haystack = query.toLowerCase();
  for (const hint of AMENITY_SUBCATEGORY_HINTS) {
    if (hint.pattern.test(haystack)) return hint.subcategoryId;
  }
  return subcategoryId;
}

export async function resolveAmenityForSubcategory(
  subcategoryId: string | null,
  query: string
): Promise<{ id: string; name: string } | null> {
  const explicitId = npsAmenityIdFromSubcategory(subcategoryId);
  if (explicitId) {
    const amenities = await npsProvider.listAmenities();
    const match = amenities.find((item) => item.id === explicitId);
    return match ?? { id: explicitId, name: "Outdoor place" };
  }

  const resolvedSubcategory = resolveAmenitySubcategoryFromQuery(query, subcategoryId);
  if (!resolvedSubcategory) return null;

  const hint = AMENITY_NAME_HINTS.find((item) => item.subcategoryId === resolvedSubcategory);
  if (!hint) return null;

  const amenities = await npsProvider.listAmenities();
  return amenities.find((item) => hint.pattern.test(item.name)) ?? null;
}

export function stateCodeFromAddress(address: string | null | undefined): string | null {
  if (!address) return null;
  const match = address.match(/,\s*([A-Z]{2})(?:\s+\d{5}(?:-\d{4})?)?(?:,|\s*$)/);
  return match?.[1] ?? null;
}

export function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}
