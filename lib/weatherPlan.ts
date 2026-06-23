export type WeatherPlan = "indoor" | "outdoor" | "flexible";

type WeatherInput = {
  feelsLike: number;
  rainChance: number | null;
  windSpeed: number;
  weatherCode: number;
};

export function getWeatherPlan(weather: WeatherInput): WeatherPlan {
  const rainChance = weather.rainChance ?? 0;
  if (rainChance >= 45 || [61, 63, 65, 80, 81, 82, 95, 96, 99].includes(weather.weatherCode)) {
    return "indoor";
  }
  if (weather.feelsLike <= 50 || weather.windSpeed >= 18) return "indoor";
  if (weather.feelsLike >= 58 && weather.feelsLike <= 82 && rainChance < 25) {
    return "outdoor";
  }
  return "flexible";
}

export function weatherPlanLabel(plan: WeatherPlan): string {
  if (plan === "indoor") return "Indoor-friendly";
  if (plan === "outdoor") return "Outdoor-friendly";
  return "Flexible seating";
}
