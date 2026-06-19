import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "Meet with Koi";
  const location = searchParams.get("location") || "";
  const description = searchParams.get("description") || "";
  const startParam = searchParams.get("start");
  const duration = Number(searchParams.get("duration") || "60");
  const filename = safeFilename(searchParams.get("filename") || "koi-meetup.ics");

  if (!startParam) {
    return NextResponse.json({ error: "Missing event start time." }, { status: 400 });
  }

  const start = new Date(startParam);
  if (Number.isNaN(start.getTime())) {
    return NextResponse.json({ error: "Invalid event start time." }, { status: 400 });
  }
  const end = new Date(start.getTime() + Math.max(15, duration) * 60 * 1000);
  const now = new Date();
  const uid = `${crypto.randomUUID()}@askkoibot.com`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Koi//Meetup Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(now)}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${escapeIcs(title)}`,
    `LOCATION:${escapeIcs(location)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}

function formatIcsDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcs(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function safeFilename(value: string) {
  const filename = value.replace(/[^a-zA-Z0-9._-]/g, "-");
  return filename.endsWith(".ics") ? filename : `${filename}.ics`;
}
