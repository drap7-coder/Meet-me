import { searchPlacesNearMidpoint } from "@/lib/google";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await searchPlacesNearMidpoint({
      midpoint: body.midpoint,
      category: body.category,
      customQuery: body.customQuery,
      radiusMeters: body.radiusMeters ?? 12000
    });
    return NextResponse.json({ venues: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Places search failed." },
      { status: 400 }
    );
  }
}
