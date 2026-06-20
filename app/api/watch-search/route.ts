import { buildWatchSearchMore, buildWatchSearchResult } from "@/lib/watchSearch";
import type { WatchSubcategory } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = typeof body.query === "string" ? body.query.trim() : "";
    if (!query) {
      return NextResponse.json({ error: "Tell Koi what you want to watch." }, { status: 400 });
    }

    const subcategory = parseSubcategory(body.subcategory);
    const excludeKeys = parseExcludeKeys(body.excludeKeys);
    if (excludeKeys.length) {
      return NextResponse.json(await buildWatchSearchMore(query, excludeKeys, subcategory));
    }

    return NextResponse.json(await buildWatchSearchResult(query, subcategory));
  } catch {
    return NextResponse.json({ error: "Watch search failed." }, { status: 400 });
  }
}

function parseSubcategory(value: unknown): WatchSubcategory | undefined {
  if (
    value === "movies" ||
    value === "tv_shows" ||
    value === "trending" ||
    value === "genres" ||
    value === "streaming"
  ) {
    return value;
  }
  return undefined;
}

function parseExcludeKeys(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((key): key is string => typeof key === "string" && /^[a-z]+:\d+$/i.test(key));
}
