"use client";

import type { SearchHalfwayRequest, VenueCategory, WatchSubcategory } from "@/lib/types";
import {
  DEFAULT_SHOPPING_SUBCATEGORY,
  isShoppingCategory,
  SHOPPING_SUBCATEGORIES
} from "@/lib/shoppingBrowse";
import {
  DEFAULT_WATCH_SUBCATEGORY
} from "@/lib/watchBrowse";
import { LocationPinIcon } from "@/app/components/SavedLocationBadge";
import type { ReactNode } from "react";
import { useState } from "react";

type SearchLane = "restaurants" | "drinks" | "coffee" | "shopping" | "streaming";
type RadiusOption = "10 min" | "20 min" | "30 min" | "Flexible";
type ResultMode = "best" | "more" | "halfway";

type Props = {
  form: SearchHalfwayRequest;
  loading: boolean;
  locationLabel?: string;
  locating?: boolean;
  onChange: (form: SearchHalfwayRequest) => void;
  onSearchPlaces: (form: SearchHalfwayRequest) => void;
  onSearchWatch: (query: string, subcategory: WatchSubcategory) => void;
  onUseLocation: () => void;
};

const LANES: Array<{ id: SearchLane; label: string; category: VenueCategory; query: string }> = [
  { id: "restaurants", label: "Restaurants", category: "restaurant", query: "restaurant" },
  { id: "drinks", label: "Drinks", category: "cocktail_bars", query: "drinks" },
  { id: "coffee", label: "Coffee", category: "coffee", query: "coffee shop" },
  { id: "shopping", label: "Shopping", category: DEFAULT_SHOPPING_SUBCATEGORY.category, query: "shopping" },
  { id: "streaming", label: "Streaming", category: "custom", query: "what should I watch" }
];

const RADIUS_OPTIONS: RadiusOption[] = ["10 min", "20 min", "30 min", "Flexible"];

