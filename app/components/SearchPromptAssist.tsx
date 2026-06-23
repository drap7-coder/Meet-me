"use client";

import { SHOPPING_SUBCATEGORIES } from "@/lib/shoppingBrowse";
import { WATCH_SUBCATEGORIES } from "@/lib/watchBrowse";
import type { SearchHalfwayRequest, VenueCategory, WatchSubcategory } from "@/lib/types";
import type { SearchBuilderMode } from "@/lib/searchBuilderOptions";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type PickQueryOptions = {
  watchSubcategory?: WatchSubcategory;
  category?: VenueCategory;
  searchMode?: SearchHalfwayRequest["searchMode"];
  builderMode?: SearchBuilderMode;
};

type ProviderProps = {
  busy?: boolean;
  builderMode?: SearchBuilderMode;
  onPickQuery: (query: string, options?: PickQueryOptions) => void;
  seed?: Pick<PickQueryOptions, "category" | "watchSubcategory">;
  surface?: "hero" | "page";
  children: ReactNode;
};

type PlaceWhatId = "restaurant" | "drinks" | "coffee" | "shopping";
type WhatId = PlaceWhatId | "streaming";
type WhenId = "open_now" | "tonight";
type WhereId = "near" | "choose" | "halfway";

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

const PLACE_TYPES: Record<PlaceWhatId, PlaceRefinement[]> = {
  restaurant: [
    { id: "italian", label: "Italian", group: "type", prefix: "Italian", category: "italian" },
    { id: "sushi", label: "Sushi", group: "type", noun: "sushi restaurants", category: "sushi" },
    { id: "steakhouse", label: "Steakhouse", group: "type", noun: "steakhouses", category: "steakhouse" },
    { id: "mexican", label: "Mexican", group: "type", prefix: "Mexican", category: "mexican" },
    { id: "pizza", label: "Pizza", group: "type", noun: "pizza places", category: "pizza" }
  ],
  drinks: [
    { id: "cocktails", label: "Cocktails", group: "type", noun: "cocktail bars", category: "cocktail_bars" },
    { id: "wine", label: "Wine Bars", group: "type", noun: "wine bars", category: "wine_bars" },
    { id: "breweries", label: "Breweries", group: "type", noun: "breweries", category: "breweries" },
    { id: "rooftop", label: "Rooftop", group: "type", noun: "rooftop bars", category: "rooftop_bars" },
    { id: "sports", label: "Sports Bar", group: "type", noun: "sports bars", category: "sports_bars" }
  ],
  coffee: [{ id: "espresso", label: "Espresso Bar", group: "type", noun: "espresso bars" }],
  shopping: SHOPPING_SUBCATEGORIES.map((item) => ({
    id: item.id,
    label: item.label,
    group: "type" as const,
    noun: shoppingNoun(item.query),
    category: item.category
  }))
};

const PLACE_VIBES: Record<PlaceWhatId, PlaceRefinement[]> = {
  restaurant: [
    { id: "upscale", label: "Upscale", group: "extra", prefix: "upscale" },
    { id: "date_night", label: "Date Night", group: "extra", prefix: "date night" },
    { id: "outdoor", label: "Outdoor", group: "extra", suffix: "with outdoor seating" },
    { id: "family_friendly", label: "Family Friendly", group: "extra", prefix: "family friendly" }
  ],
  drinks: [
    { id: "upscale", label: "Upscale", group: "extra", prefix: "upscale" },
    { id: "outdoor", label: "Outdoor", group: "extra", suffix: "with outdoor seating" },
    { id: "family_friendly", label: "Family Friendly", group: "extra", prefix: "family friendly" }
  ],
  coffee: [
    { id: "quiet", label: "Quiet", group: "extra", prefix: "quiet" },
    { id: "work", label: "Good for Work", group: "extra", suffix: "good for working" },
    { id: "outdoor", label: "Outdoor", group: "extra", suffix: "with outdoor seating" },
    { id: "family_friendly", label: "Family Friendly", group: "extra", prefix: "family friendly" }
  ],
  shopping: [
    { id: "family_friendly", label: "Family Friendly", group: "extra", prefix: "family friendly" },
    { id: "upscale", label: "Upscale", group: "extra", prefix: "upscale" },
    { id: "walkable", label: "Walkable", group: "extra", prefix: "walkable" }
  ]
};

