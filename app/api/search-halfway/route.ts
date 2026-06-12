import { searchHalfway } from "@/lib/google";
import { normalizeCategory } from "@/lib/categories";
import type { SearchHalfwayRequest } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SearchHalfwayRequest;
    const searchMode = body.searchMode ?? "midpoint";
    if (!body.locationA?.trim()) {
      return NextResponse.json({ error: searchMode === "single" ? "Enter a location." : "Enter both locations." }, { status: 400 });
    }
    if (searchMode === "midpoint" && !body.locationB?.trim()) {
      return NextResponse.json({ error: "Enter both locations." }, { status: 400 });
    }
    if (body.category === "custom" && !body.customQuery?.trim()) {
      return NextResponse.json({ error: "Enter a custom search term." }, { status: 400 });
    }

    const result = await searchHalfway({ ...body, category: normalizeCategory(body.category) });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Halfway search failed." },
      { status: 500 }
    );
  }
}
