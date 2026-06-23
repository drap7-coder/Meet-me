"use client";

import { SHOPPING_SUBCATEGORIES } from "@/lib/shoppingBrowse";
import type { SearchHalfwayRequest, VenueCategory, WatchSubcategory } from "@/lib/types";
import type { SearchBuilderMode } from "@/lib/searchBuilderOptions";
import type { ReactNode } from "react";
import { useState } from "react";

export type PickQueryOptions = {
  watchSubcategory?: WatchSubcategory;
  category?: VenueCategory;
  searchMode?: SearchHalfwayRequest["searchMode"];
};

type Props = {
  form: SearchHalfwayRequest;
  busy?: boolean;
  onPickQuery: (query: string, options?: PickQueryOptions) => void;
  onExpandBuilder?: (mode?: SearchBuilderMode) => void;
};

type PlaceWhatId = "restaurant" | "drinks" | "coffee" | "shopping";
type WhatId = PlaceWhatId | "streaming";
type WhenId = "open_now" | "tonight";
type WhereId = "near" | "halfway";

type WhatDef = { id: WhatId; label: string; noun: string; category: VenueCategory };

type PlaceRefinement = {
  id: string;
  label: string;
  group: "type" | "extra";
  prefix?: string;
  noun?: string;
  suffix?: string;
  category?: VenueCategory;
};

const CONCIERGE_TAGLINE = "Tap chips to build your ask, or just type it.";

const WHAT_DEFS: WhatDef[] = [
  { id: "restaurant", label: "Restaurants", noun: "restaurants", category: "restaurant" },
  { id: "drinks", label: "Drinks", noun: "cocktail bars", category: "cocktail_bars" },
  { id: "coffee", label: "Coffee", noun: "coffee shops", category: "coffee" },
  { id: "shopping", label: "Shopping", noun: "shops", category: "shopping" },
  { id: "streaming", label: "Streaming", noun: "something to watch", category: "custom" }
];

const PLACE_REFINEMENTS: Record<PlaceWhatId, PlaceRefinement[]> = {
  restaurant: [
    { id: "italian", label: "Italian", group: "type", prefix: "Italian", category: "italian" },
    { id: "sushi", label: "Sushi", group: "type", noun: "sushi restaurants", category: "sushi" },
    { id: "steakhouse", label: "Steakhouse", group: "type", noun: "steakhouses", category: "steakhouse" },
    { id: "mexican", label: "Mexican", group: "type", prefix: "Mexican", category: "mexican" },
    { id: "pizza", label: "Pizza", group: "type", noun: "pizza places", category: "pizza" },
    { id: "upscale", label: "Upscale", group: "extra", prefix: "upscale" },
    { id: "date_night", label: "Date Night", group: "extra", prefix: "date night" },
    { id: "outdoor", label: "Outdoor Seating", group: "extra", suffix: "with outdoor seating" }
  ],
  drinks: [
    { id: "cocktails", label: "Cocktails", group: "type", noun: "cocktail bars", category: "cocktail_bars" },
    { id: "wine", label: "Wine Bars", group: "type", noun: "wine bars", category: "wine_bars" },
    { id: "breweries", label: "Breweries", group: "type", noun: "breweries", category: "breweries" },
    { id: "rooftop", label: "Rooftop", group: "type", noun: "rooftop bars", category: "rooftop_bars" },
    { id: "sports", label: "Sports Bar", group: "type", noun: "sports bars", category: "sports_bars" },
    { id: "upscale", label: "Upscale", group: "extra", prefix: "upscale" },
    { id: "outdoor", label: "Outdoor", group: "extra", suffix: "with outdoor seating" }
  ],
  coffee: [
    { id: "espresso", label: "Espresso Bar", group: "type", noun: "espresso bars" },
    { id: "quiet", label: "Quiet", group: "extra", prefix: "quiet" },
    { id: "work", label: "Good for Work", group: "extra", suffix: "good for working" },
    { id: "outdoor", label: "Outdoor Seating", group: "extra", suffix: "with outdoor seating" }
  ],
  shopping: SHOPPING_SUBCATEGORIES.map((item) => ({
    id: item.id,
    label: item.label,
    group: "type" as const,
    noun: shoppingNoun(item.query),
    category: item.category
  }))
};