function placeRefinementsFor(what: PlaceWhatId): PlaceRefinement[] {
  return [...PLACE_TYPES[what], ...PLACE_VIBES[what]];
}

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

const TYPE_LABELS: Record<PlaceWhatId, string> = {
  restaurant: "Cuisine",
  drinks: "Type",
  coffee: "Style",
  shopping: "Shop type"
};

export type BuilderState = {
  what: WhatId;
  typeId: string | null;
  extras: Set<string>;
  when: WhenId | null;
  where: WhereId;
  watchType: WatchSubcategory;
  genre: string | null;
};

type AssistContextValue = {
  busy: boolean;
  state: BuilderState;
  promptQuery: string;
  isStreaming: boolean;
  typeRefinements: PlaceRefinement[];
  vibeRefinements: PlaceRefinement[];
  surface: "hero" | "page";
  pickWhat: (id: WhatId) => void;
  toggleType: (id: string) => void;
  toggleExtra: (id: string) => void;
  toggleWhen: (id: WhenId) => void;
  setWhere: (id: WhereId) => void;
  pickWatchType: (id: WatchSubcategory) => void;
  toggleGenre: (genre: string) => void;
};

const AssistContext = createContext<AssistContextValue | null>(null);

function useAssistContext() {
  const value = useContext(AssistContext);
  if (!value) throw new Error("Search prompt assist components must render inside SearchPromptAssistProvider");
  return value;
}

function initialBuilderState(seed?: Pick<PickQueryOptions, "category" | "watchSubcategory">): BuilderState {
  if (seed?.category === "custom" && seed.watchSubcategory) {
    return {
      what: "streaming",
      typeId: null,
      extras: new Set<string>(),
      when: null,
      where: "near",
      watchType: seed.watchSubcategory,
      genre: null
    };
  }

  return {
    what: "restaurant",
    typeId: null,
    extras: new Set<string>(),
    when: null,
    where: "near",
    watchType: "movies",
    genre: null
  };
}

