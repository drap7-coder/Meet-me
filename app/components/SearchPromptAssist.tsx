"use client";

import { getWatchGenresForSubcategory, getWatchGenreGroupLabel, resolveWatchGenreQueryWord, WATCH_TYPE_OPTIONS, WATCH_VIBE_OPTIONS, type WatchStreamVibe } from "@/lib/watchBrowse";
import {
  LOCAL_CHIP_CATEGORIES,
  VISIBLE_LOCAL_CHIP_CATEGORIES,
  groupHasVibeOptions,
  localChipCategoryById,
  typeRefinementsFor,
  venueCategoryForChip,
  vibeRefinementsFor,
  type LocalChipCategoryId
} from "@/lib/searchBuilderOptions";
import { resolveEventTypeRefinement, sportsTeamChipLabel } from "@/lib/eventBuilderOptions";
import { MUSIC_GENRES, musicGenreById, musicGenreChipLabel } from "@/lib/musicGenres";
import { MUSIC_ARTISTS, musicArtistById, musicArtistChipLabel } from "@/lib/musicArtists";
import { majorSportById, localTeamsForSport, otherTeamsForSport, sportIdForTeam, sportsTeamById } from "@/lib/sportsTeams";
import { STREAMING_SERVICES, streamingServiceQueryPhrase } from "@/lib/streamingServices";
import type { HeroPopularSearch } from "@/app/components/home/HeroPopularSearches";
import { HeroSectionLabel } from "@/app/components/home/HeroSectionLabel";
import { ModePickChip } from "@/app/components/ModePickChip";
import { StreamingServiceChip } from "@/app/components/StreamingServiceChip";
import type { LatLng, SearchHalfwayRequest, VenueCategory, WatchSubcategory } from "@/lib/types";
import type { SearchBuilderMode } from "@/lib/searchBuilderOptions";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type PickQueryOptions = {
  watchSubcategory?: WatchSubcategory;
  category?: VenueCategory;
  searchMode?: SearchHalfwayRequest["searchMode"];
  builderMode?: SearchBuilderMode;
  streamingServiceIds?: string[];
  /** Sports/events chip picks should go through koi-search, not search-halfway. */
  routeViaFreeform?: boolean;
};

type ProviderProps = {
  busy?: boolean;
  builderMode?: SearchBuilderMode;
  surface?: "hero" | "page";
  /** Saved/current origin — used to split local vs all team chips. */
  userCoordinates?: LatLng;
  children: ReactNode;
};

type WhereId = "near" | "choose" | "halfway";
type SelectedMode = "streaming" | "local" | null;

const CONCIERGE_TAGLINE = "Not sure? Try one of these";

export type BuilderState = {
  selectedMode: SelectedMode;
  localWhat: LocalChipCategoryId | null;
  typeId: string | null;
  sportsTeamId: string | null;
  musicArtistId: string | null;
  extras: Set<string>;
  where: WhereId;
  streamingType: WatchSubcategory | null;
  streamingVibe: WatchStreamVibe | null;
  genre: string | null;
  streamingServices: Set<string>;
};

export type FilterPill = {
  id: string;
  label: string;
};

export type FilterPreview = {
  query: string;
  options: PickQueryOptions;
  isStreaming: boolean;
};

