import { searchHalfway } from "@/lib/google";
import type { SearchHalfwayRequest } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SearchHalfwayRequest;
    if (!body.locationA?.trim() || !body.locationB?.trim()) {
      return NextResponse.json({ error: "Enter both locations." }, { status: 400 });
    }
    if (body.category === "custom" && !body.customQuery?.trim()) {
      return NextResponse.json({ error: "Enter a custom search term." }, { status: 400 });
    }

    const result = await searchHalfway(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Halfway search failed." },
      { status: 500 }
    );
  }
}
