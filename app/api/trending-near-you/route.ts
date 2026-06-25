import { fetchTrendingNearYou, isTrendingNearYouConfigured } from "@/lib/trendingNearYou";
import { logApiError } from "@/lib/serverLog";
import { NextResponse } from "next/server";

const ENDPOINT = "/api/trending-near-you";

function parseCoordinate(value: string | null, min: number, max: number) {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return null;
  return parsed;
}

export async function GET(request: Request) {
  const configured = isTrendingNearYouConfigured();
  const { searchParams } = new URL(request.url);
  const lat = parseCoordinate(searchParams.get("lat"), -90, 90);
  const lng = parseCoordinate(searchParams.get("lng"), -180, 180);

  if (lat === null || lng === null) {
    return NextResponse.json({ configured, cards: [] });
  }

  try {
    const cards = await fetchTrendingNearYou(lat, lng);
    return NextResponse.json(
      { configured: true, cards },
      { headers: { "Cache-Control": "private, max-age=300" } }
    );
  } catch (error) {
    logApiError(ENDPOINT, error);
    return NextResponse.json({ configured, cards: [] });
  }
}
