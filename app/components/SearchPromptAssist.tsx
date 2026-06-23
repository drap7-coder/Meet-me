"use client";

import {
  DEFAULT_SHOPPING_SUBCATEGORY,
  isShoppingCategory,
  SHOPPING_SUBCATEGORIES,
  shoppingQueryForLocation
} from "@/lib/shoppingBrowse";
import {
  getWatchGenresForSubcategory,
  WATCH_SUBCATEGORIES
} from "@/lib/watchBrowse";
import type { SearchHalfwayRequest, VenueCategory, WatchSubcategory } from "@/lib/types";
import { useState } from "react";

export type PickQueryOptions = {
  watchSubcategory?: WatchSubcategory;
  category?: VenueCategory;
};

type Props = {
  form: SearchHalfwayRequest;
  busy?: boolean;
  onPickQuery: (query: string, options?: PickQueryOptions) => void;
};

type QuickChip = {
  label: string;
  query: string;
  category?: VenueCategory;
  watchSubcategory?: WatchSubcategory;
};

type AssistMode = "browse" | "places" | "streaming";

const CONCIERGE_TAGLINE = "Ask about dinner, drinks, shopping, or what to stream.";

const PLACE_CHIPS: QuickChip[] = [
  { label: "Restaurants", query: "Restaurants near me tonight", category: "restaurant" },
  { label: "Drinks", query: "Cocktail bars near me tonight", category: "cocktail_bars" },
  { label: "Coffee", query: "Coffee near me", category: "coffee" },
  { label: "Near Me", query: "Best places near me", category: "restaurant" }
];

const STREAMING_CHIP: QuickChip = {
  label: "Streaming",
  query: "What should I watch tonight?",
  category: "custom",
  watchSubcategory: "movies"
};

const SHOPPING_CHIP: QuickChip = {
  label: "Shopping",
  query: "Shopping near me",
  category: DEFAULT_SHOPPING_SUBCATEGORY.category
};

const HALFWAY_REFINEMENT: QuickChip = {
  label: "Halfway",
  query: "Best sushi halfway between Blue Bell and Manayunk",
  category: "restaurant"
};

const BASE_REFINEMENTS: QuickChip[] = [
  { label: "Upscale", query: "Find an upscale restaurant near me tonight" },
  { label: "Open Now", query: "Restaurants open now near me" },
  { label: "Tonight", query: "Dinner near me tonight" },
  { label: "Date Night", query: "Fun date night this Friday" },
  { label: "Outdoor Seating", query: "Restaurants with outdoor seating near me" },
  { label: "Italian", query: "Italian restaurant near me tonight" },
  { label: "Sushi", query: "Best sushi near me tonight" },
  { label: "Steakhouse", query: "Upscale steakhouse near me tonight" }
];

const WATCH_TYPE_CHIPS = WATCH_SUBCATEGORIES.filter(
  (option) => option.id === "movies" || option.id === "tv_shows"
);

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

