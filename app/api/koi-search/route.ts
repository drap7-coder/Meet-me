import { executeKoiSearch } from "@/lib/koiSearchExecute";
import { ParseSearchError } from "@/lib/providers/parserProvider";
import { logApiError } from "@/lib/serverLog";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = typeof body.query === "string" ? body.query.trim() : "";
    if (!query) {
      return NextResponse.json({ error: "Tell Koi what you are looking for." }, { status: 400 });
    }

    const result = await executeKoiSearch(body);
    if (result.kind === "needs_location") {
      return NextResponse.json(result, { status: 422 });
    }

    return NextResponse.json(result);
  } catch (error) {
    logApiError("/api/koi-search", error);
    if (error instanceof ParseSearchError) {
      return NextResponse.json(
        {
          error: error.message,
          ...error.details
        },
        { status: error.status }
      );
    }

    const message = error instanceof Error ? error.message : "Search failed.";
    const status = message.includes("Ollama") ? 500 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
