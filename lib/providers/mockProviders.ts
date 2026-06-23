import type {
  EventsProvider,
  GooglePlacesProvider,
  ParserProvider,
  StorageProvider,
  WatchProvider,
  WeatherProvider
} from "@/lib/providers/types";

export function createMockParserProvider(overrides: Partial<ParserProvider> = {}): ParserProvider {
  return {
    async parseSearch() {
      return { botMode: "watch" };
    },
    ...overrides
  };
}

export function createMockWatchProvider(overrides: Partial<WatchProvider> = {}): Partial<WatchProvider> {
  return overrides;
}

export function createMockEventsProvider(overrides: Partial<EventsProvider> = {}): Partial<EventsProvider> {
  return overrides;
}

export function createMockGooglePlacesProvider(
  overrides: Partial<GooglePlacesProvider> = {}
): Partial<GooglePlacesProvider> {
  return overrides;
}

export function createMockWeatherProvider(overrides: Partial<WeatherProvider> = {}): Partial<WeatherProvider> {
  return overrides;
}

export function createMockStorageProvider(overrides: Partial<StorageProvider> = {}): Partial<StorageProvider> {
  return overrides;
}
