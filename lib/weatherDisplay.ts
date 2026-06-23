import type { SearchMode } from "@/lib/types";
import { type WeatherPlan, getWeatherPlan } from "@/lib/weatherPlan";

type WeatherInput = {
  temperature: number;
  feelsLike: number;
  rainChance: number | null;
  windSpeed: number;
  weatherCode: number;
};

export function weatherAreaTitle(searchMode: SearchMode = "midpoint"): string {
  return searchMode === "single" ? "Nearby Weather" : "Midpoint Weather";
}

export function describeWeatherCondition(code: number): string {
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

export function weatherConditionEmoji(code: number): string {
  if (code === 0) return "☀️";
  if ([1, 2].includes(code)) return "🌤️";
  if ([3, 45, 48].includes(code)) return "☁️";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) return "☔";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
  return "";
}

export function koiWeatherSuggestion(plan: WeatherPlan): string {
  if (plan === "indoor") return "Indoor plans";
  if (plan === "outdoor") return "Outdoor plans";
  return "Flexible plans";
}

export function getWeatherSuggestion(weather: Omit<WeatherInput, "temperature">): string {
  return koiWeatherSuggestion(
    getWeatherPlan({
      feelsLike: weather.feelsLike,
      rainChance: weather.rainChance,
      windSpeed: weather.windSpeed,
      weatherCode: weather.weatherCode
    })
  );
}

export function formatWeatherSummary(weather: WeatherInput): string {
  const condition = describeWeatherCondition(weather.weatherCode);
  const emoji = weatherConditionEmoji(weather.weatherCode);
  return `${weather.temperature}°F · ${condition}${emoji ? ` ${emoji}` : ""}`;
}
