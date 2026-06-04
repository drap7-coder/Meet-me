import { computeRouteMatrix } from "@/lib/google";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const matrix = await computeRouteMatrix({
      origins: Array.isArray(body.origins) ? body.origins : [],
      destinations: Array.isArray(body.destinations) ? body.destinations : []
    });
    return NextResponse.json({ matrix });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Route matrix failed." },
      { status: 400 }
    );
  }
}
