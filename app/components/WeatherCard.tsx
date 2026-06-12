"use client";

import type { LatLng } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  midpoint: LatLng;
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

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    time?: string;
  };
  hourly?: {
    time?: string[];
    precipitation_probability?: number[];
  };
};

export function WeatherCard({ midpoint }: Props) {
  const [weatherState, setWeatherState] = useState<WeatherState>({ status: "loading" });
  const tracked = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadWeather() {
      setWeatherState({ status: "loading" });
      try {
        const params = new URLSearchParams({
          latitude: String(midpoint.lat),
          longitude: String(midpoint.lng),
          current: "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
          hourly: "precipitation_probability",
          temperature_unit: "fahrenheit",
          wind_speed_unit: "mph",
          forecast_days: "1",
          timezone: "auto"
        });

        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
          signal: controller.signal
        });
        if (!response.ok) throw new Error("Weather unavailable.");

        const data = (await response.json()) as OpenMeteoResponse;
        const current = data.current;
        if (
          typeof current?.temperature_2m !== "number" ||
          typeof current.apparent_temperature !== "number" ||
          typeof current.weather_code !== "number" ||
          typeof current.wind_speed_10m !== "number"
        ) {
          throw new Error("Weather unavailable.");
        }

        setWeatherState({
          status: "ready",
          weather: {
            temperature: Math.round(current.temperature_2m),
            feelsLike: Math.round(current.apparent_temperature),
            condition: describeWeather(current.weather_code),
            rainChance: findCurrentRainChance(data, current.time),
            windSpeed: Math.round(current.wind_speed_10m),
            weatherCode: current.weather_code
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
    return getWeatherRecommendation(weatherState.weather);
  }, [weatherState]);

  useEffect(() => {
    if (weatherState.status !== "ready" || tracked.current) return;
    tracked.current = true;
    trackEvent("weather_viewed", { hasWeather: true });
  }, [weatherState]);

  return (
    <article className="rounded-lg border border-line bg-paper p-5 shadow-soft sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-clay">Midpoint weather</p>
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
          Weather is not available right now, but your halfway search is still ready to use.
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
            <WeatherMetric label="Plan" value={shortPlanLabel(weatherState.weather)} />
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

function findCurrentRainChance(data: OpenMeteoResponse, currentTime?: string) {
  const times = data.hourly?.time;
  const probabilities = data.hourly?.precipitation_probability;
  if (!times?.length || !probabilities?.length) return null;

  const index = currentTime ? times.indexOf(currentTime.slice(0, 13) + ":00") : 0;
  const probability = probabilities[index >= 0 ? index : 0];
  return typeof probability === "number" ? probability : null;
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

function getWeatherRecommendation(weather: WeatherSummary) {
  const rainChance = weather.rainChance ?? 0;
  if (rainChance >= 45 || [61, 63, 65, 80, 81, 82, 95, 96, 99].includes(weather.weatherCode)) {
    return "Indoor plans look smarter at your halfway point.";
  }
  if (weather.feelsLike <= 50 || weather.windSpeed >= 18) return "A cozy indoor spot may be better at your halfway point.";
  if (weather.feelsLike >= 58 && weather.feelsLike <= 82 && rainChance < 25) {
    return "Perfect patio weather at your halfway point.";
  }
  return "Good to know before you pick the final halfway spot.";
}

function shortPlanLabel(weather: WeatherSummary) {
  const recommendation = getWeatherRecommendation(weather);
  if (recommendation.includes("outdoor")) return "Outside";
  if (recommendation.includes("jacket")) return "Layer";
  return "Indoors";
}

function formatRainChance(value: number | null) {
  return typeof value === "number" ? `${value}%` : "N/A";
}
