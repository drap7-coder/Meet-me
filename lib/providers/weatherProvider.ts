import type { WeatherProvider } from "@/lib/providers/types";

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

export const openMeteoWeatherProvider: WeatherProvider = {
  async getCurrentWeather(location, signal) {
    const params = new URLSearchParams({
      latitude: String(location.lat),
      longitude: String(location.lng),
      current: "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
      hourly: "precipitation_probability",
      temperature_unit: "fahrenheit",
      wind_speed_unit: "mph",
      forecast_days: "1",
      timezone: "auto"
    });

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, { signal });
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

    return {
      temperature: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      weatherCode: current.weather_code,
      windSpeed: Math.round(current.wind_speed_10m),
      rainChance: findCurrentRainChance(data, current.time)
    };
  }
};

function findCurrentRainChance(data: OpenMeteoResponse, currentTime?: string) {
  const times = data.hourly?.time;
  const probabilities = data.hourly?.precipitation_probability;
  if (!times?.length || !probabilities?.length) return null;

  const index = currentTime ? times.indexOf(currentTime.slice(0, 13) + ":00") : 0;
  const probability = probabilities[index >= 0 ? index : 0];
  return typeof probability === "number" ? probability : null;
}
