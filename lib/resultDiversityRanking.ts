import type { NormalizedExploreIntent } from "@/lib/exploreIntent";
import type { EventResult, ScoredVenue } from "@/lib/types";

export type ResultExperienceType =
  | "live_event"
  | "performing_arts"
  | "farmers_market"
  | "festival"
  | "outdoors"
  | "culture"
  | "sports"
  | "family"
  | "food_drink"
  | "generic_place"
  | "place";

type DiversifiableResult = EventResult | ScoredVenue;

export type DiversityContext<T extends DiversifiableResult> = {
  query: string;
  intent?: NormalizedExploreIntent;
  getProvider?: (result: T, index: number) => string | null | undefined;
  getScore?: (result: T, index: number) => number;
  maxRelevanceGap?: number;
};

const BROAD_TEMPORAL_DISCOVERY =
  /\b(?:things to do|fun|what should we do|what to do|what(?:'s| is) happening|plans?|ideas?|date ideas?|family things?)\b.*\b(?:this weekend|weekend|tonight|today|tomorrow|saturday|sunday|this afternoon|this evening)\b|\b(?:weekend ideas?|today ideas?|tonight ideas?)\b/i;

const SPECIFIC_SEARCH =
  /\b(?:sushi|coffee|ev chargers?|charging stations?|phillies|concerts?|live music|comedy|theat(?:er|re)|museums?|farmers? markets?)\b/i;

const EVENT_RESULT_KEYS = new Set(["title", "venue", "startTime", "source"]);

export function shouldApplyDiversityRanking(query: string, intent?: NormalizedExploreIntent | null): boolean {
  if (!intent || intent.mode !== "explore" || !intent.timeAwareExplore) return false;
  const value = query.trim();
  if (!value || SPECIFIC_SEARCH.test(value)) return false;
  return BROAD_TEMPORAL_DISCOVERY.test(value);
}

export function classifyResultExperienceType(result: DiversifiableResult): ResultExperienceType {
  const haystack = resultHaystack(result);

  if (/\b(?:farmers? market|farm market|food market|public market)\b/i.test(haystack)) return "farmers_market";
  if (/\b(?:festival|street fair|fairground|parade|community event|seasonal|pop[-\s]?up|holiday)\b/i.test(haystack)) return "festival";
  if (/\b(?:comedy|stand[-\s]?up|theat(?:er|re)|performing arts|opera|ballet|arts center)\b/i.test(haystack)) return "performing_arts";
  if (/\b(?:concert|live music|gig|jazz|rock|music hall|music venue)\b/i.test(haystack)) return "live_event";
  if (/\b(?:sports?|game|stadium|arena|ballpark|baseball|football|basketball|hockey|soccer)\b/i.test(haystack)) return "sports";
  if (/\b(?:museum|gallery|public art|historic|history|cultural|culture|landmark|monument)\b/i.test(haystack)) return "culture";
  if (/\b(?:scenic walk|waterfront|trail|greenway|park|garden|arboretum|nature|preserve|overlook|viewpoint|hiking)\b/i.test(haystack)) return "outdoors";
  if (/\b(?:family|kids|children|childrens|zoo|aquarium|playground)\b/i.test(haystack)) return "family";
  if (/\b(?:restaurant|coffee|cafe|bar|brewery|food|drink|dining)\b/i.test(haystack)) return "food_drink";
  if (/\b(?:community center|recreation center|rec center|gym|fitness|municipal building|township building|borough hall|city hall|indoor playground|play(?:\s|-)?place)\b/i.test(haystack)) {
    return "generic_place";
  }

  return isEventResult(result) ? "live_event" : "place";
}

export function diversifyExploreResults<T extends DiversifiableResult>(
  results: T[],
  context: DiversityContext<T>
): T[] {
  if (results.length < 4) return [...results];

  const maxRelevanceGap = context.maxRelevanceGap ?? 18;
  const remaining = results.map((result, index) => ({
    result,
    originalIndex: index,
    type: classifyResultExperienceType(result),
    provider: context.getProvider?.(result, index) ?? defaultProvider(result),
    score: context.getScore?.(result, index) ?? defaultScore(result, index)
  }));

  remaining.sort((left, right) => right.score - left.score || left.originalIndex - right.originalIndex);

  const selected: typeof remaining = [];

  while (remaining.length) {
    const position = selected.length;
    const bestScore = remaining[0].score;
    const candidateWindow = remaining.filter((item) => item.score >= bestScore - maxRelevanceGap);
    const next = candidateWindow.find((item) => respectsCaps(item, selected, position, candidateWindow)) ?? remaining[0];
    selected.push(next);
    remaining.splice(remaining.indexOf(next), 1);
  }

  return selected.map((item) => item.result);
}

function respectsCaps<T extends DiversifiableResult>(
  item: {
    type: ResultExperienceType;
    provider: string | null | undefined;
  },
  selected: Array<{ type: ResultExperienceType; provider: string | null | undefined }>,
  position: number,
  candidateWindow: Array<{ type: ResultExperienceType; provider: string | null | undefined }>
) {
  if (!respectsTypeCaps(item, selected, position)) return false;
  if (position < 10 && item.provider && countProvider(selected.slice(0, 9), item.provider) >= 3) {
    return !candidateWindow.some(
      (entry) =>
        entry.provider &&
        entry.provider !== item.provider &&
        respectsTypeCaps(entry, selected, position)
    );
  }
  return true;
}

function respectsTypeCaps(
  item: { type: ResultExperienceType },
  selected: Array<{ type: ResultExperienceType }>,
  position: number
) {
  if (position < 6 && countType(selected.slice(0, 5), item.type) >= 2) return false;
  if (position < 10 && countType(selected.slice(0, 9), item.type) >= 3) return false;
  return true;
}

function countType(items: Array<{ type: ResultExperienceType }>, type: ResultExperienceType) {
  return items.filter((item) => item.type === type).length;
}

function countProvider(items: Array<{ provider: string | null | undefined }>, provider: string) {
  return items.filter((item) => item.provider === provider).length;
}

function isEventResult(result: DiversifiableResult): result is EventResult {
  return [...EVENT_RESULT_KEYS].every((key) => key in result);
}

function defaultProvider(result: DiversifiableResult): string {
  if (isEventResult(result)) return result.source;
  return "places";
}

function defaultScore(result: DiversifiableResult, index: number): number {
  if (isEventResult(result)) return 100 - index;
  return result.fairnessScore;
}

function resultHaystack(result: DiversifiableResult): string {
  if (isEventResult(result)) {
    return `${result.title} ${result.category} ${result.venue} ${result.city} ${result.state} ${result.source}`;
  }

  return `${result.name} ${result.category} ${result.address} ${(result.types ?? []).join(" ")}`;
}
