"use client";

import type { LatLng, SearchMode } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";
import { openMeteoWeatherProvider } from "@/lib/providers/weatherProvider";
import {
  formatWeatherSummary,
  getWeatherSuggestion,
  weatherAreaTitle
} from "@/lib/weatherDisplay";
import { useEffect, useRef, useState } from "react";

type Props = {
  midpoint: LatLng;
  searchMode?: SearchMode;
};

type WeatherState =
  | { status: "loading" }
  | {
      status: "ready";
      weather: {
        temperature: number;
        feelsLike: number;
        rainChance: number | null;
        windSpeed: number;
        weatherCode: number;
      };
    }
  | { status: "unavailable" };

export function WeatherCard({ midpoint, searchMode = "midpoint" }: Props) {
  const [weatherState, setWeatherState] = useState<WeatherState>({ status: "loading" });
  const tracked = useRef(false);
  const title = weatherAreaTitle(searchMode);

  useEffect(() => {
    const controller = new AbortController();

    async function loadWeather() {
      setWeatherState({ status: "loading" });
      try {
        const weather = await openMeteoWeatherProvider.getCurrentWeather(
          { lat: midpoint.lat, lng: midpoint.lng },
          controller.signal
        );
        setWeatherState({
          status: "ready",
          weather: {
            temperature: weather.temperature,
            feelsLike: weather.feelsLike,
            rainChance: weather.rainChance,
            windSpeed: weather.windSpeed,
            weatherCode: weather.weatherCode
          }
        });
      } catch {
        if (!controller.signal.aborted) setWeatherState({ status: "unavailable" });
      }
    }

    void loadWeather();
    return () => controller.abort();
  }, [midpoint.lat, midpoint.lng]);

  useEffect(() => {
    if (weatherState.status !== "ready" || tracked.current) return;
    tracked.current = true;
    trackEvent("weather_viewed", { hasWeather: true });
  }, [weatherState]);

  return (
    <article className="rounded-lg border border-line bg-paper px-4 py-3 shadow-soft sm:px-5">
      <p className="text-xs font-bold uppercase tracking-wide text-koi">{title}</p>

      {weatherState.status === "loading" ? (
        <div className="mt-2 grid gap-2">
          <div className="h-5 w-40 animate-pulse rounded-full bg-line" />
          <div className="h-4 w-48 animate-pulse rounded-full bg-line/80" />
        </div>
      ) : null}

      {weatherState.status === "unavailable" ? (
        <p className="mt-2 text-sm leading-6 text-slate">Weather is not available right now.</p>
      ) : null}

      {weatherState.status === "ready" ? (
        <>
          <p className="mt-1.5 text-base font-semibold text-ink">{formatWeatherSummary(weatherState.weather)}</p>
          <p className="mt-1 text-sm leading-6 text-slate">
            <span className="font-semibold text-ink">Koi Suggests:</span>{" "}
            {getWeatherSuggestion(weatherState.weather)}
          </p>
        </>
      ) : null}
    </article>
  );
}
