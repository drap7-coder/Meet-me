"use client";

import { getWatchGenresForSubcategory, getWatchGenreGroupLabel, resolveWatchGenreQueryWord, WATCH_SUBCATEGORIES } from "@/lib/watchBrowse";
import {
  LOCAL_CHIP_CATEGORIES,
  groupHasVibeOptions,
  localChipCategoryById,
  typeRefinementsFor,
  venueCategoryForChip,
  vibeRefinementsFor,
  type LocalChipCategoryId
} from "@/lib/searchBuilderOptions";
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

type WhenId = "open_now" | "tonight";
type WhereId = "near" | "choose" | "halfway";
type SelectedMode = "streaming" | "local";

const CONCIERGE_TAGLINE = "Tap chips to build your ask, or just type it.";

export type BuilderState = {
  selectedMode: SelectedMode;
  localWhat: LocalChipCategoryId;
  typeId: string | null;
  extras: Set<string>;
  when: WhenId | null;
  where: WhereId;
  streamingType: WatchSubcategory | null;
  genre: string | null;
};

type AssistContextValue = {
  busy: boolean;
  state: BuilderState;
  promptQuery: string;
  isStreaming: boolean;
  typeRefinements: ReturnType<typeof typeRefinementsFor>;
  vibeRefinements: ReturnType<typeof vibeRefinementsFor>;
  surface: "hero" | "page";
  pickLocalWhat: (id: LocalChipCategoryId) => void;
  pickStreamingType: (id: WatchSubcategory) => void;
  toggleType: (id: string) => void;
  toggleExtra: (id: string) => void;
  toggleWhen: (id: WhenId) => void;
  setWhere: (id: WhereId) => void;
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
      selectedMode: "streaming",
      localWhat: "food",
      typeId: null,
      extras: new Set<string>(),
      when: null,
      where: "near",
      streamingType: seed.watchSubcategory,
      genre: null
    };
  }

  return {
    selectedMode: "local",
    localWhat: "food",
    typeId: null,
    extras: new Set<string>(),
    when: null,
    where: "near",
    streamingType: null,
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
    const isStreaming = next.selectedMode === "streaming" && Boolean(next.streamingType);
    const query = isStreaming ? buildStreamQuery(next) : buildPlaceQuery(next);
    if (!query) return;
    setPromptQuery(query);
    onPickQuery(query, {
      category: categoryFor(next),
      watchSubcategory: isStreaming ? next.streamingType ?? undefined : undefined,
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
      if (prev.selectedMode === "streaming" && prev.streamingType === seed.watchSubcategory) return prev;
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

  function pickLocalWhat(id: LocalChipCategoryId) {
    commit((prev) => {
      if (prev.selectedMode === "local" && prev.localWhat === id) return prev;
      return {
        ...prev,
        selectedMode: "local",
        localWhat: id,
        typeId: null,
        extras: new Set<string>(),
        streamingType: null,
        genre: null
      };
    });
  }

  function pickStreamingType(id: WatchSubcategory) {
    commit((prev) => {
      if (prev.selectedMode === "streaming" && prev.streamingType === id) {
        return { ...prev, streamingType: null, genre: null };
      }
      const nextGenre =
        prev.genre && getWatchGenresForSubcategory(id).some((option) => option.id === prev.genre) ? prev.genre : null;
      return {
        ...prev,
        selectedMode: "streaming",
        streamingType: id,
        genre: nextGenre,
        typeId: null,
        extras: new Set<string>()
      };
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
    commit((prev) => ({
      ...prev,
      selectedMode: "local",
      localWhat: prev.selectedMode === "local" ? prev.localWhat : "food",
      where: id,
      streamingType: null,
      genre: null
    }));
  }

  function toggleGenre(genreId: string) {
    commit((prev) => {
      if (prev.selectedMode !== "streaming" || !prev.streamingType) return prev;
      return { ...prev, genre: prev.genre === genreId ? null : genreId };
    });
  }

  const isStreaming = state.selectedMode === "streaming";
  const typeRefinements = isStreaming ? [] : typeRefinementsFor(state.localWhat);
  const vibeRefinements = isStreaming || !groupHasVibeOptions(state.localWhat) ? [] : vibeRefinementsFor(state.localWhat);

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
        pickLocalWhat,
        pickStreamingType,
        toggleType,
        toggleExtra,
        toggleWhen,
        setWhere,
        toggleGenre
      }}
    >
      {children}
    </AssistContext.Provider>
  );
}

/** Streaming + Local chip modules below the ask input. Where/When live in Advanced Search. */
export function SearchPromptChips() {
  const {
    busy,
    state,
    isStreaming,
    typeRefinements,
    vibeRefinements,
    pickLocalWhat,
    pickStreamingType,
    toggleType,
    toggleExtra,
    toggleGenre,
    surface
  } = useAssistContext();

  const onPage = surface === "page";
  const showGenres = state.selectedMode === "streaming" && Boolean(state.streamingType);
  const streamGenres = state.streamingType ? getWatchGenresForSubcategory(state.streamingType) : [];

  return (
    <section className="grid gap-3" aria-label="Prompt builder">
      <p className={`px-0.5 text-sm font-semibold ${onPage ? "text-slate" : "text-white/70"}`}>{CONCIERGE_TAGLINE}</p>

      <div
        className={`grid gap-2.5 rounded-[16px] border p-3 sm:p-3.5 ${
          onPage ? "border-line/80 bg-paper shadow-soft" : "border-white/12 bg-white/[0.04]"
        }`}
      >
        <ChipGroup label="📺 Streaming" onPage={onPage}>
          {WATCH_SUBCATEGORIES.map((option) => (
            <AssistChip
              key={option.id}
              label={option.label}
              busy={busy}
              variant="primary"
              selected={state.selectedMode === "streaming" && state.streamingType === option.id}
              onPick={() => pickStreamingType(option.id)}
              onPage={onPage}
            />
          ))}
        </ChipGroup>

        {showGenres && state.streamingType ? (
          <ChipGroup label={getWatchGenreGroupLabel(state.streamingType)} onPage={onPage}>
            {streamGenres.map((genre) => (
              <AssistChip
                key={genre.id}
                label={genre.label}
                busy={busy}
                selected={state.genre === genre.id}
                onPick={() => toggleGenre(genre.id)}
                onPage={onPage}
              />
            ))}
          </ChipGroup>
        ) : null}
      </div>

      <div className={`h-px ${onPage ? "bg-line/70" : "bg-white/10"}`} aria-hidden="true" />

      <div className="grid gap-2.5">
        <ChipGroup label="📍 Local" onPage={onPage}>
          {LOCAL_CHIP_CATEGORIES.map((def) => (
            <AssistChip
              key={def.id}
              label={def.label}
              busy={busy}
              variant="primary"
              selected={state.selectedMode === "local" && state.localWhat === def.id}
              onPick={() => pickLocalWhat(def.id)}
              onPage={onPage}
            />
          ))}
        </ChipGroup>

        {!isStreaming ? (
          <>
            <ChipGroup label={localChipCategoryById(state.localWhat).subtypeLabel} onPage={onPage}>
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

            {vibeRefinements.length ? (
              <ChipGroup label="✨ Vibe" onPage={onPage}>
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
            ) : null}
          </>
        ) : null}
      </div>
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
  if (state.selectedMode === "streaming") return "custom";
  return venueCategoryForChip(state.localWhat, state.typeId);
}

export function buildPlaceQuery(state: BuilderState): string {
  const def = localChipCategoryById(state.localWhat);
  const refs = [...typeRefinementsFor(state.localWhat), ...vibeRefinementsFor(state.localWhat)];
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

export function buildStreamQuery(state: BuilderState): string {
  const genre = resolveWatchGenreQueryWord(state.streamingType, state.genre);
  const type = state.streamingType;

  if (type === "trending") {
    if (genre) return `Trending ${genre} movies and shows tonight`;
    return "What's trending to watch tonight?";
  }

  if (type === "tv_shows") {
    if (genre) return `What ${genre} TV show should I watch tonight?`;
    return "What TV show should I watch tonight?";
  }

  if (type === "movies") {
    if (genre) return `What ${genre} movie should I watch tonight?`;
    return "What movie should I watch tonight?";
  }

  return "What should I watch tonight?";
}