export function SearchPromptAssistProvider({
  busy = false,
  builderMode,
  onPickQuery,
  seed,
  surface = "hero",
  children
}: ProviderProps) {
  const [state, setState] = useState<BuilderState>(() => initialBuilderState(seed));
  const [promptQuery, setPromptQuery] = useState("");

  function syncQuery(next: BuilderState) {
    const isStreaming = next.what === "streaming";
    const query = isStreaming ? buildStreamQuery(next) : buildPlaceQuery(next);
    if (!query) return;
    setPromptQuery(query);
    onPickQuery(query, {
      category: categoryFor(next),
      watchSubcategory: isStreaming ? next.watchType : undefined,
      searchMode: !isStreaming && next.where === "halfway" ? "midpoint" : "single",
      builderMode: builderModeForWhere(next.where)
    });
  }

  function commit(updater: (prev: BuilderState) => BuilderState) {
    setState((prev) => {
      const next = updater(prev);
      syncQuery(next);
      return next;
    });
  }

  useEffect(() => {
    if (!seed?.watchSubcategory || seed.category !== "custom") return;
    setState((prev) => {
      if (prev.what === "streaming" && prev.watchType === seed.watchSubcategory) return prev;
      const next = initialBuilderState(seed);
      syncQuery(next);
      return next;
    });
    // Keep chip state aligned when the page form switches streaming subcategory.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed?.category, seed?.watchSubcategory]);

  useEffect(() => {
    syncQuery(state);
    // Seed the ask input once on mount; chip state drives all later updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!builderMode) return;
    const where: WhereId =
      builderMode === "halfway" ? "halfway" : builderMode === "destination" ? "choose" : "near";
    setState((prev) => {
      if (prev.where === where) return prev;
      const next = { ...prev, where };
      syncQuery(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builderMode]);

  function pickWhat(id: WhatId) {
    commit((prev) => {
      if (prev.what === id) return prev;
      return { ...prev, what: id, typeId: null, extras: new Set<string>() };
    });
  }

  function toggleType(id: string) {
    commit((prev) => ({ ...prev, typeId: prev.typeId === id ? null : id }));
  }

  function toggleExtra(id: string) {
    commit((prev) => {
      const extras = new Set(prev.extras);
      if (extras.has(id)) extras.delete(id);
      else extras.add(id);
      return { ...prev, extras };
    });
  }

  function toggleWhen(id: WhenId) {
    commit((prev) => ({ ...prev, when: prev.when === id ? null : id }));
  }

  function setWhere(id: WhereId) {
    commit((prev) => {
      const what = prev.what !== "streaming" ? prev.what : "restaurant";
      return { ...prev, what, where: id };
    });
  }

  function pickWatchType(id: WatchSubcategory) {
    commit((prev) => ({ ...prev, watchType: id }));
  }

  function toggleGenre(genre: string) {
    commit((prev) => ({ ...prev, genre: prev.genre === genre ? null : genre }));
  }

  const isStreaming = state.what === "streaming";
  const placeWhat = state.what as PlaceWhatId;
  const typeRefinements = isStreaming ? [] : PLACE_TYPES[placeWhat];
  const vibeRefinements = isStreaming ? [] : PLACE_VIBES[placeWhat];

  return (
    <AssistContext.Provider
      value={{
        busy,
        state,
        promptQuery,
        isStreaming,
        typeRefinements,
        vibeRefinements,
        surface,
        pickWhat,
        toggleType,
        toggleExtra,
        toggleWhen,
        setWhere,
        pickWatchType,
        toggleGenre
      }}
    >
      {children}
    </AssistContext.Provider>
  );
}

/** What · Cuisine/Type · Vibe — sits below the ask input. Where and When live in Advanced Search. */
export function SearchPromptChips() {
  const {
    busy,
    state,
    isStreaming,
    typeRefinements,
    vibeRefinements,
    pickWhat,
    toggleType,
    toggleExtra,
    pickWatchType,
    toggleGenre,
    surface
  } = useAssistContext();

  const onPage = surface === "page";

  return (
    <section className="grid gap-2.5" aria-label="Prompt builder">
      <p className={`px-0.5 text-sm font-semibold ${onPage ? "text-slate" : "text-white/70"}`}>{CONCIERGE_TAGLINE}</p>

      <ChipGroup label="What" onPage={onPage}>
        {WHAT_DEFS.map((def) => (
          <AssistChip
            key={def.id}
            label={def.label}
            busy={busy}
            variant="primary"
            selected={state.what === def.id}
            onPick={() => pickWhat(def.id)}
            onPage={onPage}
          />
        ))}
      </ChipGroup>

      {isStreaming ? (
        <>
          <ChipGroup label="Watch" onPage={onPage}>
            {WATCH_SUBCATEGORIES.map((option) => (
              <AssistChip
                key={option.id}
                label={option.label}
                busy={busy}
                selected={state.watchType === option.id}
                onPick={() => pickWatchType(option.id)}
                onPage={onPage}
              />
            ))}
          </ChipGroup>
          <ChipGroup label="Genre" onPage={onPage}>
            {STREAM_GENRES.map((genre) => (
              <AssistChip
                key={genre}
                label={genre}
                busy={busy}
                selected={state.genre === genre}
                onPick={() => toggleGenre(genre)}
                onPage={onPage}
              />
            ))}
          </ChipGroup>
        </>
      ) : (
        <>
          <ChipGroup label={TYPE_LABELS[state.what as PlaceWhatId]} onPage={onPage}>
            {typeRefinements.map((refinement) => (
              <AssistChip
                key={refinement.id}
                label={refinement.label}
                busy={busy}
                selected={state.typeId === refinement.id}
                onPick={() => toggleType(refinement.id)}
                onPage={onPage}
              />
            ))}
          </ChipGroup>

          <ChipGroup label="Vibe" onPage={onPage}>
            {vibeRefinements.map((refinement) => (
              <AssistChip
                key={refinement.id}
                label={refinement.label}
                busy={busy}
                selected={state.extras.has(refinement.id)}
                onPick={() => toggleExtra(refinement.id)}
                onPage={onPage}
              />
            ))}
          </ChipGroup>
        </>
      )}
    </section>
  );
}

/** Where · When — rendered inside Advanced Search only. */
export function SearchPromptWhereWhen() {
  const { busy, state, toggleWhen, setWhere } = useAssistContext();

  return (
    <div className="grid gap-2.5">
      <ChipGroup label="Where">
        <AssistChip label="Near Me" busy={busy} selected={state.where === "near"} onPick={() => setWhere("near")} />
        <AssistChip
          label="Choose Location"
          busy={busy}
          selected={state.where === "choose"}
          onPick={() => setWhere("choose")}
        />
        <AssistChip
          label="Halfway"
          busy={busy}
          selected={state.where === "halfway"}
          onPick={() => setWhere("halfway")}
        />
      </ChipGroup>

      <ChipGroup label="When">
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
      </ChipGroup>
    </div>
  );
}

export function useSearchPromptAssist() {
  return useAssistContext();
}

/** @deprecated Use SearchPromptAssistProvider + SearchPromptChips */
export function SearchPromptAssist(props: Omit<ProviderProps, "children">) {
  return (
    <SearchPromptAssistProvider {...props}>
      <SearchPromptChips />
    </SearchPromptAssistProvider>
  );
}

function ChipGroup({ label, onPage = false, children }: { label: string; onPage?: boolean; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`w-full text-[0.625rem] font-bold uppercase tracking-[0.18em] sm:w-[5.25rem] sm:shrink-0 ${
          onPage ? "text-slate/60" : "text-white/40"
        }`}
      >
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
  onPage = false,
  onPick
}: {
  label: string;
  busy: boolean;
  variant?: "primary" | "accent";
  selected?: boolean;
  onPage?: boolean;
  onPick: () => void;
}) {
  const tone = onPage
    ? selected && variant === "primary"
      ? "border-koi bg-koi text-white shadow-[0_8px_18px_rgba(255,90,0,0.24)]"
      : selected
        ? "border-koi/70 bg-koi/10 text-ink"
        : "border-line bg-paper text-ink hover:border-koi/40 hover:bg-koi/5"
    : selected && variant === "primary"
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

function builderModeForWhere(where: WhereId): SearchBuilderMode {
  if (where === "halfway") return "halfway";
  if (where === "choose") return "destination";
  return "near_me";
}

function categoryFor(state: BuilderState): VenueCategory {
  if (state.what === "streaming") return "custom";
  const refs = placeRefinementsFor(state.what as PlaceWhatId);
  const type = refs.find((item) => item.group === "type" && item.id === state.typeId);
  if (type?.category) return type.category;
  return WHAT_DEFS.find((item) => item.id === state.what)?.category ?? "restaurant";
}

export function buildPlaceQuery(state: BuilderState): string {
  const def = WHAT_DEFS.find((item) => item.id === state.what) ?? WHAT_DEFS[0];
  const refs = placeRefinementsFor(state.what as PlaceWhatId);
  const type = refs.find((item) => item.group === "type" && item.id === state.typeId);

  const noun = type?.noun ?? def.noun;

  const prefixes: string[] = [];
  const suffixes: string[] = [];

  for (const ref of refs) {
    const selected = ref.group === "type" ? ref.id === state.typeId : state.extras.has(ref.id);
    if (!selected) continue;
    if (ref.prefix) prefixes.push(ref.prefix);
    if (ref.suffix) suffixes.push(ref.suffix);
  }

  if (state.where === "halfway") suffixes.push("halfway between us");
  else if (state.where === "choose") suffixes.push("near a specific location");
  else suffixes.push("near me");

  if (state.when === "open_now") suffixes.push("open now");
  if (state.when === "tonight") suffixes.push("tonight");

  const phrase = [...prefixes, noun, ...suffixes].filter(Boolean).join(" ");
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

function buildStreamQuery(state: BuilderState): string {
  if (state.watchType === "trending") {
    if (state.genre) return `Trending ${state.genre.toLowerCase()} movies and shows tonight`;
    return "What's trending to watch tonight?";
  }
  const noun = state.watchType === "tv_shows" ? "TV shows" : "movies";
  if (state.genre) return `Best ${state.genre.toLowerCase()} ${noun} tonight`;
  return state.watchType === "tv_shows"
    ? "What TV show should I watch tonight?"
    : "What movie should I watch tonight?";
}

function shoppingNoun(query: string): string {
  return query.replace(/ near me$/i, "").toLowerCase();
}
