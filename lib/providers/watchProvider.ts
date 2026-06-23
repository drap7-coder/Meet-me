import { buildWatchSearchMore, buildWatchSearchResult } from "@/lib/watchSearch";
import type { WatchProvider } from "@/lib/providers/types";

export const watchProvider: WatchProvider = {
  search: (query, subcategory, streamingServiceIds) =>
    buildWatchSearchResult(query, subcategory, streamingServiceIds),
  more: (query, excludeKeys, subcategory, streamingServiceIds) =>
    buildWatchSearchMore(query, excludeKeys, subcategory, streamingServiceIds)
};