export function SearchPromptAssist({ form, busy = false, onPickQuery }: Props) {
  const [mode, setMode] = useState<AssistMode>("browse");
  const [watchSubcategory, setWatchSubcategory] = useState<WatchSubcategory>(
    form.watchSubcategory === "tv_shows" ? "tv_shows" : "movies"
  );
  const activeWatchSubcategory =
    form.watchSubcategory === "tv_shows" || form.watchSubcategory === "movies"
      ? form.watchSubcategory
      : watchSubcategory;
  const placeRefinements = contextualRefinements(form);
  const genreChips = streamingGenreChips(activeWatchSubcategory);

  function pickPlaceCategory(chip: QuickChip) {
    setMode("places");
    onPickQuery(chip.query, { category: chip.category, watchSubcategory: undefined });
  }

  function pickPlaceRefinement(chip: QuickChip) {
    onPickQuery(chip.query, { category: chip.category ?? form.category, watchSubcategory: undefined });
  }

  function pickStreaming() {
    setMode("streaming");
    setWatchSubcategory("movies");
    onPickQuery(STREAMING_CHIP.query, {
      category: "custom",
      watchSubcategory: "movies"
    });
  }

  function pickShopping() {
    setMode("places");
    onPickQuery(SHOPPING_CHIP.query, {
      category: DEFAULT_SHOPPING_SUBCATEGORY.category,
      watchSubcategory: undefined
    });
  }

  function pickWatchType(subcategory: WatchSubcategory) {
    setWatchSubcategory(subcategory);
    const label = subcategory === "tv_shows" ? "TV show" : "movie";
    onPickQuery(`What ${label} should I watch tonight?`, {
      category: "custom",
      watchSubcategory: subcategory
    });
  }

  function pickGenre(query: string) {
    onPickQuery(query, { category: "custom", watchSubcategory: activeWatchSubcategory });
  }

  function backToBrowse() {
    setMode("browse");
    onPickQuery("Restaurants near me tonight", {
      category: "restaurant",
      watchSubcategory: undefined
    });
  }

  const showStreamingUI =
    mode === "streaming" ||
    (mode !== "places" && form.category === "custom" && Boolean(form.watchSubcategory));

  const showPlaceRefinements =
    !showStreamingUI && (mode === "places" || categoryShowsRefinements(form.category));

  if (showStreamingUI) {
    return (
      <section className="grid gap-3" aria-label="Search suggestions">
        <div className="flex items-center justify-between gap-2">
          <p className="px-0.5 text-sm font-semibold text-white/70">Streaming picks</p>
          <button
            type="button"
            disabled={busy}
            onClick={backToBrowse}
            className="shrink-0 rounded-full border border-white/16 bg-white/[0.08] px-3 py-1.5 text-xs font-bold text-white/85 transition hover:border-koi/55 hover:bg-koi/14 disabled:opacity-60"
          >
            ← Places
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Movies or shows">
          {WATCH_TYPE_CHIPS.map((option) => (
            <AssistChip
              key={option.id}
              label={option.label}
              busy={busy}
              selected={activeWatchSubcategory === option.id}
              onPick={() => pickWatchType(option.id)}
            />
          ))}
        </div>

        {genreChips.length ? (
          <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Streaming genres">
            {genreChips.map((chip) => (
              <AssistChip
                key={chip.id}
                label={chip.label}
                busy={busy}
                subtle
                onPick={() => pickGenre(chip.query)}
              />
            ))}
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="grid gap-3" aria-label="Search suggestions">
      <p className="px-0.5 text-sm font-semibold text-white/70">{CONCIERGE_TAGLINE}</p>

      <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Quick start categories">
        {PLACE_CHIPS.map((chip) => (
          <AssistChip key={chip.label} label={chip.label} busy={busy} onPick={() => pickPlaceCategory(chip)} />
        ))}
        <AssistChip label={SHOPPING_CHIP.label} busy={busy} onPick={pickShopping} />
        <AssistChip label={STREAMING_CHIP.label} busy={busy} onPick={pickStreaming} />
      </div>

      {showPlaceRefinements && placeRefinements.length ? (
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Refine search">
          {placeRefinements.map((chip) => (
            <AssistChip
              key={chip.label}
              label={chip.label}
              busy={busy}
              subtle
              onPick={() => pickPlaceRefinement(chip)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function AssistChip({
  label,
  busy,
  subtle = false,
  selected = false,
  onPick
}: {
  label: string;
  busy: boolean;
  subtle?: boolean;
  selected?: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onPick}
      aria-pressed={selected}
      className={`shrink-0 rounded-full border px-3.5 py-2 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-koi/15 disabled:cursor-not-allowed disabled:opacity-60 ${
        selected
          ? "border-koi bg-koi text-white shadow-[0_8px_18px_rgba(255,90,0,0.24)]"
          : subtle
            ? "border-white/12 bg-white/[0.055] text-white/75 hover:border-koi/45 hover:bg-koi/10"
            : "border-white/16 bg-white/[0.08] text-white hover:border-koi/55 hover:bg-koi/14"
      }`}
    >
      {label}
    </button>
  );
}

function contextualRefinements(form: SearchHalfwayRequest): QuickChip[] {
  const location = form.locationA.trim() || "me";
  const restaurantQuery = (query: string) => query.replace("near me", `near ${location}`);
  const category = form.category;

  if (category === "coffee") {
    return [
      { label: "Open Now", query: `Coffee open now near ${location}` },
      { label: "Quiet", query: `Quiet coffee shop near ${location}` },
      { label: "Outdoor Seating", query: `Coffee with outdoor seating near ${location}` },
      HALFWAY_REFINEMENT
    ];
  }

  if (isShoppingCategory(category)) {
    return [
      ...SHOPPING_SUBCATEGORIES.map((subcategory) => ({
        label: subcategory.label,
        query: shoppingQueryForLocation(subcategory.query, location),
        category: subcategory.category
      })),
      HALFWAY_REFINEMENT
    ];
  }

  return [
    ...BASE_REFINEMENTS.map((chip) => ({
      ...chip,
      query: restaurantQuery(chip.query)
    })),
    HALFWAY_REFINEMENT
  ];
}

function streamingGenreChips(subcategory: WatchSubcategory) {
  return getWatchGenresForSubcategory(subcategory).map((genre) => ({
    id: genre.id,
    label: genre.label,
    query: genre.query
  }));
}
