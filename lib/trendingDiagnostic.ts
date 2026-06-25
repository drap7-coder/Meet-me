import { isEventDiscoveryConfigured } from "@/lib/eventDiscovery";
import type { EventResult } from "@/lib/eventResult";
import { ticketmasterEventProvider } from "@/lib/providers/ticketmasterEventProvider";
import {
  classifyTrendingPickType,
  composeTrendingPicksWithReport,
  inSeasonSportIds,
  type TrendingCompositionReport,
  type TrendingPickType
} from "@/lib/trendingComposition";
import {
  dedupeEvents,
  fetchTrendingNearYouCandidateBatches,
  fetchTrendingNearYouEvents,
  finalizeTrendingEvents,
  TRENDING_NEAR_YOU_EVENT_CAP,
  withEventImages,
  WEEKEND_TRENDING_RADIUS_MILES
} from "@/lib/weekendTrendingEvents";

const SPORT_TYPES = new Set<TrendingPickType>([
  "baseball",
  "football",
  "soccer",
  "basketball",
  "hockey",
  "sports_other",
  "seasonal_special"
]);

function isSportType(type: TrendingPickType): boolean {
  return SPORT_TYPES.has(type);
}

function countByProvider(events: EventResult[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const event of events) {
    counts[event.source] = (counts[event.source] ?? 0) + 1;
  }
  return counts;
}

function countByType(events: EventResult[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const event of events) {
    const type = classifyTrendingPickType(event);
    counts[type] = (counts[type] ?? 0) + 1;
  }
  return counts;
}

function filterSports(events: EventResult[]): EventResult[] {
  return events.filter((event) => isSportType(classifyTrendingPickType(event)));
}

function sportsWithImages(events: EventResult[]): EventResult[] {
  return events.filter((event) => Boolean(event.imageUrl?.trim()));
}

function sportsPassingStrictQuality(events: EventResult[]): EventResult[] {
  return events.filter((event) => {
    const type = classifyTrendingPickType(event);
    if (!isSportType(type)) return false;
    if (type === "seasonal_special") return true;
    return Boolean(event.imageUrl?.trim());
  });
}

function summarizeSports(events: EventResult[]) {
  return events.map((event) => ({
    id: event.id,
    title: event.title,
    source: event.source,
    type: classifyTrendingPickType(event),
    hasImage: Boolean(event.imageUrl?.trim()),
    distance: event.distance ?? null
  }));
}

export type TrendingDiagnosticReport = {
  configuredProviders: {
    ticketmaster: boolean;
    eventDiscovery: boolean;
  };
  liveApiPath: "fetchTrendingNearYouEvents -> finalizeTrendingEvents -> composeTrendingPicks";
  origin: { latitude: number; longitude: number };
  radiusMiles: number;
  window: { start: string; end: string };
  inSeasonSports: string[];
  fetch: {
    sportsCount: number;
    comedyCount: number;
    musicCount: number;
    totalCandidatesFetched: number;
    sportsSample: ReturnType<typeof summarizeSports>;
  };
  candidatesByProvider: Record<string, number>;
  candidatesByType: Record<string, number>;
  sportsPipeline: {
    fetched: number;
    afterImageQualityFilter: number;
    afterStrictQualityFilter: number;
    afterDedupe: number;
    passedIntoComposeTrendingPicks: number;
    legacyImageSeedPoolWouldDrop: number;
    inFinalResult: number;
    details: ReturnType<typeof summarizeSports>;
  };
  composition: TrendingCompositionReport;
  finalCardsByType: Record<string, number>;
  finalEventTitles: string[];
  liveResultCount: number;
  notes: string[];
};

export type TrendingDiagnosticParams = {
  latitude: number;
  longitude: number;
};

