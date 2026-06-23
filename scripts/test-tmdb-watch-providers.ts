import { normalizeWatchProviders } from "../lib/tmdbWatchProviders";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const normalized = normalizeWatchProviders({
  results: {
    US: {
      flatrate: [
        { provider_name: "Netflix", logo_path: "/netflix.jpg" },
        { provider_name: "Max", logo_path: "/max.jpg" },
        { provider_name: "Hulu", logo_path: "/hulu.jpg" }
      ],
      rent: [{ provider_name: "Apple TV" }, { provider_name: "Apple TV" }],
      buy: [{ provider_name: "Prime Video" }]
    }
  }
});

assert(
  normalized.streaming.join(", ") === "Netflix, Max, Hulu",
  `streaming providers: ${normalized.streaming.join(", ")}`
);
assert(normalized.rent.join(", ") === "Apple TV", "dedupes rent providers");
assert(normalized.buy.join(", ") === "Prime Video", "buy providers");
assert(normalized.free.length === 0 && normalized.ads.length === 0, "empty provider groups");

const empty = normalizeWatchProviders({ results: {} });
assert(
  empty.streaming.length === 0 && empty.rent.length === 0,
  "missing region returns empty providers"
);

console.log("PASS tmdb watch providers");
