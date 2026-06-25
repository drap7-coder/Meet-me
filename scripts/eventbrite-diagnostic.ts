/**
 * CLI Eventbrite diagnostic.
 *
 * Prints the full auth -> sources -> raw -> date -> distance -> merged funnel.
 * Requires EVENTBRITE_API_KEY in the environment (the same token used in Vercel).
 *
 * Usage:
 *   EVENTBRITE_API_KEY=xxxx npm run diagnose:eventbrite -- --lat 40.7128 --lng -74.0060 --radius 25
 */
import { runEventbriteDiagnostic, logEventbriteDiagnostic } from "../lib/eventbriteDiagnostics";

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const latitude = Number(arg("lat") ?? "40.7128");
  const longitude = Number(arg("lng") ?? "-74.0060");
  const radiusArg = arg("radius");
  const radiusMiles = radiusArg ? Number(radiusArg) : undefined;

  const diagnostic = await runEventbriteDiagnostic({ latitude, longitude, radiusMiles });
  logEventbriteDiagnostic(diagnostic);
  console.log("\n--- full diagnostic ---");
  console.log(JSON.stringify(diagnostic, null, 2));
}

void main();
