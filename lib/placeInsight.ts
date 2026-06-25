import { getPlaceSummary } from "@/lib/providers/wikipediaProvider";
import type { PlaceInsight, ScoredVenue } from "@/lib/types";

/**
 * "Why is this place interesting?" enrichment.
 *
 * Detects curiosity intent in the user's query and, when present, attaches a
 * short Wikipedia blurb to the top venue. Keyless (Wikipedia needs no API key)
 * and feature-safe: no curiosity intent → no network call; any failure leaves
 * results unchanged.
 */

const MAX_BLURB_CHARS = 220;

const CURIOSITY_PATTERNS: RegExp[] = [
  /\bwhy\b[^?]*\b(interesting|worth|special|cool|famous|notable|go|visit|see|check out)\b/i,
  /\bwhat'?s\s+(?:so\s+)?(interesting|special|cool|notable|famous)\b/i,
  /\bwhat\s+makes\b/i,
  /\btell me about\b/i,
  /\bwhat\s+is\b/i,
  /\bhistory of\b/i,
  /\b(interesting|notable|famous)\s+(about|history)\b/i,
  /\bwhat to know about\b/i,
  /\bwhat'?s the (?:deal|story)\b/i
];

export function isPlaceCuriosityQuery(query: string | null | undefined): boolean {
  const value = query?.trim();
  if (!value) return false;
  return CURIOSITY_PATTERNS.some((pattern) => pattern.test(value));
}

export type PlaceInsightContext = {
  /** Raw natural-language query used for curiosity-intent detection. */
  query: string;
};

/**
 * Attach a Wikipedia blurb to the top venue when the query reads like a
 * curiosity question. Only the #1 result is enriched to keep this to a single
 * extra lookup. Returns the input array unchanged otherwise.
 */
export async function applyPlaceInsight(
  venues: ScoredVenue[],
  context: PlaceInsightContext
): Promise<ScoredVenue[]> {
  if (!venues.length) return venues;
  if (!isPlaceCuriosityQuery(context.query)) return venues;

  const top = venues[0];
  const summary = await getPlaceSummary({
    name: top.name,
    locality: localityFromAddress(top.address)
  });
  if (!summary) return venues;

  const insight: PlaceInsight = {
    blurb: shortenBlurb(summary.extract),
    title: summary.title,
    url: summary.url,
    thumbnailUrl: summary.thumbnailUrl,
    source: "wikipedia"
  };

  return [{ ...top, insight }, ...venues.slice(1)];
}

/** Pull the locality (usually the city) out of a formatted address. */
function localityFromAddress(address: string): string | undefined {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  // [street, city, "ST 19119", country] → prefer the city segment.
  return parts.length >= 2 ? parts[1] : undefined;
}

function shortenBlurb(text: string, maxChars = MAX_BLURB_CHARS): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;

  const slice = trimmed.slice(0, maxChars);
  const lastStop = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("! "), slice.lastIndexOf("? "));
  if (lastStop > 80) return slice.slice(0, lastStop + 1).trim();
  return `${slice.trimEnd()}…`;
}
