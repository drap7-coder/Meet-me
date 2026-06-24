import type { ExecuteInput } from "../lib/koiSearchExecute";
import { readRequestLocationContext, readRequestSearchForm } from "../lib/apiLocationContext";
import { eventSearchLocationReady } from "../lib/currentLocation";
import { executeKoiSearch, resolveEventSearchForm } from "../lib/koiSearchExecute";

async function runCase(label: string, body: ExecuteInput) {
  const query = String(body.query);
  const parseContext = readRequestLocationContext(body);
  const locationContext = readRequestSearchForm(body)!;
  const eventForm = resolveEventSearchForm(query, locationContext, parseContext);
  const result = await executeKoiSearch(body);

  console.log(`\n=== ${label} ===`);
  console.log("eventForm", eventForm);
  console.log("needsLocation", !eventSearchLocationReady(eventForm));
  console.log("kind", result.kind);
  if (result.kind === "places") {
    console.log("events", result.data.events?.length ?? 0);
  } else if (result.kind === "needs_location") {
    console.log("error", result.error);
  }
}

async function main() {
  await runCase("chip: context label + coords, empty form", {
    query: "Concerts near me",
    context: {
      locationA: "Wyndmoor, PA",
      locationACoordinates: { lat: 40.0812, lng: -75.2034 }
    },
    form: {
      locationA: "",
      locationB: "",
      category: "restaurant",
      searchMode: "single",
      meetupMode: "single",
      customQuery: ""
    }
  });

  await runCase("chip: coords only", {
    query: "Concerts near me",
    context: { locationACoordinates: { lat: 40.0812, lng: -75.2034 } },
    form: {
      locationA: "",
      locationB: "",
      category: "restaurant",
      searchMode: "single",
      meetupMode: "single",
      customQuery: ""
    }
  });

  await runCase("chip: saved city label only (no coords)", {
    query: "Concerts near me",
    context: { locationA: "Wyndmoor, PA" },
    form: {
      locationA: "Wyndmoor, PA",
      locationB: "",
      category: "restaurant",
      searchMode: "single",
      meetupMode: "single",
      customQuery: ""
    }
  });
}

void main();