export function ClassicSearchControls({
  form,
  loading,
  locationLabel = "",
  locating = false,
  onChange,
  onSearchPlaces,
  onSearchWatch,
  onUseLocation
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const [radius, setRadius] = useState<RadiusOption>("20 min");
  const [resultMode, setResultMode] = useState<ResultMode>("best");
  const [activeShoppingId, setActiveShoppingId] = useState(
    () =>
      SHOPPING_SUBCATEGORIES.find((item) => item.category === form.category)?.id ??
      DEFAULT_SHOPPING_SUBCATEGORY.id
  );
  const activeLane = laneForForm(form);
  const isStreaming = activeLane === "streaming";
  const searchMode = resultMode === "halfway" ? "midpoint" : "single";
  const showRefinementHint = !isStreaming && categoryShowsRefinements(form.category);
  const needsSecondLocation = searchMode === "midpoint";
  const watchSubcategory = form.watchSubcategory ?? DEFAULT_WATCH_SUBCATEGORY;

  function selectLane(lane: SearchLane) {
    const config = LANES.find((item) => item.id === lane) ?? LANES[0];
    setExpanded(true);
    onChange({
      ...form,
      category: config.category,
      customQuery: lane === "streaming" ? config.query : "",
      watchSubcategory: lane === "streaming" ? DEFAULT_WATCH_SUBCATEGORY : undefined
    });
    if (lane === "shopping") {
      setActiveShoppingId(DEFAULT_SHOPPING_SUBCATEGORY.id);
    }
  }

  function setLocationA(locationA: string) {
    onChange({
      ...form,
      locationA,
      locationAPlaceId: undefined,
      locationACoordinates: undefined,
      searchMode
    });
  }

  function setLocationB(locationB: string) {
    onChange({
      ...form,
      locationB,
      locationBPlaceId: undefined,
      locationBCoordinates: undefined,
      searchMode
    });
  }

  function submitClassicSearch() {
    if (isStreaming) {
      const query = form.customQuery?.trim() || "what should I watch tonight";
      onSearchWatch(query, watchSubcategory);
      return;
    }

    onSearchPlaces(buildPlaceForm(form, searchMode, radius, activeShoppingId));
  }

  return (
    <section className="w-full rounded-[18px] border border-white/12 bg-white/[0.06] p-3 shadow-[0_14px_36px_rgba(0,0,0,0.12)] backdrop-blur sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-koi">Classic Search</p>
          <h2 className="mt-1 text-lg font-black tracking-tight text-white">
            {isStreaming ? "Find something to stream" : "Refine without the perfect prompt"}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="rounded-full border border-white/18 bg-white/10 px-3 py-2 text-sm font-bold text-white/85 transition hover:border-koi/50 hover:bg-koi/15"
        >
          {expanded ? "Hide controls" : "Show controls"}
        </button>
      </div>

      {!isStreaming ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {LANES.filter((lane) => lane.id !== "streaming").map((lane) => {
            const selected = activeLane === lane.id;
            return (
              <button
                key={lane.id}
                type="button"
                onClick={() => selectLane(lane.id)}
                aria-pressed={selected}
                className={`min-h-10 rounded-full border px-3 py-2 text-sm font-black transition ${
                  selected
                    ? "border-koi bg-koi text-white shadow-[0_8px_18px_rgba(255,90,0,0.24)]"
                    : "border-white/16 bg-white/[0.06] text-white/85 hover:border-koi/50 hover:bg-koi/10"
                }`}
              >
                {lane.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => selectLane("streaming")}
            className="min-h-10 rounded-full border border-white/16 bg-white/[0.06] px-3 py-2 text-sm font-black text-white/85 transition hover:border-koi/50 hover:bg-koi/10"
          >
            Streaming
          </button>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex min-h-10 items-center rounded-full border border-koi bg-koi px-4 text-sm font-black text-white shadow-[0_8px_18px_rgba(255,90,0,0.24)]">
            Streaming
          </span>
          <button
            type="button"
            onClick={() => selectLane("restaurants")}
            className="min-h-10 rounded-full border border-white/16 bg-white/[0.06] px-4 py-2 text-sm font-bold text-white/85 transition hover:border-koi/50 hover:bg-koi/10"
          >
            ← Back to places
          </button>
        </div>
      )}

      {expanded ? (
        <div className="mt-4 grid gap-4 rounded-[16px] border border-white/10 bg-ink/35 p-3 sm:p-4">
          {isStreaming ? (
            <p className="text-sm font-medium leading-6 text-white/60">
              Pick movies or shows and a genre in the chips above, then search for streaming picks.
            </p>
          ) : showRefinementHint ? (
            <p className="text-sm font-medium leading-6 text-white/60">
              Pick refinements in the chips above, then set location and search.
            </p>
          ) : null}

          {!isStreaming ? (
            <>
              <div className="grid gap-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onUseLocation}
                    disabled={loading || locating}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-koi/45 bg-koi/15 px-4 text-sm font-bold text-white transition hover:bg-koi/25 disabled:cursor-wait disabled:opacity-60"
                  >
                    <LocationPinIcon className="h-4 w-4 text-koi" />
                    {locating ? "Checking location..." : "Use my location"}
                  </button>
                  {locationLabel ? (
                    <span className="inline-flex h-10 max-w-full items-center rounded-full border border-white/12 bg-white/[0.06] px-4 text-sm font-semibold text-white/75">
                      {locationLabel}
                    </span>
                  ) : null}
                </div>

                <div className={`grid gap-3 ${needsSecondLocation ? "sm:grid-cols-2" : ""}`}>
                  <label className="grid gap-1.5">
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-white/55">
                      {needsSecondLocation ? "Location 1" : "Search near"}
                    </span>
                    <input
                      value={form.locationA}
                      onChange={(event) => setLocationA(event.target.value)}
                      placeholder="City, ZIP, address, or use my location"
                      className="h-11 rounded-lg border border-white/12 bg-white px-3 text-base text-ink outline-none transition focus:border-koi focus:ring-4 focus:ring-koi/15"
                    />
                  </label>
                  {needsSecondLocation ? (
                    <label className="grid gap-1.5">
                      <span className="text-xs font-black uppercase tracking-[0.14em] text-white/55">Location 2</span>
                      <input
                        value={form.locationB}
                        onChange={(event) => setLocationB(event.target.value)}
                        placeholder="Second city, ZIP, or address"
                        className="h-11 rounded-lg border border-white/12 bg-white px-3 text-base text-ink outline-none transition focus:border-koi focus:ring-4 focus:ring-koi/15"
                      />
                    </label>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <ControlGroup title="Radius">
                  {RADIUS_OPTIONS.map((option) => (
                    <Chip key={option} selected={radius === option} onClick={() => setRadius(option)}>
                      {option}
                    </Chip>
                  ))}
                </ControlGroup>

                <ControlGroup title="Result mode">
                  <Chip selected={resultMode === "best"} onClick={() => setResultMode("best")}>
                    Best pick
                  </Chip>
                  <Chip selected={resultMode === "more"} onClick={() => setResultMode("more")}>
                    More options
                  </Chip>
                  <Chip selected={resultMode === "halfway"} onClick={() => setResultMode("halfway")}>
                    Halfway
                  </Chip>
                </ControlGroup>
              </div>
            </>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold leading-5 text-white/55">
              {isStreaming
                ? "Use the streaming chips above to refine your pick."
                : "Ask Koi is the magic. Classic Search is the seatbelt."}
            </p>
            <button
              type="button"
              onClick={submitClassicSearch}
              disabled={loading}
              className="h-11 rounded-full bg-koi px-5 text-sm font-black text-white shadow-[0_10px_24px_rgba(255,90,0,0.24)] transition hover:bg-koi-hover focus:outline-none focus:ring-4 focus:ring-koi/25 disabled:cursor-not-allowed disabled:bg-white/20"
            >
              {isStreaming ? "Find streaming picks" : "Search"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ControlGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid gap-2 rounded-[14px] border border-white/10 bg-white/[0.05] p-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-white/55">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full border px-3 py-2 text-sm font-bold transition ${
        selected
          ? "border-koi bg-koi text-white"
          : "border-white/14 bg-white/[0.06] text-white/85 hover:border-koi/50 hover:bg-koi/10"
      }`}
    >
      {children}
    </button>
  );
}

function categoryShowsRefinements(category: VenueCategory) {
  return (
    category === "restaurant" ||
    category === "coffee" ||
    isShoppingCategory(category) ||
    ["cocktail_bars", "breweries", "wine_bars", "lounges", "pubs", "rooftop_bars", "sports_bars", "bar"].includes(
      category
    )
  );
}

function laneForForm(form: SearchHalfwayRequest): SearchLane {
  if (form.category === "custom" && form.watchSubcategory) return "streaming";
  if (isShoppingCategory(form.category)) return "shopping";
  if (form.category === "coffee") return "coffee";
  if (["cocktail_bars", "breweries", "wine_bars", "lounges", "pubs", "rooftop_bars", "sports_bars", "bar"].includes(form.category)) {
    return "drinks";
  }
  return "restaurants";
}

function buildPlaceForm(
  form: SearchHalfwayRequest,
  searchMode: SearchHalfwayRequest["searchMode"],
  radius: RadiusOption,
  activeShoppingId: string
): SearchHalfwayRequest {
  const customQuery = buildPlaceQuery(form, radius, activeShoppingId);
  const needsCustomQuery = radius !== "Flexible";

  return {
    ...form,
    searchMode,
    locationB: searchMode === "single" ? "" : form.locationB,
    category: needsCustomQuery ? "custom" : form.category,
    customQuery: needsCustomQuery ? customQuery : form.customQuery
  };
}

function buildPlaceQuery(form: SearchHalfwayRequest, radius: RadiusOption, activeShoppingId: string) {
  const parts: string[] = [];
  const shoppingMatch = SHOPPING_SUBCATEGORIES.find((item) => item.id === activeShoppingId);
  const categoryWord =
    form.category === "coffee"
      ? "coffee shop"
      : form.category === "cocktail_bars"
        ? "cocktail bar"
        : isShoppingCategory(form.category)
          ? (shoppingMatch?.query.replace(" near me", "") ?? "shopping")
          : "restaurant";

  parts.push(categoryWord);
  if (radius !== "Flexible") parts.push(`within ${radius}`);
  return parts.join(" ");
}
