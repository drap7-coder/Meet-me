"use client";

import type { LatLng } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";
import { openMeteoWeatherProvider } from "@/lib/providers/weatherProvider";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  midpoint: LatLng;
  searchMode?: "single" | "midpoint";
};

type WeatherState =
  | { status: "loading" }
  | { status: "ready"; weather: WeatherSummary }
  | { status: "unavailable" };

type WeatherSummary = {
  temperature: number;
  feelsLike: number;
  condition: string;
  rainChance: number | null;
  windSpeed: number;
  weatherCode: number;
};

export function WeatherCard({ midpoint, searchMode = "midpoint" }: Props) {
  const [weatherState, setWeatherState] = useState<WeatherState>({ status: "loading" });
  const tracked = useRef(false);
  const areaLabel = searchMode === "single" ? "nearby" : "near the midpoint";

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
            condition: describeWeather(weather.weatherCode),
            rainChance: weather.rainChance,
            windSpeed: weather.windSpeed,
            weatherCode: weather.weatherCode
          }
        });
      } catch (error) {
        if (!controller.signal.aborted) setWeatherState({ status: "unavailable" });
      }
    }

    loadWeather();
    return () => controller.abort();
  }, [midpoint.lat, midpoint.lng]);

  const recommendation = useMemo(() => {
    if (weatherState.status !== "ready") return null;
    return getWeatherRecommendation(weatherState.weather, areaLabel);
  }, [areaLabel, weatherState]);

  useEffect(() => {
    if (weatherState.status !== "ready" || tracked.current) return;
    tracked.current = true;
    trackEvent("weather_viewed", { hasWeather: true });
  }, [weatherState]);

  return (
    <article className="rounded-lg border border-line bg-paper p-5 shadow-soft sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-koi">
            {searchMode === "single" ? "Nearby weather" : "Midpoint weather"}
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-ink">
            {weatherState.status === "ready" ? `${weatherState.weather.temperature}°F` : "Checking the forecast"}
          </h2>
        </div>
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sky text-xl" aria-hidden="true">
          {weatherState.status === "ready" ? weatherIcon(weatherState.weather.weatherCode) : "•"}
        </div>
      </div>

      {weatherState.status === "loading" ? (
        <div className="mt-5 grid gap-3">
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-line" />
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-16 animate-pulse rounded-lg bg-sky" />
            ))}
          </div>
        </div>
      ) : null}

      {weatherState.status === "unavailable" ? (
        <p className="mt-4 text-sm leading-6 text-slate">
          Weather is not available right now, but your Koi search is still ready to use.
        </p>
      ) : null}

      {weatherState.status === "ready" ? (
        <>
          <p className="mt-2 text-base font-semibold text-slate">{weatherState.weather.condition}</p>
          {recommendation ? <p className="mt-4 text-sm font-semibold leading-6 text-ink">{recommendation}</p> : null}

          <div className="mt-5 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <WeatherMetric label="Feels like" value={`${weatherState.weather.feelsLike}°F`} />
            <WeatherMetric label="Rain" value={formatRainChance(weatherState.weather.rainChance)} />
            <WeatherMetric label="Wind" value={`${weatherState.weather.windSpeed} mph`} />
            <WeatherMetric label="Plan" value={shortPlanLabel(weatherState.weather, areaLabel)} />
          </div>
        </>
      ) : null}
    </article>
  );
}

function WeatherMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-sky px-3 py-2.5">
      <div className="text-xs font-bold uppercase text-slate">{label}</div>
      <div className="mt-1 font-bold text-ink">{value}</div>
    </div>
  );
}

function describeWeather(code: number) {
  if (code === 0) return "Clear";
  if ([1, 2].includes(code)) return "Mostly clear";
  if (code === 3) return "Cloudy";
  if ([45, 48].includes(code)) return "Foggy";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Storms nearby";
  return "Mild";
}

function weatherIcon(code: number) {
  if (code === 0) return "☀";
  if ([1, 2].includes(code)) return "◐";
  if ([3, 45, 48].includes(code)) return "☁";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) return "☂";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄";
  return "•";
}

function getWeatherRecommendation(weather: WeatherSummary, areaLabel = "near the midpoint") {
  const rainChance = weather.rainChance ?? 0;
  if (rainChance >= 45 || [61, 63, 65, 80, 81, 82, 95, 96, 99].includes(weather.weatherCode)) {
    return `Indoor plans look smarter ${areaLabel}.`;
  }
  if (weather.feelsLike <= 50 || weather.windSpeed >= 18) return `A cozy indoor spot may be better ${areaLabel}.`;
  if (weather.feelsLike >= 58 && weather.feelsLike <= 82 && rainChance < 25) {
    return `Perfect patio weather ${areaLabel}.`;
  }
  return "Good to know before you pick the final meeting spot.";
}

function shortPlanLabel(weather: WeatherSummary, areaLabel = "near the midpoint") {
  const rainChance = weather.rainChance ?? 0;
  if (rainChance >= 45 || [61, 63, 65, 80, 81, 82, 95, 96, 99].includes(weather.weatherCode)) {
    return "Indoors";
  }
  if (weather.feelsLike <= 50 || weather.windSpeed >= 18) return "Layer";
  if (weather.feelsLike >= 58 && weather.feelsLike <= 82 && rainChance < 25) {
    return "Outside";
  }
  if (getWeatherRecommendation(weather, areaLabel).includes("Indoor")) return "Indoors";
  return "Flexible";
}

function formatRainChance(value: number | null) {
  return typeof value === "number" ? `${value}%` : "N/A";
}
