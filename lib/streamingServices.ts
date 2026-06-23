import type { NormalizedWatchProviders } from "@/lib/types";
import { allProviderNames } from "@/lib/tmdbWatchProviders";

export type StreamingServiceId =
  | "netflix"
  | "max"
  | "hulu"
  | "prime"
  | "apple"
  | "disney"
  | "peacock"
  | "paramount"
  | "tubi"
  | "crunchyroll";

export type StreamingServiceOption = {
  id: StreamingServiceId;
  label: string;
  queryLabel: string;
  tmdbNames: string[];
  aliases: RegExp[];
};

export const STREAMING_SERVICES: StreamingServiceOption[] = [
  {
    id: "netflix",
    label: "Netflix",
    queryLabel: "Netflix",
    tmdbNames: ["Netflix"],
    aliases: [/\bnetflix\b/i]
  },
  {
    id: "max",
    label: "Max",
    queryLabel: "Max",
    tmdbNames: ["Max", "HBO Max"],
    aliases: [/\bmax\b/i, /\bhbo max\b/i]
  },
  {
    id: "hulu",
    label: "Hulu",
    queryLabel: "Hulu",
    tmdbNames: ["Hulu"],
    aliases: [/\bhulu\b/i]
  },
  {
    id: "prime",
    label: "Prime Video",
    queryLabel: "Prime Video",
    tmdbNames: ["Prime Video", "Amazon Prime Video"],
    aliases: [/\bprime video\b/i, /\bamazon prime\b/i, /\bprime\b/i]
  },
  {
    id: "apple",
    label: "Apple TV+",
    queryLabel: "Apple TV+",
    tmdbNames: ["Apple TV Plus", "Apple TV"],
    aliases: [/\bapple tv\+\b/i, /\bapple tv plus\b/i, /\bapple tv\b/i]
  },
  {
    id: "disney",
    label: "Disney+",
    queryLabel: "Disney+",
    tmdbNames: ["Disney Plus", "Disney+"],
    aliases: [/\bdisney\+\b/i, /\bdisney plus\b/i, /\bdisney\b/i]
  },
  {
    id: "peacock",
    label: "Peacock",
    queryLabel: "Peacock",
    tmdbNames: ["Peacock", "Peacock Premium"],
    aliases: [/\bpeacock\b/i]
  },
  {
    id: "paramount",
    label: "Paramount+",
    queryLabel: "Paramount+",
    tmdbNames: ["Paramount Plus", "Paramount+"],
    aliases: [/\bparamount\+\b/i, /\bparamount plus\b/i, /\bparamount\b/i]
  },
  {
    id: "tubi",
    label: "Tubi",
    queryLabel: "Tubi",
    tmdbNames: ["Tubi", "Tubi TV"],
    aliases: [/\btubi\b/i]
  },
  {
    id: "crunchyroll",
    label: "Crunchyroll",
    queryLabel: "Crunchyroll",
    tmdbNames: ["Crunchyroll"],
    aliases: [/\bcrunchyroll\b/i]
  }
];

const STREAMING_SERVICE_IDS = new Set(STREAMING_SERVICES.map((service) => service.id));

export function isStreamingServiceId(value: string): value is StreamingServiceId {
  return STREAMING_SERVICE_IDS.has(value as StreamingServiceId);
}

export function streamingServiceById(id: string) {
  return STREAMING_SERVICES.find((service) => service.id === id);
}

export function extractStreamingProviders(query: string): StreamingServiceId[] {
  const found: StreamingServiceId[] = [];

  for (const service of STREAMING_SERVICES) {
    if (service.aliases.some((pattern) => pattern.test(query))) {
      found.push(service.id);
    }
  }

  return found;
}

export function mergeStreamingServiceIds(...groups: Array<string[] | undefined>): StreamingServiceId[] {
  const merged = new Set<StreamingServiceId>();

  for (const group of groups) {
    for (const id of group ?? []) {
      if (isStreamingServiceId(id)) merged.add(id);
    }
  }

  return [...merged];
}

export function streamingServiceQueryPhrase(serviceIds: string[]): string {
  const labels = serviceIds
    .map((id) => streamingServiceById(id)?.queryLabel)
    .filter((label): label is string => Boolean(label));

  if (!labels.length) return "";
  if (labels.length === 1) return ` on ${labels[0]}`;
  return ` on ${labels.slice(0, -1).join(", ")} or ${labels[labels.length - 1]}`;
}

function normalizeProviderName(value: string) {
  return value.trim().toLowerCase();
}

function providerMatchesService(providerName: string, service: StreamingServiceOption) {
  const normalized = normalizeProviderName(providerName);
  return service.tmdbNames.some((name) => normalizeProviderName(name) === normalized);
}

export function recommendationMatchesStreamingServices(
  providers: NormalizedWatchProviders | undefined,
  serviceIds: string[]
) {
  if (!serviceIds.length) return true;
  if (!providers) return false;

  const names = allProviderNames(providers);
  if (!names.length) return false;

  const selected = serviceIds
    .map((id) => streamingServiceById(id))
    .filter((service): service is StreamingServiceOption => Boolean(service));

  return selected.some((service) => names.some((name) => providerMatchesService(name, service)));
}

export function filterRecommendationsByStreamingServices<
  T extends { watchProviders?: NormalizedWatchProviders; preview?: boolean }
>(recommendations: T[], serviceIds: string[]) {
  if (!serviceIds.length) return recommendations;
  return recommendations.filter((item) => recommendationMatchesStreamingServices(item.watchProviders, serviceIds));
}
