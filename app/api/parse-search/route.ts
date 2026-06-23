import { ParseSearchError, parserProvider } from "@/lib/providers/parserProvider";
import { logApiError } from "@/lib/serverLog";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = typeof body.query === "string" ? body.query.trim() : "";
    if (!query) {
      return NextResponse.json({ error: "Tell Koi where you are and what kind of spot you need." }, { status: 400 });
    }

    return NextResponse.json(
      await parserProvider.parseSearch({
        query,
        botMode: body.botMode,
        context: body.context,
        form: body.form
      })
    );
  } catch (error) {
    logApiError("/api/parse-search", error);
    if (error instanceof ParseSearchError) {
      return NextResponse.json(
        {
          error: error.message,
          ...error.details
        },
        { status: error.status }
      );
    }

    const message = error instanceof Error ? error.message : "Natural language search failed.";
    const status = message.includes("Ollama") ? 500 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
