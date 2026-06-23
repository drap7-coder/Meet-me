import { buildWatchSearchMore, buildWatchSearchResult } from "@/lib/watchSearch";
import type { WatchProvider } from "@/lib/providers/types";

export const watchProvider: WatchProvider = {
  search: buildWatchSearchResult,
  more: buildWatchSearchMore
};
