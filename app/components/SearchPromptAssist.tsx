"use client";

import { getWatchGenresForSubcategory, getWatchGenreGroupLabel, resolveWatchGenreQueryWord, WATCH_TYPE_OPTIONS, WATCH_VIBE_OPTIONS, type WatchStreamVibe } from "@/lib/watchBrowse";
import {
  LOCAL_CHIP_CATEGORIES,
  groupHasVibeOptions,
  localChipCategoryById,
  typeRefinementsFor,
  venueCategoryForChip,
  vibeRefinementsFor,
  type LocalChipCategoryId
} from "@/lib/searchBuilderOptions";
import { STREAMING_SERVICES, streamingServiceQueryPhrase } from "@/lib/streamingServices";
import { HeroSectionLabel } from "@/app/components/home/HeroSectionLabel";
import { ModePickChip } from "@/app/components/ModePickChip";
import { StreamingServiceChip } from "@/app/components/StreamingServiceChip";
import type { SearchHalfwayRequest, VenueCategory, WatchSubcategory } from "@/lib/types";
import type { SearchBuilderMode } from "@/lib/searchBuilderOptions";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type PickQueryOptions = {
  watchSubcategory?: WatchSubcategory;
  category?: VenueCategory;
  searchMode?: SearchHalfwayRequest["searchMode"];
  builderMode?: SearchBuilderMode;
  streamingServiceIds?: string[];
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
type SelectedMode = "streaming" | "local" | null;

const CONCIERGE_TAGLINE = "What are you in the mood for?";

export type BuilderState = {
  selectedMode: SelectedMode;
  localWhat: LocalChipCategoryId | null;
  typeId: string | null;
  extras: Set<string>;
  when: WhenId | null;
  where: WhereId;
  streamingType: WatchSubcategory | null;
  streamingVibe: WatchStreamVibe | null;
  genre: string | null;
  streamingServices: Set<string>;
};

type AssistContextValue = {
  busy: boolean;
  state: BuilderState;
  promptQuery: string;
  isStreaming: boolean;
  typeRefinements: ReturnType<typeof typeRefinementsFor>;
  vibeRefinements: ReturnType<typeof vibeRefinementsFor>;
  surface: "hero" | "page";
  pickMode: (mode: Exclude<SelectedMode, null>) => void;
  pickExplore: () => void;
  pickMeetHalfway: () => void;
  pickLocalWhat: (id: LocalChipCategoryId) => void;
  pickStreamingType: (id: "movies" | "tv_shows") => void;
  toggleType: (id: string) => void;
  toggleExtra: (id: string) => void;
  toggleWhen: (id: WhenId) => void;
  setWhere: (id: WhereId) => void;
  toggleGenre: (genre: string) => void;
  toggleStreamingVibe: (vibe: WatchStreamVibe) => void;
  toggleStreamingService: (id: string) => void;
};

const AssistContext = createContext<AssistContextValue | null>(null);

function useAssistContext() {
  const value = useContext(AssistContext);
  if (!value) throw new Error("Search prompt assist components must render inside SearchPromptAssistProvider");
  return value;
}

function normalizeStreamType(subcategory?: WatchSubcategory | null): "movies" | "tv_shows" | null {
  if (subcategory === "movies" || subcategory === "tv_shows") return subcategory;
  return null;
}

function initialBuilderState(seed?: Pick<PickQueryOptions, "category" | "watchSubcategory">): BuilderState {
  if (seed?.category === "custom" && seed.watchSubcategory) {
    const seededTrending = seed.watchSubcategory === "trending";
    return {
      selectedMode: "streaming",
      localWhat: null,
      typeId: null,
      extras: new Set<string>(),
      when: null,
      where: "near",
      streamingType: seededTrending ? "movies" : normalizeStreamType(seed.watchSubcategory),
      streamingVibe: seededTrending ? "trending" : null,
      genre: null,
      streamingServices: new Set<string>()
    };
  }

  return {
    selectedMode: null,
    localWhat: null,
    typeId: null,
    extras: new Set<string>(),
    when: null,
    where: "near",
    streamingType: null,
    streamingVibe: null,
    genre: null,
    streamingServices: new Set<string>()
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
    const streamType = normalizeStreamType(next.streamingType);
    const isStreaming =
      next.selectedMode === "streaming" &&
      (Boolean(streamType) || next.streamingServices.size > 0 || Boolean(next.streamingVibe));
    const isExplore = next.selectedMode === "local" && Boolean(next.localWhat);

    if (!isStreaming && !isExplore) {
      setPromptQuery("");
      return;
    }

    const query = isStreaming ? buildStreamQuery(next) : buildPlaceQuery(next);
    if (!query) return;
    setPromptQuery(query);
    onPickQuery(query, {
      category: categoryFor(next),
      watchSubcategory: isStreaming ? streamType ?? "movies" : undefined,
      streamingServiceIds: isStreaming ? [...next.streamingServices] : undefined,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pickMode(mode: Exclude<SelectedMode, null>) {
    commit((prev) => {
      if (prev.selectedMode === mode) {
        return {
          ...prev,
          selectedMode: null,
          localWhat: null,
          typeId: null,
          extras: new Set<string>(),
          streamingType: null,
          streamingVibe: null,
          genre: null,
          streamingServices: new Set<string>()
        };
      }

      if (mode === "streaming") {
        return {
          ...prev,
          selectedMode: "streaming",
          localWhat: null,
          typeId: null,
          extras: new Set<string>(),
          streamingType: null,
          streamingVibe: null,
          genre: null,
          streamingServices: new Set<string>()
        };
      }

      return {
        ...prev,
        selectedMode: "local",
        localWhat: null,
        typeId: null,
        extras: new Set<string>(),
        streamingType: null,
        streamingVibe: null,
        genre: null,
        streamingServices: new Set<string>()
      };
    });
  }

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

  function pickExplore() {
    commit((prev) => {
      const active = prev.selectedMode === "local" && prev.where !== "halfway";
      if (active) {
        return initialBuilderState(seed);
      }

      return {
        ...prev,
        selectedMode: "local",
        localWhat: null,
        typeId: null,
        extras: new Set<string>(),
        when: null,
        where: "near",
        streamingType: null,
        streamingVibe: null,
        genre: null,
        streamingServices: new Set<string>()
      };
    });
  }

  function pickMeetHalfway() {
    commit((prev) => {
      const active = prev.selectedMode === "local" && prev.where === "halfway";
      if (active) {
        return initialBuilderState(seed);
      }

      return {
        ...prev,
        selectedMode: "local",
        localWhat: "food",
        typeId: null,
        extras: new Set<string>(),
        when: null,
        where: "halfway",
        streamingType: null,
        streamingVibe: null,
        genre: null,
        streamingServices: new Set<string>()
      };
    });
  }

  function pickLocalWhat(id: LocalChipCategoryId) {
    commit((prev) => {
      if (prev.selectedMode === "local" && prev.localWhat === id) {
        return { ...prev, localWhat: null, typeId: null, extras: new Set<string>() };
      }
      return {
        ...prev,
        selectedMode: "local",
        localWhat: id,
        typeId: null,
        extras: new Set<string>(),
        streamingType: null,
        streamingVibe: null,
        genre: null,
        streamingServices: new Set<string>()
      };
    });
  }

  function pickStreamingType(id: "movies" | "tv_shows") {
    commit((prev) => {
      if (prev.selectedMode === "streaming" && prev.streamingType === id) {
        return { ...prev, streamingType: null, streamingVibe: null, genre: null };
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
      localWhat: prev.selectedMode === "local" ? prev.localWhat : null,
      where: id,
      streamingType: null,
      streamingVibe: null,
      genre: null,
      streamingServices: new Set<string>()
    }));
  }

  function toggleGenre(genreId: string) {
    commit((prev) => {
      if (prev.selectedMode !== "streaming" || !normalizeStreamType(prev.streamingType)) return prev;
      return { ...prev, genre: prev.genre === genreId ? null : genreId };
    });
  }

  function toggleStreamingVibe(vibe: WatchStreamVibe) {
    commit((prev) => {
      if (prev.selectedMode !== "streaming" || !normalizeStreamType(prev.streamingType)) return prev;
      return { ...prev, streamingVibe: prev.streamingVibe === vibe ? null : vibe };
    });
  }

  function toggleStreamingService(id: string) {
    commit((prev) => {
      if (prev.selectedMode !== "streaming") return prev;
      const streamingServices = new Set(prev.streamingServices);
      if (streamingServices.has(id)) streamingServices.delete(id);
      else streamingServices.add(id);
      return { ...prev, streamingServices };
    });
  }

  const isStreaming = state.selectedMode === "streaming" && Boolean(normalizeStreamType(state.streamingType));
  const exploreCategory = state.selectedMode === "local" ? state.localWhat : null;
  const typeRefinements = exploreCategory ? typeRefinementsFor(exploreCategory) : [];
  const vibeRefinements =
    exploreCategory && groupHasVibeOptions(exploreCategory) ? vibeRefinementsFor(exploreCategory) : [];

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
        pickMode,
        pickExplore,
        pickMeetHalfway,
        pickLocalWhat,
        pickStreamingType,
        toggleType,
        toggleExtra,
        toggleWhen,
        setWhere,
        toggleGenre,
        toggleStreamingVibe,
        toggleStreamingService
      }}
    >
      {children}
    </AssistContext.Provider>
  );
}

/** Premium Streaming / Explore cards — render above the ask input. */
export function SearchPromptModePicker() {
  const { busy, state, pickMode, pickExplore, pickMeetHalfway, surface } = useAssistContext();
  const onPage = surface === "page";
  const exploreSelected = state.selectedMode === "local" && state.where !== "halfway";
  const halfwaySelected = state.selectedMode === "local" && state.where === "halfway";

  return (
    <section className="grid gap-2.5" aria-label="Choose a path">
      <HeroSectionLabel onPage={onPage}>{CONCIERGE_TAGLINE}</HeroSectionLabel>

      <div className="-mx-0.5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-0.5 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
        <ModePickChip
          emoji="🍿"
          title="Streaming"
          subtitle="Movies & TV picks"
          busy={busy}
          selected={state.selectedMode === "streaming"}
          onPick={() => pickMode("streaming")}
          onPage={onPage}
          tone="streaming"
          className="snap-start min-w-[9.5rem] flex-1 sm:min-w-0"
        />
        <ModePickChip
          emoji="🧭"
          title="Explore"
          subtitle="Food, drinks & local spots"
          busy={busy}
          selected={exploreSelected}
          onPick={pickExplore}
          onPage={onPage}
          tone="explore"
          className="snap-start min-w-[9.5rem] flex-1 sm:min-w-0"
        />
        <ModePickChip
          emoji="📍"
          title="Meet Halfway"
          subtitle="Fairest spot for the group"
          busy={busy}
          selected={halfwaySelected}
          onPick={pickMeetHalfway}
          onPage={onPage}
          tone="halfway"
          className="snap-start min-w-[9.5rem] flex-1 sm:min-w-0"
        />
      </div>
    </section>
  );
}

/** Refinement chips — render below the ask input after a path is chosen. */
export function SearchPromptDetailChips() {
  const {
    busy,
    state,
    typeRefinements,
    vibeRefinements,
    pickLocalWhat,
    pickStreamingType,
    toggleType,
    toggleExtra,
    toggleGenre,
    toggleStreamingVibe,
    toggleStreamingService,
    surface
  } = useAssistContext();

  const onPage = surface === "page";
  const moduleBoxClass = `grid gap-3 rounded-[18px] border p-3.5 sm:gap-3.5 sm:p-4 ${
    onPage ? "border-line/80 bg-paper shadow-soft" : "border-white/12 bg-white/[0.04] backdrop-blur-sm"
  }`;
  const showStreamingType = state.selectedMode === "streaming";
  const streamType = state.streamingType === "movies" || state.streamingType === "tv_shows" ? state.streamingType : null;
  const showStreamingRefinements = showStreamingType && Boolean(streamType);
  const showExploreCategories = state.selectedMode === "local";
  const showExploreDetails = showExploreCategories && Boolean(state.localWhat);
  const streamGenres = streamType ? getWatchGenresForSubcategory(streamType) : [];

  if (!showStreamingType && !showExploreCategories) return null;

  return (
    <section className="grid gap-3" aria-label="Prompt refinements">
      <div className={moduleBoxClass}>
        {showStreamingType ? (
          <>
            <ChipGroup label="Streaming Services" onPage={onPage}>
              {STREAMING_SERVICES.map((service) => (
                <StreamingServiceChip
                  key={service.id}
                  service={service}
                  busy={busy}
                  selected={state.streamingServices.has(service.id)}
                  onPick={() => toggleStreamingService(service.id)}
                  onPage={onPage}
                />
              ))}
            </ChipGroup>

            <div className={`h-px ${onPage ? "bg-line/60" : "bg-white/10"}`} aria-hidden="true" />

            <ChipGroup label="Type" onPage={onPage}>
              {WATCH_TYPE_OPTIONS.map((option) => (
                <AssistChip
                  key={option.id}
                  label={option.label}
                  busy={busy}
                  variant="primary"
                  selected={streamType === option.id}
                  onPick={() => pickStreamingType(option.id)}
                  onPage={onPage}
                />
              ))}
            </ChipGroup>

            {showStreamingRefinements ? (
              <>
                <div className={`h-px ${onPage ? "bg-line/60" : "bg-white/10"}`} aria-hidden="true" />

                <ChipGroup label="✨ Vibe" onPage={onPage}>
                  {WATCH_VIBE_OPTIONS.map((option) => (
                    <AssistChip
                      key={option.id}
                      label={option.label}
                      busy={busy}
                      selected={state.streamingVibe === option.id}
                      onPick={() => toggleStreamingVibe(option.id)}
                      onPage={onPage}
                    />
                  ))}
                </ChipGroup>

                <ChipGroup label={getWatchGenreGroupLabel(streamType)} onPage={onPage}>
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
              </>
            ) : null}
          </>
        ) : null}

        {showExploreCategories ? (
          <>
            <ChipGroup label="Category" onPage={onPage}>
              {LOCAL_CHIP_CATEGORIES.map((def) => (
                <AssistChip
                  key={def.id}
                  label={def.label}
                  busy={busy}
                  variant="primary"
                  selected={state.localWhat === def.id}
                  onPick={() => pickLocalWhat(def.id)}
                  onPage={onPage}
                />
              ))}
            </ChipGroup>

            {showExploreDetails && state.localWhat ? (
              <>
                <div className={`h-px ${onPage ? "bg-line/60" : "bg-white/10"}`} aria-hidden="true" />
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
          </>
        ) : null}
      </div>
    </section>
  );
}

/** @deprecated Prefer SearchPromptModePicker + ask input + SearchPromptDetailChips. */
export function SearchPromptChips() {
  return (
    <>
      <SearchPromptModePicker />
      <SearchPromptDetailChips />
    </>
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
  if (!state.localWhat) return "restaurant";
  return venueCategoryForChip(state.localWhat, state.typeId);
}

export function buildPlaceQuery(state: BuilderState): string {
  if (!state.localWhat) return "";

  const def = localChipCategoryById(state.localWhat);
  const refs = [
    ...typeRefinementsFor(state.localWhat),
    ...vibeRefinementsFor(state.localWhat)
  ];
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
  const type = state.streamingType === "movies" || state.streamingType === "tv_shows" ? state.streamingType : null;
  const genre = resolveWatchGenreQueryWord(type, state.genre);
  const providerPhrase = streamingServiceQueryPhrase([...state.streamingServices]);
  const timing = state.when === "open_now" ? "" : " tonight";
  const trending = state.streamingVibe === "trending";

  if (trending) {
    if (type === "tv_shows") {
      if (genre) return `Trending ${genre} TV shows${providerPhrase}${timing}`;
      return `Trending TV shows${providerPhrase}${timing}`;
    }
    if (type === "movies") {
      if (genre) return `Trending ${genre} movies${providerPhrase}${timing}`;
      return `Trending movies${providerPhrase}${timing}`;
    }
    if (genre) return `Trending ${genre} movies and shows${providerPhrase}${timing}`;
    return `What's trending to watch${providerPhrase}${timing}?`;
  }

  if (type === "tv_shows") {
    if (genre) return `What ${genre} TV show should I watch${providerPhrase}${timing}?`;
    return `What TV show should I watch${providerPhrase}${timing}?`;
  }

  if (type === "movies") {
    if (genre) return `What ${genre} movie should I watch${providerPhrase}${timing}?`;
    return `What movie should I watch${providerPhrase}${timing}?`;
  }

  return `What should I watch${providerPhrase}${timing}?`;
}