export async function runTrendingDiagnostic(params: TrendingDiagnosticParams): Promise<TrendingDiagnosticReport> {
  const { latitude, longitude } = params;
  const notes: string[] = [];
  const inSeason = inSeasonSportIds(new Date(), { lat: latitude, lng: longitude });

  const { sports, comedy, music, window } = await fetchTrendingNearYouCandidateBatches(latitude, longitude);
  const rawCandidates = [...sports, ...music, ...comedy];
  const deduped = dedupeEvents(rawCandidates);
  const sportsFetched = filterSports(sports);
  const sportsDeduped = filterSports(deduped);
  const sportsWithImage = sportsWithImages(sportsDeduped);
  const sportsStrictQuality = sportsPassingStrictQuality(sportsDeduped);

  const ranked = deduped
    .map((event, index) => {
      let score = 1000 - index;
      if (event.imageUrl?.trim()) score += 14;
      if (event.ticketUrl) score += 4;
      if (event.distance != null) score += Math.max(0, 12 - event.distance);
      return { event, score };
    })
    .sort((left, right) => right.score - left.score)
    .map((entry) => entry.event);

  const sportsInRankedPool = filterSports(ranked);
  const withImages = withEventImages(ranked);
  const legacySeedPool = withImages.length >= Math.min(TRENDING_NEAR_YOU_EVENT_CAP, 3) ? withImages : ranked;
  const legacyDroppedSports = sportsInRankedPool.filter(
    (event) => !legacySeedPool.some((entry) => entry.source === event.source && entry.id === event.id)
  );

  const { picks: composedPicks, report: composition } = composeTrendingPicksWithReport(ranked, {
    latitude,
    longitude,
    cap: TRENDING_NEAR_YOU_EVENT_CAP,
    relaxedFill: true
  });

  const finalized = finalizeTrendingEvents(deduped, {
    latitude,
    longitude,
    cap: TRENDING_NEAR_YOU_EVENT_CAP
  });

  const liveResult = await fetchTrendingNearYouEvents(latitude, longitude);

  const finalByType: Record<string, number> = {};
  for (const event of finalized) {
    const type = classifyTrendingPickType(event);
    finalByType[type] = (finalByType[type] ?? 0) + 1;
  }

  if (!sportsFetched.length) {
    notes.push("Ticketmaster returned zero sports candidates for this window and radius.");
  } else if (!sportsDeduped.length) {
    notes.push("Sports candidates were fetched but none survived dedupe with other segments.");
  } else if (legacyDroppedSports.length && !sportsInRankedPool.some((event) => finalized.some((f) => f.id === event.id))) {
    notes.push(
      `Legacy image-only seed pool would have excluded ${legacyDroppedSports.length} sports candidate(s) before composition.`
    );
  }

  if (sportsDeduped.length && !filterSports(finalized).length) {
    const topReason = composition.sportsSkips[0]?.reasons[0];
    notes.push(
      topReason
        ? `Sports available but none in final feed; top skip reason: ${topReason}.`
        : "Sports available but none selected — check composition slot misses and sportsSkips."
    );
  }

  if (composedPicks.length !== finalized.length) {
    notes.push("composeTrendingPicks output count differs from finalizeTrendingEvents (relaxed backfill may apply).");
  }

  return {
    configuredProviders: {
      ticketmaster: ticketmasterEventProvider.isConfigured(),
      eventDiscovery: isEventDiscoveryConfigured()
    },
    liveApiPath: "fetchTrendingNearYouEvents -> finalizeTrendingEvents -> composeTrendingPicks",
    origin: { latitude, longitude },
    radiusMiles: WEEKEND_TRENDING_RADIUS_MILES,
    window: { start: window.start.toISOString(), end: window.end.toISOString() },
    inSeasonSports: [...inSeason],
    fetch: {
      sportsCount: sports.length,
      comedyCount: comedy.length,
      musicCount: music.length,
      totalCandidatesFetched: rawCandidates.length,
      sportsSample: summarizeSports(sportsFetched.slice(0, 12))
    },
    candidatesByProvider: countByProvider(deduped),
    candidatesByType: countByType(deduped),
    sportsPipeline: {
      fetched: sportsFetched.length,
      afterImageQualityFilter: sportsWithImage.length,
      afterStrictQualityFilter: sportsStrictQuality.length,
      afterDedupe: sportsDeduped.length,
      passedIntoComposeTrendingPicks: sportsInRankedPool.length,
      legacyImageSeedPoolWouldDrop: legacyDroppedSports.length,
      inFinalResult: filterSports(finalized).length,
      details: summarizeSports(sportsDeduped)
    },
    composition,
    finalCardsByType: finalByType,
    finalEventTitles: finalized.map((event) => event.title),
    liveResultCount: liveResult.length,
    notes
  };
}

export function logTrendingDiagnostic(report: TrendingDiagnosticReport) {
  console.info("[trending-diagnostic]", JSON.stringify(report, null, 2));
}