const STREAM_TYPES: Array<{ id: WatchSubcategory; label: string }> = [
  { id: "movies", label: "Movies" },
  { id: "tv_shows", label: "TV Shows" }
];

const STREAM_GENRES = [
  "Action",
  "Comedy",
  "Drama",
  "Horror",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "Documentary",
  "Family"
];

const VIBE_LABELS: Record<PlaceWhatId, string> = {
  restaurant: "Cuisine / vibe",
  drinks: "Type / vibe",
  coffee: "Vibe",
  shopping: "Shop type"
};

type BuilderState = {
  what: WhatId;
  typeId: string | null;
  extras: Set<string>;
  when: WhenId | null;
  where: WhereId;
  watchType: WatchSubcategory;
  genre: string | null;
};

export function SearchPromptAssist({ busy = false, onPickQuery, onExpandBuilder }: Props) {
  const [state, setState] = useState<BuilderState>(() => ({
    what: "restaurant",
    typeId: null,
    extras: new Set<string>(),
    when: null,
    where: "near",
    watchType: "movies",
    genre: null
  }));

  function commit(next: BuilderState) {
    setState(next);
    const isStreaming = next.what === "streaming";
    const query = isStreaming ? buildStreamQuery(next) : buildPlaceQuery(next);
    if (!query) return;
    onPickQuery(query, {
      category: categoryFor(next),
      watchSubcategory: isStreaming ? next.watchType : undefined,
      searchMode: !isStreaming && next.where === "halfway" ? "midpoint" : "single"
    });
  }

  function pickWhat(id: WhatId) {
    if (id === state.what) return;
    commit({ ...state, what: id, typeId: null, extras: new Set<string>() });
  }

  function toggleType(id: string) {
    commit({ ...state, typeId: state.typeId === id ? null : id });
  }

  function toggleExtra(id: string) {
    const extras = new Set(state.extras);
    if (extras.has(id)) extras.delete(id);
    else extras.add(id);
    commit({ ...state, extras });
  }

  function toggleWhen(id: WhenId) {
    commit({ ...state, when: state.when === id ? null : id });
  }

  function setWhere(id: WhereId) {
    if (id === "halfway") onExpandBuilder?.("halfway");
    const what = state.what && state.what !== "streaming" ? state.what : "restaurant";
    commit({ ...state, what, where: id });
  }

  function pickWatchType(id: WatchSubcategory) {
    commit({ ...state, watchType: id });
  }

  function toggleGenre(genre: string) {
    commit({ ...state, genre: state.genre === genre ? null : genre });
  }

  const isStreaming = state.what === "streaming";
  const placeRefinements = isStreaming ? [] : PLACE_REFINEMENTS[state.what as PlaceWhatId];

  return (
    <section className="grid gap-2.5" aria-label="Prompt builder">
      <p className="px-0.5 text-sm font-semibold text-white/70">{CONCIERGE_TAGLINE}</p>

      <ChipGroup label="What">
        {WHAT_DEFS.map((def) => (
          <AssistChip
            key={def.id}
            label={def.label}
            busy={busy}
            variant="primary"
            selected={state.what === def.id}
            onPick={() => pickWhat(def.id)}
          />
        ))}
      </ChipGroup>

      {isStreaming ? (
        <>
          <ChipGroup label="Watch">
            {STREAM_TYPES.map((option) => (
              <AssistChip
                key={option.id}
                label={option.label}
                busy={busy}
                selected={state.watchType === option.id}
                onPick={() => pickWatchType(option.id)}
              />
            ))}
          </ChipGroup>
          <ChipGroup label="Genre">
            {STREAM_GENRES.map((genre) => (
              <AssistChip
                key={genre}
                label={genre}
                busy={busy}
                selected={state.genre === genre}
                onPick={() => toggleGenre(genre)}
              />
            ))}
          </ChipGroup>
        </>
      ) : (
        <>
          <ChipGroup label={VIBE_LABELS[state.what as PlaceWhatId]}>
            {placeRefinements.map((refinement) => (
              <AssistChip
                key={refinement.id}
                label={refinement.label}
                busy={busy}
                selected={
                  refinement.group === "type"
                    ? state.typeId === refinement.id
                    : state.extras.has(refinement.id)
                }
                onPick={() =>
                  refinement.group === "type"
                    ? toggleType(refinement.id)
                    : toggleExtra(refinement.id)
                }
              />
            ))}
          </ChipGroup>

          <ChipGroup label="When / where">
            <AssistChip
              label="Near Me"
              busy={busy}
              selected={state.where === "near"}
              onPick={() => setWhere("near")}
            />
            <AssistChip
              label="Open Now"
              busy={busy}
              selected={state.when === "open_now"}
              onPick={() => toggleWhen("open_now")}
            />
            <AssistChip
              label="Tonight"
              busy={busy}
              selected={state.when === "tonight"}
              onPick={() => toggleWhen("tonight")}
            />
            <AssistChip
              label="Halfway"
              busy={busy}
              selected={state.where === "halfway"}
              onPick={() => setWhere(state.where === "halfway" ? "near" : "halfway")}
            />
          </ChipGroup>
        </>
      )}
    </section>
  );
}

function ChipGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-full text-[0.625rem] font-bold uppercase tracking-[0.18em] text-white/40 sm:w-[5.25rem] sm:shrink-0">
        {label}
      </span>
      {children}
    </div>
  );
}

function AssistChip({
  label,
  busy,
  variant = "accent",
  selected = false,
  onPick
}: {
  label: string;
  busy: boolean;
  variant?: "primary" | "accent";
  selected?: boolean;
  onPick: () => void;
}) {
  const tone =
    selected && variant === "primary"
      ? "border-koi bg-koi text-white shadow-[0_8px_18px_rgba(255,90,0,0.24)]"
      : selected
        ? "border-koi/70 bg-koi/15 text-white"
        : "border-white/14 bg-white/[0.06] text-white/75 hover:border-white/30 hover:bg-white/10";

  return (
    <button
      type="button"
      disabled={busy}
      onClick={onPick}
      aria-pressed={selected}
      className={`shrink-0 rounded-full border px-3.5 py-2 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-koi/15 disabled:cursor-not-allowed disabled:opacity-40 ${tone}`}
    >
      {label}
    </button>
  );
}

function categoryFor(state: BuilderState): VenueCategory {
  if (state.what === "streaming") return "custom";
  const refs = PLACE_REFINEMENTS[state.what as PlaceWhatId];
  const type = refs.find((item) => item.group === "type" && item.id === state.typeId);
  if (type?.category) return type.category;
  return WHAT_DEFS.find((item) => item.id === state.what)?.category ?? "restaurant";
}

function buildPlaceQuery(state: BuilderState): string {
  const def = WHAT_DEFS.find((item) => item.id === state.what) ?? WHAT_DEFS[0];
  const refs = PLACE_REFINEMENTS[state.what as PlaceWhatId] ?? [];
  const type = refs.find((item) => item.group === "type" && item.id === state.typeId);

  let noun = type?.noun ?? def.noun;

  const prefixes: string[] = [];
  if (state.extras.has("upscale")) prefixes.push("upscale");
  if (type?.prefix) prefixes.push(type.prefix);
  if (state.extras.has("date_night")) prefixes.push("date night");
  if (state.extras.has("quiet")) prefixes.push("quiet");

  const suffixes: string[] = [];
  if (type?.suffix) suffixes.push(type.suffix);
  if (state.extras.has("outdoor")) suffixes.push("with outdoor seating");
  if (state.extras.has("work")) suffixes.push("good for working");

  suffixes.push(state.where === "halfway" ? "halfway between us" : "near me");

  if (state.when === "open_now") suffixes.push("open now");
  else if (state.when === "tonight") suffixes.push("tonight");
  else if (!state.extras.has("date_night") && (def.id === "restaurant" || def.id === "drinks")) {
    suffixes.push("tonight");
  }

  const phrase = [...prefixes, noun, ...suffixes].join(" ");
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

function buildStreamQuery(state: BuilderState): string {
  const noun = state.watchType === "tv_shows" ? "TV shows" : "movies";
  if (state.genre) return `Best ${state.genre.toLowerCase()} ${noun} tonight`;
  return state.watchType === "tv_shows"
    ? "What TV show should I watch tonight?"
    : "What movie should I watch tonight?";
}

function shoppingNoun(query: string): string {
  return query.replace(/ near me$/i, "").toLowerCase();
}
