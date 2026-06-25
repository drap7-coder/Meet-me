import { logTrendingDiagnostic, runTrendingDiagnostic } from "@/lib/trendingDiagnostic";
import { logApiError } from "@/lib/serverLog";
import { NextResponse } from "next/server";

const ENDPOINT = "/api/dev/trending-diagnostic";

/** Diagnostic is available in development, or when explicitly enabled for a preview. */
function isDiagnosticEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.ENABLE_TRENDING_DIAGNOSTIC === "true";
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
  const latitude = parseCoordinate(searchParams.get("lat"), -90, 90, 39.9526);
  const longitude = parseCoordinate(searchParams.get("lng"), -180, 180, -75.1652);

  try {
    const diagnostic = await runTrendingDiagnostic({ latitude, longitude });
    logTrendingDiagnostic(diagnostic);
    return NextResponse.json(diagnostic, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logApiError(ENDPOINT, error);
    return NextResponse.json({ error: "Trending diagnostic failed." }, { status: 500 });
  }
}
