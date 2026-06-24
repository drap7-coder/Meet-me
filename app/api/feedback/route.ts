import { logApiWarn } from "@/lib/serverLog";
import { NextResponse } from "next/server";

type FeedbackRequest = {
  message?: string;
  replyEmail?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FeedbackRequest;
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const replyEmail = typeof body.replyEmail === "string" ? body.replyEmail.trim() : "";

    if (message.length < 8) {
      return NextResponse.json({ error: "Please share a bit more detail." }, { status: 400 });
    }
    if (message.length > 4000) {
      return NextResponse.json({ error: "Feedback is too long." }, { status: 400 });
    }
    if (replyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyEmail)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    logApiWarn("/api/feedback", "feedback_received", {
      messageLength: message.length,
      hasReplyEmail: Boolean(replyEmail),
      destinationConfigured: Boolean(process.env.FEEDBACK_EMAIL)
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not send feedback." },
      { status: 500 }
    );
  }
}
