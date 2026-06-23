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
        <div className="rounded-lg border border-line bg-paper px-4 py-4 shadow-soft sm:px-5">
          <p className={`text-sm font-bold ${accent.text}`}>{loadingLabel}</p>
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
      <div className="rounded-lg border border-line bg-paper px-4 py-4 shadow-soft sm:px-5 sm:py-5">
        <p className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-koi">
          <span aria-hidden="true">🏆</span>
          Koi Pick
        </p>
        <h1 className="mt-2 text-2xl font-black leading-tight tracking-tight text-ink sm:text-3xl">{venue.name}</h1>
        <p className="mt-1.5 text-sm font-medium leading-6 text-slate">{reason}</p>

        {chips.length ? (
          <p className="mt-3 text-sm font-semibold leading-6 text-ink">{chips.join(" · ")}</p>
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
              className={`inline-flex h-10 items-center justify-center rounded-full border bg-paper px-4 text-sm font-bold transition focus:outline-none focus:ring-4 ${accent.borderOutline} ${accent.text} hover:bg-mint`}
            >
              Share meetup
            </button>
          ) : null}
          <button
            type="button"
            onClick={onNewSearch}
            className="inline-flex h-10 items-center justify-center rounded-full px-3 text-sm font-semibold text-slate transition hover:text-ink"
          >
            New search
          </button>
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
      <div className="rounded-lg border border-line bg-paper px-4 py-4 shadow-soft sm:px-5 sm:py-5">
        <p className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] ${accent.text}`}>
          <span aria-hidden="true">🏆</span>
          Koi Pick
        </p>
        <h1 className="mt-2 text-2xl font-black leading-tight tracking-tight text-ink sm:text-3xl">{item.title}</h1>
        <p className="mt-1.5 text-sm font-medium leading-6 text-slate">{item.explanation}</p>
        {chips.length ? (
          <p className="mt-3 text-sm font-semibold leading-6 text-ink">{chips.join(" · ")}</p>
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
              className={`inline-flex h-10 items-center justify-center rounded-full border bg-paper px-4 text-sm font-bold transition focus:outline-none focus:ring-4 ${accent.borderOutline} ${accent.text} hover:bg-mint`}
            >
              Share meetup
            </button>
          ) : null}
          <button
            type="button"
            onClick={onNewSearch}
            className="inline-flex h-10 items-center justify-center rounded-full px-3 text-sm font-semibold text-slate transition hover:text-ink"
          >
            New search
          </button>
        </div>
      </div>
    </section>
  );
}
