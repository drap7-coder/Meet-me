import { storageProvider } from "@/lib/providers/storageProvider";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await storageProvider.getShare(id);
  if (!payload) return NextResponse.json({ error: "Meetup link not found." }, { status: 404 });
  return NextResponse.json({ payload });
}
