import { buildStreamQuery } from "../app/components/SearchPromptAssist";
import { groupProvidersForDisplay, hasGroupedWatchProviders, normalizeWatchProviders } from "../lib/tmdbWatchProviders";
import {
  extractStreamingProviders,
  filterRecommendationsByStreamingServices,
  mergeStreamingServiceIds,
  recommendationMatchesStreamingServices,
  streamingServiceByProviderName,
  streamingServiceQueryPhrase,
  STREAMING_SERVICES
} from "../lib/streamingServices";
import { tmdbLogoUrl } from "../lib/tmdb";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const normalized = normalizeWatchProviders({
  results: {
    US: {
      flatrate: [{ provider_name: "Netflix" }],
      free: [{ provider_name: "Tubi" }],
      ads: [{ provider_name: "Pluto TV" }],
      rent: [{ provider_name: "Apple TV" }],
      buy: [{ provider_name: "Prime Video" }]
    }
  }
});

assert(normalized.streaming[0] === "Netflix", "keeps flatrate in streaming bucket");
assert(normalized.free[0] === "Tubi", "keeps free bucket");

const grouped = groupProvidersForDisplay(normalized);
assert(grouped.availableOn.join(", ") === "Netflix, Tubi, Pluto TV", "groups available on providers");
assert(grouped.rentOrBuy.join(", ") === "Apple TV, Prime Video", "groups rent or buy providers");
assert(hasGroupedWatchProviders(grouped), "grouped providers are present");

const emptyGrouped = groupProvidersForDisplay({
  streaming: [],
  free: [],
  ads: [],
  rent: [],
  buy: []
});
assert(!hasGroupedWatchProviders(emptyGrouped), "empty grouped providers");

assert(extractStreamingProviders("sci-fi on Netflix tonight").join(",") === "netflix", "parses Netflix");
assert(extractStreamingProviders("watch on HBO Max or Hulu").join(",") === "max,hulu", "parses Max and Hulu");
assert(extractStreamingProviders("Prime Video picks tonight").join(",") === "prime", "parses Prime Video");

const merged = mergeStreamingServiceIds(["netflix"], ["max"], extractStreamingProviders("on Hulu tonight"));
assert(merged.join(",") === "netflix,max,hulu", "merges chip and parsed providers");

assert(
  streamingServiceQueryPhrase(["netflix"]) === " on Netflix",
  "builds single provider phrase"
);
assert(
  streamingServiceQueryPhrase(["netflix", "max"]) === " on Netflix or Max",
  "builds multi-provider phrase"
);

const providers = {
  streaming: ["Netflix"],
  free: [],
  ads: [],
  rent: ["Apple TV"],
  buy: []
};

assert(recommendationMatchesStreamingServices(providers, ["netflix"]), "matches Netflix on flatrate");
assert(recommendationMatchesStreamingServices(providers, ["apple"]), "matches Apple TV on rent");
assert(!recommendationMatchesStreamingServices(providers, ["hulu"]), "does not match missing provider");

const recommendations = [
  { id: "a", watchProviders: providers },
  {
    id: "b",
    watchProviders: {
      streaming: ["Hulu"],
      free: [],
      ads: [],
      rent: [],
      buy: []
    }
  }
];

const filtered = filterRecommendationsByStreamingServices(recommendations, ["netflix", "hulu"]);
assert(filtered.map((item) => item.id).join(",") === "a,b", "filters with OR logic");

const streamQuery = buildStreamQuery({
  selectedMode: "streaming",
  localWhat: null,
  typeId: null,
  extras: new Set<string>(),
  when: null,
  where: "near",
  streamingType: "movies",
  streamingVibe: null,
  genre: "comedy",
  streamingServices: new Set(["netflix", "max"])
});

assert(
  streamQuery === "What comedy movie should I watch on Netflix or Max tonight?",
  `stream query includes providers: ${streamQuery}`
);

for (const service of STREAMING_SERVICES) {
  assert(Boolean(service.brandColor), `${service.id} has brand color`);
  assert(Boolean(service.logoPath), `${service.id} has logo path`);
  assert(tmdbLogoUrl(service.logoPath).includes("image.tmdb.org"), `${service.id} builds logo url`);
}

assert(streamingServiceByProviderName("Netflix")?.id === "netflix", "looks up Netflix branding");
assert(streamingServiceByProviderName("HBO Max")?.id === "max", "looks up Max branding");
assert(streamingServiceByProviderName("Amazon Prime Video")?.id === "prime", "looks up Prime branding");
assert(streamingServiceByProviderName("Netflix Standard with Ads")?.id === "netflix", "matches Netflix variants");
assert(streamingServiceByProviderName("Peacock Premium Plus")?.id === "peacock", "matches Peacock variants");
assert(
  recommendationMatchesStreamingServices(
    {
      streaming: ["Netflix Standard with Ads"],
      free: [],
      ads: [],
      rent: [],
      buy: []
    },
    ["netflix"]
  ),
  "matches fuzzy Netflix provider names"
);

console.log("PASS streaming provider refinement");
