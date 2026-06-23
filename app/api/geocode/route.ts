import { googlePlacesProvider } from "@/lib/providers/googlePlacesProvider";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const lat = typeof body.lat === "number" ? body.lat : Number.NaN;
    const lng = typeof body.lng === "number" ? body.lng : Number.NaN;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const result = await googlePlacesProvider.reverseGeocodeLocation({ lat, lng });
      return NextResponse.json(result);
    }

    const address = typeof body.address === "string" ? body.address : "";
    const result = await googlePlacesProvider.geocodeAddress(address);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Geocoding failed." },
      { status: 400 }
    );
  }
}