type AssistContextValue = {
  busy: boolean;
  state: BuilderState;
  promptQuery: string;
  filterPills: FilterPill[];
  filterPreview: FilterPreview | null;
  isStreaming: boolean;
  userCoordinates?: LatLng;
  typeRefinements: ReturnType<typeof typeRefinementsFor>;
  vibeRefinements: ReturnType<typeof vibeRefinementsFor>;
  surface: "hero" | "page";
  pickMode: (mode: Exclude<SelectedMode, null>) => void;
  pickExplore: () => void;
  pickMeetHalfway: () => void;
  pickLocalWhat: (id: LocalChipCategoryId) => void;
  pickStreamingType: (id: "movies" | "tv_shows") => void;
  toggleType: (id: string) => void;
  toggleSportsTeam: (id: string) => void;
  toggleMusicArtist: (id: string) => void;
  toggleExtra: (id: string) => void;
  setWhere: (id: WhereId) => void;
  toggleGenre: (genre: string) => void;
  toggleStreamingVibe: (vibe: WatchStreamVibe) => void;
  toggleStreamingService: (id: string) => void;
  removeFilterPill: (pillId: string) => void;
  applyPopularPreset: (preset: HeroPopularSearch) => void;
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
      sportsTeamId: null,
      musicArtistId: null,
      extras: new Set<string>(),
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
    sportsTeamId: null,
    musicArtistId: null,
    extras: new Set<string>(),
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
  surface = "hero",
  userCoordinates,
  children
}: ProviderProps) {
  const [state, setState] = useState<BuilderState>(() => initialBuilderState());
  const [promptQuery, setPromptQuery] = useState("");

  function updatePreview(next: BuilderState) {
    const preview = resolveFilterPreview(next);
    setPromptQuery(preview?.query ?? "");
  }

  function commit(updater: (prev: BuilderState) => BuilderState) {
    setState((prev) => {
      const next = updater(prev);
      updatePreview(next);
      return next;
    });
  }

  function replaceState(next: BuilderState) {
    setState(next);
    updatePreview(next);
  }

  useEffect(() => {
    updatePreview(state);
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
          sportsTeamId: null,
          musicArtistId: null,
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
          sportsTeamId: null,
          musicArtistId: null,
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
        sportsTeamId: null,
        musicArtistId: null,
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
      updatePreview(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builderMode]);

  function pickExplore() {
    commit((prev) => {
      const active = prev.selectedMode === "local" && prev.where !== "halfway";
      if (active) {
        return initialBuilderState();
      }

      return {
        ...prev,
        selectedMode: "local",
        localWhat: null,
        typeId: null,
        sportsTeamId: null,
        musicArtistId: null,
        extras: new Set<string>(),
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
        return initialBuilderState();
      }

      return {
        ...prev,
        selectedMode: "local",
        localWhat: "food",
        typeId: null,
        sportsTeamId: null,
        musicArtistId: null,
        extras: new Set<string>(),
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
        return { ...prev, localWhat: null, typeId: null, sportsTeamId: null, musicArtistId: null, extras: new Set<string>() };
      }
      return {
        ...prev,
        selectedMode: "local",
        localWhat: id,
        typeId: null,
        sportsTeamId: null,
        musicArtistId: null,
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
    commit((prev) => {
      const nextTypeId = prev.typeId === id ? null : id;
      const keepGenre =
        nextTypeId === "concerts" && prev.genre && musicGenreById(prev.genre) ? prev.genre : null;
      return {
        ...prev,
        typeId: nextTypeId,
        sportsTeamId: null,
        musicArtistId: nextTypeId === "concerts" ? prev.musicArtistId : null,
        genre: keepGenre
      };
    });
  }

  function toggleSportsTeam(id: string) {
    commit((prev) => {
      const sportId = sportIdForTeam(id) ?? prev.typeId;
      return {
        ...prev,
        selectedMode: "local",
        localWhat: "sports",
        typeId: sportId,
        sportsTeamId: prev.sportsTeamId === id ? null : id
      };
    });
  }

  function toggleMusicArtist(id: string) {
    commit((prev) => ({
      ...prev,
      selectedMode: "local",
      localWhat: "events",
      typeId: "concerts",
      musicArtistId: prev.musicArtistId === id ? null : id,
      genre: null
    }));
  }

  function toggleExtra(id: string) {
    commit((prev) => {
      const extras = new Set(prev.extras);
      if (extras.has(id)) extras.delete(id);
      else extras.add(id);
      return { ...prev, extras };
    });
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
      if (prev.selectedMode === "streaming" && normalizeStreamType(prev.streamingType)) {
        return { ...prev, genre: prev.genre === genreId ? null : genreId };
      }
      if (prev.localWhat === "events" && prev.typeId === "concerts") {
        return {
          ...prev,
          genre: prev.genre === genreId ? null : genreId,
          musicArtistId: null
        };
      }
      return prev;
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

  function removeFilterPill(pillId: string) {
    commit((prev) => removeFilterFromState(prev, pillId));
  }

  function applyPopularPreset(preset: HeroPopularSearch) {
    replaceState(builderStateFromPopularPreset(preset));
  }

  const filterPreview = resolveFilterPreview(state);
  const filterPills = buildFilterPills(state);
  const isStreaming = Boolean(filterPreview?.isStreaming);
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
        filterPills,
        filterPreview,
        isStreaming,
        userCoordinates,
        typeRefinements,
        vibeRefinements,
        surface,
        pickMode,
        pickExplore,
        pickMeetHalfway,
        pickLocalWhat,
        pickStreamingType,
        toggleType,
        toggleSportsTeam,
        toggleMusicArtist,
        toggleExtra,
        setWhere,
        toggleGenre,
        toggleStreamingVibe,
        toggleStreamingService,
        removeFilterPill,
        applyPopularPreset
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
    toggleSportsTeam,
    toggleMusicArtist,
    toggleExtra,
    toggleGenre,
    toggleStreamingVibe,
    toggleStreamingService,
    surface,
    userCoordinates
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

  const showSportsTeams = state.localWhat === "sports" && Boolean(state.typeId);
  const showMusicGenres = state.localWhat === "events" && state.typeId === "concerts";
  const showMusicArtists = showMusicGenres;
  const localSportsTeams = showSportsTeams ? localTeamsForSport(state.typeId, userCoordinates) : [];
  const otherSportsTeams = showSportsTeams ? otherTeamsForSport(state.typeId, userCoordinates) : [];
  const hasLocalSportsTeams = localSportsTeams.length > 0;

  function renderSportsTeamChip(team: (typeof localSportsTeams)[number]) {
    return (
      <AssistChip
        key={team.id}
        label={`${team.logo} ${team.label}`}
        busy={busy}
        variant={state.sportsTeamId === team.id ? "primary" : "accent"}
        selected={state.sportsTeamId === team.id}
        emphasis={state.sportsTeamId === team.id}
        onPick={() => toggleSportsTeam(team.id)}
        onPage={onPage}
      />
    );
  }

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
                      variant={state.genre === genre.id ? "primary" : "accent"}
                      selected={state.genre === genre.id}
                      emphasis={state.genre === genre.id}
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
              {VISIBLE_LOCAL_CHIP_CATEGORIES.map((def) => (
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

                {showMusicArtists ? (
                  <>
                    <div className={`h-px ${onPage ? "bg-line/60" : "bg-white/10"}`} aria-hidden="true" />
                    <ChipGroup label="🎤 Artists" onPage={onPage}>
                      {MUSIC_ARTISTS.map((artist) => (
                        <AssistChip
                          key={artist.id}
                          label={artist.label}
                          busy={busy}
                          variant={state.musicArtistId === artist.id ? "primary" : "accent"}
                          selected={state.musicArtistId === artist.id}
                          emphasis={state.musicArtistId === artist.id}
                          onPick={() => toggleMusicArtist(artist.id)}
                          onPage={onPage}
                        />
                      ))}
                    </ChipGroup>
                  </>
                ) : null}

                {showMusicGenres ? (
                  <>
                    <div className={`h-px ${onPage ? "bg-line/60" : "bg-white/10"}`} aria-hidden="true" />
                    <ChipGroup label="🎵 Genre" onPage={onPage}>
                      {MUSIC_GENRES.map((genre) => (
                        <AssistChip
                          key={genre.id}
                          label={musicGenreChipLabel(genre.id)}
                          busy={busy}
                          variant={state.genre === genre.id ? "primary" : "accent"}
                          selected={state.genre === genre.id}
                          emphasis={state.genre === genre.id}
                          onPick={() => toggleGenre(genre.id)}
                          onPage={onPage}
                        />
                      ))}
                    </ChipGroup>
                  </>
                ) : null}

                {showSportsTeams && (hasLocalSportsTeams || otherSportsTeams.length) ? (
                  <>
                    <div className={`h-px ${onPage ? "bg-line/60" : "bg-white/10"}`} aria-hidden="true" />
                    {hasLocalSportsTeams ? (
                      <ChipGroup label="📍 Near you" onPage={onPage}>
                        {localSportsTeams.map(renderSportsTeamChip)}
                      </ChipGroup>
                    ) : null}
                    {otherSportsTeams.length ? (
                      <>
                        {hasLocalSportsTeams ? (
                          <div className={`h-px ${onPage ? "bg-line/60" : "bg-white/10"}`} aria-hidden="true" />
                        ) : null}
                        <ChipGroup label={hasLocalSportsTeams ? "🌎 All teams" : "🏟️ Teams"} onPage={onPage}>
                          {otherSportsTeams.map(renderSportsTeamChip)}
                        </ChipGroup>
                      </>
                    ) : null}
                  </>
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

/** Where — rendered inside Advanced Search only. */
export function SearchPromptWhereWhen() {
  const { busy, state, setWhere } = useAssistContext();

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
  emphasis = false,
  onPage = false,
  onPick
}: {
  label: string;
  busy: boolean;
  variant?: "primary" | "accent";
  selected?: boolean;
  emphasis?: boolean;
  onPage?: boolean;
  onPick: () => void;
}) {
  const tone = onPage
    ? selected && variant === "primary"
      ? emphasis
        ? "border-koi bg-koi text-white shadow-[0_10px_22px_rgba(255,90,0,0.32)] ring-2 ring-koi/35"
        : "border-koi bg-koi text-white shadow-[0_8px_18px_rgba(255,90,0,0.24)]"
      : selected
        ? "border-koi/70 bg-koi/10 text-ink"
        : "border-line bg-paper text-ink hover:border-koi/40 hover:bg-koi/5"
    : selected && variant === "primary"
      ? emphasis
        ? "border-koi bg-koi text-white shadow-[0_10px_22px_rgba(255,90,0,0.32)] ring-2 ring-koi/40"
        : "border-koi bg-koi text-white shadow-[0_8px_18px_rgba(255,90,0,0.24)]"
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

function eventLocationSuffix(where: WhereId) {
  if (where === "halfway") return "halfway between us";
  if (where === "choose") return "near a specific location";
  return "near me";
}

export function buildPlaceQuery(state: BuilderState): string {
  if (state.localWhat === "sports") {
    const suffix = eventLocationSuffix(state.where);

    if (state.sportsTeamId) {
      const team = sportsTeamById(state.sportsTeamId);
      if (team) {
        const phrase = `${team.searchTerm} games`;
        return phrase.charAt(0).toUpperCase() + phrase.slice(1);
      }
    }

    const sport = majorSportById(state.typeId);
    if (sport) {
      const phrase = `${sport.label} games ${suffix}`;
      return phrase.charAt(0).toUpperCase() + phrase.slice(1);
    }

    const phrase = `Live sports ${suffix}`;
    return phrase.charAt(0).toUpperCase() + phrase.slice(1);
  }

  if (state.localWhat === "events") {
    const suffix = eventLocationSuffix(state.where);

    if (state.typeId === "concerts" && state.musicArtistId) {
      const artist = musicArtistById(state.musicArtistId);
      if (artist) {
        const phrase = `${artist.searchTerm} concerts ${suffix}`;
        return phrase.charAt(0).toUpperCase() + phrase.slice(1);
      }
    }

    const eventType = resolveEventTypeRefinement(state.typeId);
    if (eventType?.noun) {
      const musicGenre = state.typeId === "concerts" ? musicGenreById(state.genre) : null;
      const noun = musicGenre ? `${musicGenre.queryWord} concerts` : eventType.noun;
      const phrase = `${noun} ${suffix}`;
      return phrase.charAt(0).toUpperCase() + phrase.slice(1);
    }

    const phrase = `Things to do ${suffix} this weekend`;
    return phrase.charAt(0).toUpperCase() + phrase.slice(1);
  }

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

  const phrase = [...prefixes, noun, ...suffixes].filter(Boolean).join(" ");
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

export function buildStreamQuery(state: BuilderState): string {
  const type = state.streamingType === "movies" || state.streamingType === "tv_shows" ? state.streamingType : null;
  const genre = resolveWatchGenreQueryWord(type, state.genre);
  const providerPhrase = streamingServiceQueryPhrase([...state.streamingServices]);
  const trending = state.streamingVibe === "trending";
  const classic = state.streamingVibe === "classic";

  if (trending) {
    if (type === "tv_shows") {
      if (genre) return `Trending ${genre} TV shows${providerPhrase}`;
      return `Trending TV shows${providerPhrase}`;
    }
    if (type === "movies") {
      if (genre) return `Trending ${genre} movies${providerPhrase}`;
      return `Trending movies${providerPhrase}`;
    }
    if (genre) return `Trending ${genre} movies and shows${providerPhrase}`;
    return `What's trending to watch${providerPhrase}?`;
  }

  if (classic) {
    if (type === "tv_shows") {
      if (genre) return `Best classic ${genre} TV shows${providerPhrase}`;
      return `Best classic TV shows${providerPhrase}`;
    }
    if (type === "movies") {
      if (genre) return `Best classic ${genre} movies${providerPhrase}`;
      return `Best classic movies${providerPhrase}`;
    }
    if (genre) return `Best classic ${genre} movies and shows${providerPhrase}`;
    return `What classic should I watch${providerPhrase}?`;
  }

  if (type === "tv_shows") {
    if (genre) return `What ${genre} TV show should I watch${providerPhrase}?`;
    return `What TV show should I watch${providerPhrase}?`;
  }

  if (type === "movies") {
    if (genre) return `What ${genre} movie should I watch${providerPhrase}?`;
    return `What movie should I watch${providerPhrase}?`;
  }

  return `What should I watch${providerPhrase}?`;
}

function resolveFilterPreview(state: BuilderState): FilterPreview | null {
  const streamType = normalizeStreamType(state.streamingType);
  const isStreaming =
    state.selectedMode === "streaming" &&
    (Boolean(streamType) || state.streamingServices.size > 0 || Boolean(state.streamingVibe));
  const isExplore = state.selectedMode === "local" && Boolean(state.localWhat);

  if (!isStreaming && !isExplore) return null;

  const query = isStreaming ? buildStreamQuery(state) : buildPlaceQuery(state);
  if (!query.trim()) return null;

  return {
    query,
    isStreaming,
    options: {
      category: categoryFor(state),
      watchSubcategory: isStreaming ? streamType ?? undefined : undefined,
      streamingServiceIds: isStreaming ? [...state.streamingServices] : undefined,
      searchMode: !isStreaming && state.where === "halfway" ? "midpoint" : "single",
      builderMode: builderModeForWhere(state.where),
      routeViaFreeform: state.localWhat === "sports" || state.localWhat === "events"
    }
  };
}

function buildFilterPills(state: BuilderState): FilterPill[] {
  const pills: FilterPill[] = [];

  if (state.selectedMode === "streaming") {
    pills.push({ id: "mode-streaming", label: "Streaming" });
  } else if (state.selectedMode === "local" && state.where === "halfway") {
    pills.push({ id: "mode-halfway", label: "Meet Halfway" });
  } else if (state.selectedMode === "local") {
    pills.push({ id: "mode-explore", label: "Explore" });
  }

  for (const serviceId of state.streamingServices) {
    const service = STREAMING_SERVICES.find((item) => item.id === serviceId);
    pills.push({ id: `service-${serviceId}`, label: service?.label ?? serviceId });
  }

  if (state.streamingType === "movies" || state.streamingType === "tv_shows") {
    const typeLabel = WATCH_TYPE_OPTIONS.find((option) => option.id === state.streamingType)?.label ?? state.streamingType;
    pills.push({ id: `stream-type-${state.streamingType}`, label: typeLabel });
  }

  if (state.streamingVibe) {
    const vibeLabel = WATCH_VIBE_OPTIONS.find((option) => option.id === state.streamingVibe)?.label ?? state.streamingVibe;
    pills.push({ id: `stream-vibe-${state.streamingVibe}`, label: vibeLabel });
  }

  if (state.genre && state.streamingType) {
    const genreLabel =
      getWatchGenresForSubcategory(state.streamingType).find((option) => option.id === state.genre)?.label ??
      state.genre;
    pills.push({ id: `stream-genre-${state.genre}`, label: genreLabel });
  }

  if (state.genre && state.localWhat === "events" && state.typeId === "concerts") {
    pills.push({ id: `music-genre-${state.genre}`, label: musicGenreChipLabel(state.genre) });
  }

  if (state.musicArtistId && state.localWhat === "events" && state.typeId === "concerts") {
    pills.push({ id: `music-artist-${state.musicArtistId}`, label: musicArtistChipLabel(state.musicArtistId) });
  }

  if (state.localWhat) {
    const categoryLabel = LOCAL_CHIP_CATEGORIES.find((item) => item.id === state.localWhat)?.label ?? state.localWhat;
    pills.push({ id: `local-${state.localWhat}`, label: categoryLabel });
  }

  if (state.localWhat && state.typeId) {
    const typeLabel =
      typeRefinementsFor(state.localWhat).find((item) => item.id === state.typeId)?.label ?? state.typeId;
    pills.push({ id: `type-${state.typeId}`, label: typeLabel });
  }

  if (state.localWhat === "sports" && state.sportsTeamId) {
    pills.push({ id: `sports-team-${state.sportsTeamId}`, label: sportsTeamChipLabel(state.sportsTeamId) });
  }

  for (const extraId of state.extras) {
    if (!state.localWhat) continue;
    const extraLabel =
      vibeRefinementsFor(state.localWhat).find((item) => item.id === extraId)?.label ?? extraId;
    pills.push({ id: `extra-${extraId}`, label: extraLabel });
  }

  if (state.selectedMode === "local" && state.where === "choose") {
    pills.push({ id: "where-choose", label: "Choose location" });
  }

  return pills;
}

function removeFilterFromState(state: BuilderState, pillId: string): BuilderState {
  if (pillId === "mode-streaming" || pillId === "mode-explore" || pillId === "mode-halfway") {
    return initialBuilderState();
  }

  if (pillId.startsWith("service-")) {
    const serviceId = pillId.slice("service-".length);
    const streamingServices = new Set(state.streamingServices);
    streamingServices.delete(serviceId);
    return { ...state, streamingServices };
  }

  if (pillId.startsWith("stream-type-")) {
    return { ...state, streamingType: null, streamingVibe: null, genre: null };
  }

  if (pillId.startsWith("stream-vibe-")) {
    return { ...state, streamingVibe: null };
  }

  if (pillId.startsWith("stream-genre-")) {
    return { ...state, genre: null };
  }

  if (pillId.startsWith("music-genre-")) {
    return { ...state, genre: null };
  }

  if (pillId.startsWith("music-artist-")) {
    return { ...state, musicArtistId: null };
  }

  if (pillId.startsWith("local-")) {
    return {
      ...state,
      localWhat: null,
      typeId: null,
      sportsTeamId: null,
      musicArtistId: null,
      extras: new Set<string>(),
      genre: null
    };
  }

  if (pillId.startsWith("type-")) {
    return { ...state, typeId: null, sportsTeamId: null, musicArtistId: null, genre: null };
  }

  if (pillId.startsWith("sports-team-")) {
    return { ...state, sportsTeamId: null };
  }

  if (pillId.startsWith("extra-")) {
    const extraId = pillId.slice("extra-".length);
    const extras = new Set(state.extras);
    extras.delete(extraId);
    return { ...state, extras };
  }

  if (pillId === "where-choose") {
    return { ...state, where: "near" };
  }

  return state;
}

function builderStateFromPopularPreset(preset: HeroPopularSearch): BuilderState {
  const opts = preset.options;

  if (opts?.watchSubcategory || (opts?.category === "custom" && opts.streamingServiceIds?.length)) {
    return {
      selectedMode: "streaming",
      localWhat: null,
      typeId: null,
      sportsTeamId: null,
      musicArtistId: null,
      extras: new Set<string>(),
      where: "near",
      streamingType: normalizeStreamType(opts.watchSubcategory) ?? "movies",
      streamingVibe: null,
      genre: null,
      streamingServices: new Set(opts.streamingServiceIds ?? [])
    };
  }

  if (opts?.category === "shopping") {
    return {
      selectedMode: "local",
      localWhat: "shopping",
      typeId: null,
      sportsTeamId: null,
      musicArtistId: null,
      extras: new Set<string>(),
      where: "near",
      streamingType: null,
      streamingVibe: null,
      genre: null,
      streamingServices: new Set<string>()
    };
  }

  if (opts?.category === "activities") {
    return {
      selectedMode: "local",
      localWhat: "activities",
      typeId: null,
      sportsTeamId: null,
      musicArtistId: null,
      extras: new Set<string>(),
      where: opts?.builderMode === "halfway" || opts?.searchMode === "midpoint" ? "halfway" : "near",
      streamingType: null,
      streamingVibe: null,
      genre: null,
      streamingServices: new Set<string>()
    };
  }

  if (opts?.category === "events") {
    return {
      selectedMode: "local",
      localWhat: "events",
      typeId: null,
      sportsTeamId: null,
      musicArtistId: null,
      extras: new Set<string>(),
      where: opts?.builderMode === "halfway" || opts?.searchMode === "midpoint" ? "halfway" : "near",
      streamingType: null,
      streamingVibe: null,
      genre: null,
      streamingServices: new Set<string>()
    };
  }

  return {
    selectedMode: "local",
    localWhat: "food",
    typeId: null,
    sportsTeamId: null,
    musicArtistId: null,
    extras: new Set<string>(),
    where: opts?.builderMode === "halfway" || opts?.searchMode === "midpoint" ? "halfway" : "near",
    streamingType: null,
    streamingVibe: null,
    genre: null,
    streamingServices: new Set<string>()
  };
}
