import { logApiError } from "@/lib/serverLog";
import { watchProvider } from "@/lib/providers/watchProvider";
import { isStreamingServiceId } from "@/lib/streamingServices";
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
    const streamingServiceIds = parseStreamingServiceIds(body.streamingServiceIds);
    const excludeKeys = parseExcludeKeys(body.excludeKeys);
    if (excludeKeys.length) {
      return NextResponse.json(await watchProvider.more(query, excludeKeys, subcategory, streamingServiceIds));
    }

    return NextResponse.json(await watchProvider.search(query, subcategory, streamingServiceIds));
  } catch (error) {
    logApiError("/api/watch-search", error);
    return NextResponse.json({ error: "Watch search failed." }, { status: 400 });
  }
}

function parseSubcategory(value: unknown): WatchSubcategory | undefined {
  if (value === "movies" || value === "tv_shows" || value === "trending") {
    return value;
  }
  return undefined;
}

function parseExcludeKeys(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((key): key is string => typeof key === "string" && /^[a-z]+:\d+$/i.test(key));
}

function parseStreamingServiceIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is string => typeof id === "string" && isStreamingServiceId(id));
}
