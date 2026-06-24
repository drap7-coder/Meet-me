import type { PickQueryOptions } from "@/app/components/SearchPromptAssist";
import type { CurrentLocationContext } from "@/lib/currentLocation";
import type { SearchSubmitOptions } from "@/lib/searchLocation";
import { resolveKoiBotMode } from "@/lib/watchEvents";
import type { SearchHalfwayRequest, SearchHalfwayResponse, WatchEventsResult, WatchSubcategory } from "@/lib/types";

export type SearchIntent =
  | {
      kind: "places";
      form: SearchHalfwayRequest;
      askQuery?: string;
      existingShareUrl?: string;
      submitOptions?: SearchSubmitOptions;
    }
  | {
      kind: "watch";
      query: string;
      subcategory?: WatchSubcategory;
      streamingServiceIds?: string[];
    }
  | {
      kind: "events";
      query: string;
      locationContext?: SearchHalfwayRequest;
    }
  | {
      kind: "freeform";
      query: string;
      context?: CurrentLocationContext;
      form?: SearchHalfwayRequest;
      watchSubcategory?: WatchSubcategory;
      streamingServiceIds?: string[];
    };

export type KoiSearchApiResponse =
  | { kind: "places"; data: SearchHalfwayResponse }
  | { kind: "watch"; data: WatchEventsResult }
  | { kind: "events"; data: WatchEventsResult }
  | {
      kind: "needs_location";
      botMode: "places" | "events";
      form?: SearchHalfwayRequest;
      error: string;
    };

export function shouldRouteFilterSearchToFreeform(query: string, options: PickQueryOptions): boolean {
  if (options.routeViaFreeform) return true;
  return resolveKoiBotMode(query.trim()) === "events";
}

export function buildPlacesFormFromOptions(
  baseForm: SearchHalfwayRequest,
  query: string,
  options: PickQueryOptions,
  location: CurrentLocationContext
): SearchHalfwayRequest {
  const searchMode = options.searchMode ?? baseForm.searchMode ?? "single";

  return {
    ...baseForm,
    locationA: location.locationA?.trim() || baseForm.locationA || "me",
    locationAPlaceId: location.locationAPlaceId ?? baseForm.locationAPlaceId,
    locationACoordinates: location.locationACoordinates ?? baseForm.locationACoordinates,
    locationB: searchMode === "midpoint" ? baseForm.locationB : "",
    locationBPlaceId: searchMode === "midpoint" ? baseForm.locationBPlaceId : undefined,
    locationBCoordinates: searchMode === "midpoint" ? baseForm.locationBCoordinates : undefined,
    category: options.category ?? baseForm.category,
    customQuery: query,
    searchMode,
    watchSubcategory: undefined
  };
}

export function applyPickOptionsToSession(
  options: PickQueryOptions,
  setBuilderMode: (mode: "near_me" | "halfway" | "destination") => void,
  setActiveWatchSubcategory: (subcategory: WatchSubcategory) => void,
  setActiveStreamingServiceIds: (ids: string[]) => void
) {
  if (options.builderMode) setBuilderMode(options.builderMode);
  else if (options.searchMode === "midpoint") setBuilderMode("halfway");
  if (options.watchSubcategory) setActiveWatchSubcategory(options.watchSubcategory);
  if (options.streamingServiceIds !== undefined) setActiveStreamingServiceIds(options.streamingServiceIds);
}
