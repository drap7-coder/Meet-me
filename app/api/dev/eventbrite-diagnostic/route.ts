import { runEventbriteDiagnostic, logEventbriteDiagnostic } from "@/lib/eventbriteDiagnostics";
import { logApiError } from "@/lib/serverLog";
import { NextResponse } from "next/server";

const ENDPOINT = "/api/dev/eventbrite-diagnostic";

/** Diagnostic is available in development, or when explicitly enabled for a preview. */
function isDiagnosticEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.ENABLE_EVENTBRITE_DIAGNOSTIC === "true";
}

function parseCoordinate(value: string | null, min: number, max: number, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return fallback;
  return parsed;
}

export async function GET(request: Request) {
  if (!isDiagnosticEnabled()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  // Defaults to Manhattan so the endpoint is usable without args during local testing.
  const latitude = parseCoordinate(searchParams.get("lat"), -90, 90, 40.7128);
  const longitude = parseCoordinate(searchParams.get("lng"), -180, 180, -74.006);
  const radiusParam = Number(searchParams.get("radius"));
  const radiusMiles = Number.isFinite(radiusParam) && radiusParam > 0 ? radiusParam : undefined;

  try {
    const diagnostic = await runEventbriteDiagnostic({ latitude, longitude, radiusMiles });
    logEventbriteDiagnostic(diagnostic);
    return NextResponse.json(diagnostic, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logApiError(ENDPOINT, error);
    return NextResponse.json({ error: "Eventbrite diagnostic failed." }, { status: 500 });
  }
}
