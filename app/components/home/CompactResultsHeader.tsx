"use client";

import { trackEvent } from "@/lib/analytics";
import { buildKoiPickDecisionChips, getKoiPickReasonLine } from "@/lib/koiPickDecision";
import { getSearchAccent } from "@/lib/searchAccent";
import { openMeteoWeatherProvider } from "@/lib/providers/weatherProvider";
import { getWeatherPlan } from "@/lib/weatherPlan";
import type { LatLng, ScoredVenue, SearchMode, VenueCategory, WatchEventsRecommendation } from "@/lib/types";
import { useEffect, useState } from "react";

type Props = {
  loading: boolean;
  loadingLabel?: string;
  searchKind?: "places" | "watch" | "events" | null;
  topVenue?: ScoredVenue | null;
  searchMode?: SearchMode;
  searchCategory?: VenueCategory;
  weatherPoint?: LatLng | null;
  topRecommendation?: WatchEventsRecommendation | null;
  canShare: boolean;
  onShare: () => void;
  onNewSearch: () => void;
};

export function CompactResultsHeader({
  loading,
  loadingLabel = "Finding places",
  searchKind = null,
  topVenue = null,
  searchMode = "single",
  searchCategory = "restaurant",
  weatherPoint = null,
  topRecommendation = null,
  canShare,
  onShare,
  onNewSearch
}: Props) {
  const accent = getSearchAccent(searchKind);

  if (loading) {
    return (
      <section className="pt-4">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.06] px-4 py-4 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:px-5">
          <p className="text-sm font-bold text-white">{loadingLabel}</p>
        </div>
      </section>
    );
  }

  if (searchKind === "places" && topVenue) {
    return (
      <PlacesDecisionHero
        venue={topVenue}
        searchMode={searchMode}
        searchCategory={searchCategory}
        weatherPoint={weatherPoint}
        accent={accent}
        canShare={canShare}
        onShare={onShare}
        onNewSearch={onNewSearch}
      />
    );
  }

  if ((searchKind === "watch" || searchKind === "events") && topRecommendation) {
    return (
      <WatchDecisionHero
        item={topRecommendation}
        accent={accent}
        canShare={canShare}
        onShare={onShare}
        onNewSearch={onNewSearch}
      />
    );
  }

  return null;
}

function PlacesDecisionHero({
  venue,
  searchMode,
  searchCategory,
  weatherPoint,
  accent,
  canShare,
  onShare,
  onNewSearch
}: {
  venue: ScoredVenue;
  searchMode: SearchMode;
  searchCategory: VenueCategory;
  weatherPoint: LatLng | null;
  accent: ReturnType<typeof getSearchAccent>;
  canShare: boolean;
  onShare: () => void;
  onNewSearch: () => void;
}) {
  const [weatherPlan, setWeatherPlan] = useState<ReturnType<typeof getWeatherPlan> | null>(null);

  useEffect(() => {
    if (!weatherPoint) return;
    const controller = new AbortController();
    void openMeteoWeatherProvider
      .getCurrentWeather(weatherPoint, controller.signal)
      .then((weather) => {
        setWeatherPlan(
          getWeatherPlan({
            feelsLike: weather.feelsLike,
            rainChance: weather.rainChance,
            windSpeed: weather.windSpeed,
            weatherCode: weather.weatherCode
          })
        );
      })
      .catch(() => {});
    return () => controller.abort();
  }, [weatherPoint?.lat, weatherPoint?.lng]);

  const reason = getKoiPickReasonLine(searchMode, searchCategory);
  const chips = buildKoiPickDecisionChips({ venue, searchMode, weatherPlan });

  function handleDirectionsClick() {
    trackEvent("directions_clicked", {
      category: venue.category,
      placeType: venue.types?.[0] ?? venue.category
    });
    trackEvent("place_selected", {
      category: venue.category,
      placeType: venue.types?.[0] ?? venue.category
    });
  }

  return (
    <section className="pt-4">
      <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.07] px-4 py-5 text-white shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:px-6 sm:py-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(255,90,0,0.18),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_42%)]" />
        <div className="relative z-10">
        <p className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-koi">
          <span aria-hidden="true">🏆</span>
          Koi Pick
        </p>
        <h1 className="mt-2 max-w-3xl text-3xl font-black leading-[0.98] tracking-tight text-white sm:text-5xl">{venue.name}</h1>
        <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/68 sm:text-base sm:leading-7">{reason}</p>

        {chips.length ? (
          <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-white/88">{chips.join(" · ")}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={venue.googleMapsUri}
            target="_blank"
            rel="noreferrer"
            onClick={handleDirectionsClick}
            className={`inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-black text-white transition focus:outline-none focus:ring-4 ${accent.btnPrimary}`}
          >
            Get directions
          </a>
          {canShare ? (
            <button
              type="button"
              onClick={onShare}
              className="inline-flex h-10 items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-white/20"
            >
              Share meetup
            </button>
          ) : null}
          <button
            type="button"
            onClick={onNewSearch}
            className="inline-flex h-10 items-center justify-center rounded-full px-3 text-sm font-semibold text-white/70 transition hover:text-white"
          >
            New search
          </button>
        </div>
        </div>
      </div>
    </section>
  );
}

function WatchDecisionHero({
  item,
  accent,
  canShare,
  onShare,
  onNewSearch
}: {
  item: WatchEventsRecommendation;
  accent: ReturnType<typeof getSearchAccent>;
  canShare: boolean;
  onShare: () => void;
  onNewSearch: () => void;
}) {
  const chips = item.tags.slice(0, 4);

  return (
    <section className="pt-4">
      <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.07] px-4 py-5 text-white shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:px-6 sm:py-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(10,132,255,0.18),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_42%)]" />
        <div className="relative z-10">
        <p className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] ${accent.text}`}>
          <span aria-hidden="true">🏆</span>
          Koi Pick
        </p>
        <h1 className="mt-2 max-w-3xl text-3xl font-black leading-[0.98] tracking-tight text-white sm:text-5xl">{item.title}</h1>
        <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/68 sm:text-base sm:leading-7">{item.explanation}</p>
        {chips.length ? (
          <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-white/88">{chips.join(" · ")}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {item.actionUrl ? (
            <a
              href={item.actionUrl}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-black text-white transition focus:outline-none focus:ring-4 ${accent.btnPrimary}`}
            >
              {item.actionLabel}
            </a>
          ) : null}
          {canShare ? (
            <button
              type="button"
              onClick={onShare}
              className="inline-flex h-10 items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-white/20"
            >
              Share meetup
            </button>
          ) : null}
          <button
            type="button"
            onClick={onNewSearch}
            className="inline-flex h-10 items-center justify-center rounded-full px-3 text-sm font-semibold text-white/70 transition hover:text-white"
          >
            New search
          </button>
        </div>
        </div>
      </div>
    </section>
  );
}
