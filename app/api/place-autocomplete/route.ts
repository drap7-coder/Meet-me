import { googlePlacesProvider } from "@/lib/providers/googlePlacesProvider";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = typeof body.input === "string" ? body.input : "";
    const suggestions = await googlePlacesProvider.autocompleteLocations(input);
    return NextResponse.json({ suggestions });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Location autocomplete failed." },
      { status: 400 }
    );
  }
}
