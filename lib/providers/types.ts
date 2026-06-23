import type {
  GeocodedLocation,
  KoiBotMode,
  LatLng,
  PlaceSuggestion,
  SearchHalfwayRequest,
  SearchHalfwayResponse,
  WatchEventsApiResponse,
  WatchEventsResult,
  WatchSubcategory
} from "@/lib/types";
import type { SharePayload } from "@/lib/shareStore";

export type PlacesParseResponse = {
  botMode: "places";
  parsed: {
    location_a: string;
    location_b: string;
    category: string;
    search_mode: "single" | "midpoint";
  };
  form: SearchHalfwayRequest;
};

export type KoiParseResponse =
  | PlacesParseResponse
  | { botMode: "watch" }
  | { botMode: "events" };

export type ParseSearchInput = {
  query: string;
  botMode?: KoiBotMode | "watch_events";
  context?: unknown;
  form?: unknown;
};

export interface ParserProvider {
  parseSearch(input: ParseSearchInput): Promise<KoiParseResponse>;
}

export interface GooglePlacesProvider {
  geocodeAddress(input: string, placeId?: string): Promise<GeocodedLocation>;
  reverseGeocodeLocation(location: LatLng, input?: string): Promise<GeocodedLocation>;
  autocompleteLocations(input: string): Promise<PlaceSuggestion[]>;
  searchHalfway(request: SearchHalfwayRequest): Promise<SearchHalfwayResponse>;
}

export interface WatchProvider {
  search(
    query: string,
    subcategory?: WatchSubcategory,
    streamingServiceIds?: string[]
  ): Promise<WatchEventsResult>;
  more(
    query: string,
    excludeKeys: string[],
    subcategory?: WatchSubcategory,
    streamingServiceIds?: string[]
  ): Promise<Pick<WatchEventsApiResponse, "botMode"> & { append: true; recommendations: unknown[]; hasMore: boolean }>;
}

export interface EventsProvider {
  search(query: string, locationContext?: SearchHalfwayRequest): Promise<WatchEventsResult>;
}

export type WeatherProviderResult = {
  temperature: number;
  feelsLike: number;
  weatherCode: number;
  windSpeed: number;
  rainChance: number | null;
};

export interface WeatherProvider {
  getCurrentWeather(location: LatLng, signal?: AbortSignal): Promise<WeatherProviderResult>;
}

export interface StorageProvider {
  createShare(payload: SharePayload): Promise<string>;
  getShare(id: string): Promise<SharePayload | null>;
  sharePayloadToSearchRequest(payload: SharePayload): SearchHalfwayRequest;
}
