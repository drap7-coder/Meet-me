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
  | "tubi";

export type StreamingServiceOption = {
  id: StreamingServiceId;
  label: string;
  queryLabel: string;
  tmdbNames: string[];
  aliases: RegExp[];
  /** TMDB watch provider id (US catalog). */
  tmdbProviderId: number;
  /** TMDB logo_path for provider artwork. */
  logoPath: string;
  /** Brand accent for selected chips and badges. */
  brandColor: string;
  /** Text color on brandColor background. */
  brandTextColor: string;
};

export const STREAMING_SERVICES: StreamingServiceOption[] = [
  {
    id: "netflix",
    label: "Netflix",
    queryLabel: "Netflix",
    tmdbNames: ["Netflix"],
    aliases: [/\bnetflix\b/i],
    tmdbProviderId: 8,
    logoPath: "/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg",
    brandColor: "#E50914",
    brandTextColor: "#FFFFFF"
  },
  {
    id: "max",
    label: "Max",
    queryLabel: "Max",
    tmdbNames: ["Max", "HBO Max"],
    aliases: [/\bmax\b/i, /\bhbo max\b/i],
    tmdbProviderId: 384,
    logoPath: "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg",
    brandColor: "#002BE7",
    brandTextColor: "#FFFFFF"
  },
  {
    id: "hulu",
    label: "Hulu",
    queryLabel: "Hulu",
    tmdbNames: ["Hulu"],
    aliases: [/\bhulu\b/i],
    tmdbProviderId: 15,
    logoPath: "/zxrVdFjIjLqkfnwyghnfywTn3Lh.jpg",
    brandColor: "#1CE783",
    brandTextColor: "#0F0F0F"
  },
  {
    id: "prime",
    label: "Prime Video",
    queryLabel: "Prime Video",
    tmdbNames: ["Prime Video", "Amazon Prime Video"],
    aliases: [/\bprime video\b/i, /\bamazon prime\b/i, /\bprime\b/i],
    tmdbProviderId: 9,
    logoPath: "/emthp39XA2YScoYL1p0sdbAH2WA.jpg",
    brandColor: "#0578FF",
    brandTextColor: "#FFFFFF"
  },
  {
    id: "apple",
    label: "Apple TV+",
    queryLabel: "Apple TV+",
    tmdbNames: ["Apple TV Plus", "Apple TV"],
    aliases: [/\bapple tv\+\b/i, /\bapple tv plus\b/i, /\bapple tv\b/i],
    tmdbProviderId: 350,
    logoPath: "/6uhKBfmtzFqOcLousHwZuzcrScK.jpg",
    brandColor: "#1D1D1F",
    brandTextColor: "#FFFFFF"
  },
  {
    id: "disney",
    label: "Disney+",
    queryLabel: "Disney+",
    tmdbNames: ["Disney Plus", "Disney+"],
    aliases: [/\bdisney\+\b/i, /\bdisney plus\b/i, /\bdisney\b/i],
    tmdbProviderId: 337,
    logoPath: "/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg",
    brandColor: "#113CCF",
    brandTextColor: "#FFFFFF"
  },
  {
    id: "peacock",
    label: "Peacock",
    queryLabel: "Peacock",
    tmdbNames: ["Peacock", "Peacock Premium", "Peacock Premium Plus"],
    aliases: [/\bpeacock\b/i],
    tmdbProviderId: 386,
    logoPath: "/8VCV78prwd9QzZnEm0ReO6bERDa.jpg",
    brandColor: "#000000",
    brandTextColor: "#FFFFFF"
  },
  {
    id: "paramount",
    label: "Paramount+",
    queryLabel: "Paramount+",
    tmdbNames: ["Paramount Plus", "Paramount+"],
    aliases: [/\bparamount\+\b/i, /\bparamount plus\b/i, /\bparamount\b/i],
    tmdbProviderId: 531,
    logoPath: "/xbhHHa1YgtpwhC8lb1NQ3ACVcLd.jpg",
    brandColor: "#0064FF",
    brandTextColor: "#FFFFFF"
  },
  {
    id: "tubi",
    label: "Tubi",
    queryLabel: "Tubi",
    tmdbNames: ["Tubi", "Tubi TV"],
    aliases: [/\btubi\b/i],
    tmdbProviderId: 73,
    logoPath: "/w2TDH9TRI7pltf5LjN3vXzs7QbN.jpg",
    brandColor: "#7400FF",
    brandTextColor: "#FFFFFF"
  }
];

const STREAMING_SERVICE_IDS = new Set(STREAMING_SERVICES.map((service) => service.id));

export function isStreamingServiceId(value: string): value is StreamingServiceId {
  return STREAMING_SERVICE_IDS.has(value as StreamingServiceId);
}

export function streamingServiceById(id: string) {
  return STREAMING_SERVICES.find((service) => service.id === id);
}

export function streamingServiceByProviderName(providerName: string) {
  if (!providerName.trim()) return undefined;

  return STREAMING_SERVICES.find((service) => providerMatchesService(providerName, service));
}

export function streamingServiceLabels(serviceIds: string[]): string[] {
  return serviceIds
    .map((id) => streamingServiceById(id)?.label)
    .filter((label): label is string => Boolean(label));
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
  return value
    .trim()
    .toLowerCase()
    .replace(/\+/g, " plus")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function providerMatchesService(providerName: string, service: StreamingServiceOption) {
  const normalizedProvider = normalizeProviderName(providerName);
  if (!normalizedProvider) return false;

  return service.tmdbNames.some((name) => {
    const normalizedService = normalizeProviderName(name);
    if (!normalizedService) return false;
    if (normalizedProvider === normalizedService) return true;
    if (normalizedProvider.includes(normalizedService)) return true;
    if (normalizedService.includes(normalizedProvider)) return true;
    return false;
  });
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
