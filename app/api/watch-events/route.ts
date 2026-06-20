import { buildWatchEventsResult } from "@/lib/watchEvents";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = typeof body.query === "string" ? body.query.trim() : "";
    if (!query) {
      return NextResponse.json({ error: "Tell Koi what you want to watch or find." }, { status: 400 });
    }

    return NextResponse.json(buildWatchEventsResult(query));
  } catch {
    return NextResponse.json({ error: "Watch & Events search failed." }, { status: 400 });
  }
}
