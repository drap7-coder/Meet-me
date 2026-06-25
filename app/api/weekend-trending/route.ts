import { isEventDiscoveryConfigured } from "@/lib/eventDiscovery";
import { fetchTrendingWeekendEvents } from "@/lib/weekendTrendingEvents";
import { logApiError } from "@/lib/serverLog";
import { NextResponse } from "next/server";

const ENDPOINT = "/api/weekend-trending";

function parseCoordinate(value: string | null, min: number, max: number) {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return null;
  return parsed;
}

export async function GET(request: Request) {
  const configured = isEventDiscoveryConfigured();
  const { searchParams } = new URL(request.url);
  const lat = parseCoordinate(searchParams.get("lat"), -90, 90);
  const lng = parseCoordinate(searchParams.get("lng"), -180, 180);

  if (!configured) {
    return NextResponse.json({ configured: false, events: [] });
  }

  if (lat === null || lng === null) {
    return NextResponse.json({ error: "lat and lng are required.", configured: true }, { status: 400 });
  }

  try {
    const events = await fetchTrendingWeekendEvents(lat, lng);
    return NextResponse.json(
      { configured: true, events },
      {
        headers: {
          "Cache-Control": "private, max-age=300"
        }
      }
    );
  } catch (error) {
    logApiError(ENDPOINT, error);
    return NextResponse.json({ configured: true, events: [] });
  }
}
