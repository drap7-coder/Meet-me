export type SearchTelemetryKind = "places" | "watch" | "events" | "freeform";

export type ProviderCallRecord = {
  provider: string;
  operation: string;
};

export type CacheLayerStats = {
  hits: number;
  misses: number;
};

export class SearchTelemetryCollector {
  llmUsed = false;
  private calls: ProviderCallRecord[] = [];
  private cache: Record<string, CacheLayerStats> = {};

  recordProviderCall(provider: string, operation: string) {
    this.calls.push({ provider, operation });
  }

  recordLlmUsed(provider: string, operation = "parse") {
    this.llmUsed = true;
    this.recordProviderCall(provider, operation);
  }

  recordCacheHit(layer: string) {
    const stats = this.cache[layer] ?? { hits: 0, misses: 0 };
    stats.hits += 1;
    this.cache[layer] = stats;
  }

  recordCacheMiss(layer: string) {
    const stats = this.cache[layer] ?? { hits: 0, misses: 0 };
    stats.misses += 1;
    this.cache[layer] = stats;
  }

  getProviderCalls() {
    return [...this.calls];
  }

  getCacheStats() {
    if (Object.keys(this.cache).length === 0) return null;
    return { ...this.cache };
  }
}

type SearchTelemetryBackend = {
  getCollector: () => SearchTelemetryCollector | null;
};

let backend: SearchTelemetryBackend = {
  getCollector: () => null
};

export function registerSearchTelemetryBackend(next: SearchTelemetryBackend) {
  backend = next;
}

export function getSearchTelemetryCollector() {
  return backend.getCollector();
}

export function recordProviderCall(provider: string, operation: string) {
  backend.getCollector()?.recordProviderCall(provider, operation);
}

export function recordLlmUsed(provider: string, operation = "parse") {
  backend.getCollector()?.recordLlmUsed(provider, operation);
}

export function recordCacheHit(layer: string) {
  backend.getCollector()?.recordCacheHit(layer);
}

export function recordCacheMiss(layer: string) {
  backend.getCollector()?.recordCacheMiss(layer);
}
