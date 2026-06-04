import { geocodeAddress } from "@/lib/google";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const address = typeof body.address === "string" ? body.address : "";
    const result = await geocodeAddress(address);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Geocoding failed." },
      { status: 400 }
    );
  }
}
