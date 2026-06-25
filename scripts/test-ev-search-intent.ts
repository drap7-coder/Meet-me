import {
  effectiveTravelModeForQuery,
  isDirectEvChargerSearch,
  isEvChargingIntent,
  placesSearchQuery,
  stripEvChargingPhrases
} from "@/lib/evSearchIntent";
import { resolveSearchCategoryFromQuery } from "@/lib/categories";
import { applyEvEnrichment, resetEvEnrichmentProvider, setEvEnrichmentProvider } from "@/lib/providers/evEnrichment";
import type { ScoredVenue } from "@/lib/types";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function run() {
  const evRestaurant = "restaurant with EV charging";
  assert(isEvChargingIntent(evRestaurant), "detects restaurant + EV charging");
  assert(stripEvChargingPhrases(evRestaurant).toLowerCase() === "restaurant", "strips charging from restaurant query");
  assert(effectiveTravelModeForQuery("auto", evRestaurant) === "ev", "auto + charging query -> ev mode");
  assert(effectiveTravelModeForQuery("drive", evRestaurant) === "ev", "drive + charging query -> ev mode");
  assert(effectiveTravelModeForQuery("walk", "coffee near me") === "walk", "non-charging query keeps mode");
  assert(isEvChargingIntent("coffee near EV"), "detects coffee near EV shorthand");
  assert(stripEvChargingPhrases("coffee near EV").toLowerCase() === "coffee", "strips near EV from coffee query");
  assert(effectiveTravelModeForQuery("auto", "coffee near EV") === "ev", "coffee near EV switches to ev mode");

  const category = resolveSearchCategoryFromQuery(evRestaurant);
  assert(category.category === "restaurant", "EV restaurant resolves to restaurant category");

  const italianEv = resolveSearchCategoryFromQuery("Italian restaurant with EV charging near me");
  assert(italianEv.category === "restaurant", "Italian EV resolves to restaurant");
  assert(Boolean(italianEv.customQuery?.toLowerCase().includes("italian")), "preserves cuisine qualifier");

  assert(placesSearchQuery("custom", evRestaurant)?.toLowerCase() === "restaurant", "places query strips charging");
  assert(
    placesSearchQuery("restaurant", evRestaurant)?.toLowerCase() === "restaurant",
    "restaurant category strips charging from customQuery"
  );
  assert(isDirectEvChargerSearch("EV chargers near me"), "detects direct charger searches");
  assert(!isDirectEvChargerSearch(evRestaurant), "destination searches are not direct charger searches");
  assert(
    placesSearchQuery("custom", "EV chargers near me")?.toLowerCase() === "ev chargers near me",
    "direct charger queries keep charger wording"
  );

  let enrichCalled = false;
  setEvEnrichmentProvider({
    id: "test",
    async enrich(venues) {
      enrichCalled = true;
      return venues;
    }
  });

  const sampleVenue = { id: "1", fairnessScore: 0.5 } as ScoredVenue;
  await applyEvEnrichment([sampleVenue], {
    travelMode: "auto",
    origin: null,
    query: evRestaurant,
    category: "restaurant"
  });
  assert(enrichCalled, "EV enrichment runs on charging intent without EV mode selected");

  resetEvEnrichmentProvider();
  console.log("PASS ev search intent");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
