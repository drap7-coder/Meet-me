import { autocompleteLocations } from "@/lib/google";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = typeof body.input === "string" ? body.input : "";
    const suggestions = await autocompleteLocations(input);
    return NextResponse.json({ suggestions });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Location autocomplete failed." },
      { status: 400 }
    );
  }
}
