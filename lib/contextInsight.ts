import type { LatLng } from "@/lib/types";
import { KOI_DESIGN } from "@/src/config/design";

export type ContextInsight = {
  icon: string;
  message: string;
  tone?: "default" | "watch" | "meetup";
};

type OpenMeteoCurrent = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
  };
  hourly?: {
    time?: string[];
    precipitation_probability?: number[];
  };
};

const FAIR_MEETUP_INSIGHT: ContextInsight = {
  icon: "⚖",
  message: `${KOI_DESIGN.fairMeetup.label} — ${KOI_DESIGN.fairMeetup.tagline}`,
  tone: "meetup"
};

const WATCH_INSIGHT: ContextInsight = {
  icon: "🔥",
  message: "Trending tonight — movies, shows, and streaming picks",
  tone: "watch"
};

function weatherMessage(temp: number, code: number, rainChance: number | null): ContextInsight {
  const rainy = (rainChance ?? 0) >= 40 || [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code);
  const cold = temp <= 45;
  const warm = temp >= 72 && !rainy;

  if (rainy) {
    return {
      icon: "🌧",
      message:
        rainChance && rainChance >= 50
          ? `Rain likely${temp ? ` · ${Math.round(temp)}°` : ""} — coffee shops, indoor dining, and activities`
          : "Rain arriving later — indoor spots may work better"
    };
  }
  if (cold) {
    return {
      icon: "🧥",
      message: `${Math.round(temp)}° and chilly — cafes, museums, and cozy indoor picks`
    };
  }
  if (warm) {
    return {
      icon: "☀️",
      message: `${Math.round(temp)}° — great day for patios, breweries, and outdoor meetups`
    };
  }
  return {
    icon: "☀️",
    message: temp ? `${Math.round(temp)}° — solid weather for meeting up nearby` : "Good conditions for meeting up nearby"
  };
}

export async function fetchContextInsight(coordinates?: LatLng, mode: "places" | "watch" = "places"): Promise<ContextInsight> {
  if (mode === "watch") return WATCH_INSIGHT;
  if (!coordinates) return FAIR_MEETUP_INSIGHT;

  try {
    const params = new URLSearchParams({
      latitude: String(coordinates.lat),
      longitude: String(coordinates.lng),
      current: "temperature_2m,weather_code",
      hourly: "precipitation_probability",
      temperature_unit: "fahrenheit",
      forecast_days: "1",
      timezone: "auto"
    });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!response.ok) return FAIR_MEETUP_INSIGHT;
    const data = (await response.json()) as OpenMeteoCurrent;
    const temp = data.current?.temperature_2m;
    const code = data.current?.weather_code;
    if (typeof temp !== "number" || typeof code !== "number") return FAIR_MEETUP_INSIGHT;

    const rainChance = data.hourly?.precipitation_probability?.[0] ?? null;
    return weatherMessage(temp, code, rainChance);
  } catch {
    return FAIR_MEETUP_INSIGHT;
  }
}
