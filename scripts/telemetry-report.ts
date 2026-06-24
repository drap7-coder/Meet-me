import { readFileSync } from "fs";

import { formatTelemetryReport, summarizeTelemetry, type TelemetryRecord } from "@/lib/searchKillList";

/**
 * Weekly kill-list report. Reads newline-delimited JSON telemetry logs and prints
 * a readable summary. No external analytics tools — it just parses the logs the
 * app already emits via serverLog (`event: "search_telemetry"`).
 *
 * Usage:
 *   # From a saved log file (e.g. downloaded from Vercel):
 *   npx tsx scripts/telemetry-report.ts logs.txt
 *
 *   # Or pipe logs in:
 *   vercel logs <deployment> | npx tsx scripts/telemetry-report.ts
 */

function readInput(): string {
  const fileArg = process.argv[2];
  if (fileArg) return readFileSync(fileArg, "utf8");
  try {
    return readFileSync(0, "utf8"); // stdin
  } catch {
    return "";
  }
}

function parseRecords(raw: string): TelemetryRecord[] {
  const records: TelemetryRecord[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Log lines may be prefixed (timestamps, source tags); grab the JSON object.
    const start = trimmed.indexOf("{");
    if (start === -1) continue;
    try {
      const parsed = JSON.parse(trimmed.slice(start)) as TelemetryRecord;
      if (parsed && parsed.event === "search_telemetry") records.push(parsed);
    } catch {
      // Skip non-JSON / partial lines.
    }
  }
  return records;
}

function main() {
  const raw = readInput();
  if (!raw.trim()) {
    console.error(
      "No input. Pass a log file path or pipe logs in:\n  npx tsx scripts/telemetry-report.ts logs.txt\n  vercel logs <deployment> | npx tsx scripts/telemetry-report.ts"
    );
    process.exit(1);
  }

  const records = parseRecords(raw);
  if (records.length === 0) {
    console.error('No "search_telemetry" records found in input.');
    process.exit(1);
  }

  const report = summarizeTelemetry(records);
  console.log(formatTelemetryReport(report));
}

main();
