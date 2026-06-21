import type { CurrentLocationContext } from "@/lib/currentLocation";
import type { SearchHalfwayRequest } from "@/lib/types";

export function readRequestLocationContext(body: Record<string, unknown>): CurrentLocationContext | undefined {
  const context = body.context;
  if (!context || typeof context !== "object" || Array.isArray(context)) return undefined;
  const value = context as Partial<CurrentLocationContext>;
  if (!value.locationA && !value.locationACoordinates) return undefined;
  return {
    locationA: typeof value.locationA === "string" ? value.locationA : "",
    locationAPlaceId: typeof value.locationAPlaceId === "string" ? value.locationAPlaceId : undefined,
    locationACoordinates: value.locationACoordinates
  };
}

export function readRequestSearchForm(body: Record<string, unknown>): SearchHalfwayRequest | undefined {
  const form = body.form;
  if (!form || typeof form !== "object" || Array.isArray(form)) return undefined;
  const value = form as Partial<SearchHalfwayRequest>;
  if (!value.locationA && !value.locationB) return undefined;
  return {
    locationA: typeof value.locationA === "string" ? value.locationA : "",
    locationB: typeof value.locationB === "string" ? value.locationB : "",
    locationAPlaceId: typeof value.locationAPlaceId === "string" ? value.locationAPlaceId : undefined,
    locationBPlaceId: typeof value.locationBPlaceId === "string" ? value.locationBPlaceId : undefined,
    locationACoordinates: value.locationACoordinates,
    locationBCoordinates: value.locationBCoordinates,
    category: value.category ?? "coffee",
    searchMode: value.searchMode ?? "midpoint",
    meetupMode: value.meetupMode ?? "single",
    customQuery: typeof value.customQuery === "string" ? value.customQuery : ""
  };
}
