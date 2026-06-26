"use client";

import { getWatchGenresForSubcategory, getWatchGenreGroupLabel, resolveWatchGenreQueryWord, WATCH_TYPE_OPTIONS, WATCH_VIBE_OPTIONS, type WatchStreamVibe } from "@/lib/watchBrowse";
import {
  EXPLORE_CATEGORIES,
  exploreCategoryConfig,
  exploreHasVibes,
  exploreRefinementsFor,
  exploreVibesFor,
  isTicketmasterExploreSubcategory,
  venueCategoryForExplore,
  type ExploreCategory,
  type ExploreIntentPayload
} from "@/lib/exploreIntent";
import { normalizeExploreIntent, selectProvidersForExplore } from "@/lib/exploreRouting";
import { builderModeForWhere, type SearchBuilderMode } from "@/lib/searchBuilderOptions";
import { EVENT_WHEN_OPTIONS, eventWhenChipLabel, eventWhenPhrase, minSelectableEventDate, type EventWhen } from "@/lib/eventDates";
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
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type PickQueryOptions = {
  watchSubcategory?: WatchSubcategory;
  category?: VenueCategory;
  searchMode?: SearchHalfwayRequest["searchMode"];
  builderMode?: SearchBuilderMode;
  streamingServiceIds?: string[];
  /** Structured explore routing — category/subcategory/provider stack. */
  exploreIntent?: ExploreIntentPayload;
  /** Sports/events chip picks should go through koi-search, not search-halfway. */
  routeViaFreeform?: boolean;
};

type ProviderProps = {
  busy?: boolean;
  builderMode?: SearchBuilderMode;
  onBuilderModeChange?: (mode: SearchBuilderMode) => void;
  surface?: "hero" | "page";
  /** Saved/current origin — used to split local vs all team chips. */
  userCoordinates?: LatLng;
  children: ReactNode;
};

type WhereId = "near" | "choose" | "halfway";
type SelectedMode = "streaming" | "explore" | null;

const CONCIERGE_TAGLINE = "Start here";

export type BuilderState = {
  selectedMode: SelectedMode;
  exploreCategory: ExploreCategory | null;
  typeId: string | null;
  sportsTeamId: string | null;
  musicArtistId: string | null;
  extras: Set<string>;
  where: WhereId;
  streamingType: WatchSubcategory | null;
  streamingVibe: WatchStreamVibe | null;
  genre: string | null;
  streamingServices: Set<string>;
  eventWhen?: EventWhen | null;
  eventDate?: string | null;
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
  typeRefinements: ReturnType<typeof exploreRefinementsFor>;
  vibeRefinements: ReturnType<typeof exploreVibesFor>;
  surface: "hero" | "page";
  pickMode: (mode: Exclude<SelectedMode, null>) => void;
  pickExplore: () => void;
  pickMeetHalfway: () => void;
  pickExploreCategory: (id: ExploreCategory) => void;
  pickStreamingType: (id: "movies" | "tv_shows") => void;
  toggleType: (id: string) => void;
  toggleSportsTeam: (id: string) => void;
  toggleMusicArtist: (id: string) => void;
  toggleExtra: (id: string) => void;
  setWhere: (id: WhereId) => void;
  toggleGenre: (genre: string) => void;
  toggleStreamingVibe: (vibe: WatchStreamVibe) => void;
  toggleStreamingService: (id: string) => void;
  toggleEventWhen: (when: EventWhen) => void;
  setEventDate: (value: string) => void;
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
      exploreCategory: null,
      typeId: null,
      sportsTeamId: null,
      musicArtistId: null,
      extras: new Set<string>(),
      where: "near",
      streamingType: seededTrending ? "movies" : normalizeStreamType(seed.watchSubcategory),
      streamingVibe: seededTrending ? "trending" : null,
      genre: null,
      streamingServices: new Set<string>(),
      eventWhen: null,
      eventDate: null
    };
  }

  return {
    selectedMode: null,
    exploreCategory: null,
    typeId: null,
    sportsTeamId: null,
    musicArtistId: null,
    extras: new Set<string>(),
    where: "near",
    streamingType: null,
    streamingVibe: null,
    genre: null,
    streamingServices: new Set<string>(),
    eventWhen: null,
    eventDate: null
  };
}

export function SearchPromptAssistProvider({
  busy = false,
  builderMode,
  onBuilderModeChange,
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
          exploreCategory: null,
          typeId: null,
          sportsTeamId: null,
          musicArtistId: null,
          extras: new Set<string>(),
          streamingType: null,
          streamingVibe: null,
          genre: null,
          streamingServices: new Set<string>(),
          eventWhen: null,
          eventDate: null
        };
      }

      if (mode === "streaming") {
        return {
          ...prev,
          selectedMode: "streaming",
          exploreCategory: null,
          typeId: null,
          sportsTeamId: null,
          musicArtistId: null,
          extras: new Set<string>(),
          streamingType: null,
          streamingVibe: null,
          genre: null,
          streamingServices: new Set<string>(),
          eventWhen: null,
          eventDate: null
        };
      }

      return {
        ...prev,
        selectedMode: "explore",
        exploreCategory: null,
        typeId: null,
        sportsTeamId: null,
        musicArtistId: null,
        extras: new Set<string>(),
        streamingType: null,
        streamingVibe: null,
        genre: null,
        streamingServices: new Set<string>(),
        eventWhen: null,
        eventDate: null
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
  }, [builderMode]);

  function pickExplore() {
    commit((prev) => {
      if (prev.selectedMode === "explore") {
        return initialBuilderState();
      }

      return {
        ...prev,
        selectedMode: "explore",
        exploreCategory: null,
        typeId: null,
        sportsTeamId: null,
        musicArtistId: null,
        extras: new Set<string>(),
        where: "near",
        streamingType: null,
        streamingVibe: null,
        genre: null,
        streamingServices: new Set<string>(),
        eventWhen: null,
        eventDate: null
      };
    });
  }

  function pickMeetHalfway() {
    commit((prev) => {
      const active = prev.selectedMode === "explore" && prev.where === "halfway";
      if (active) {
        return initialBuilderState();
      }

      return {
        ...prev,
        selectedMode: "explore",
        exploreCategory: "food_drink",
        typeId: null,
        sportsTeamId: null,
        musicArtistId: null,
        extras: new Set<string>(),
        where: "halfway",
        streamingType: null,
        streamingVibe: null,
        genre: null,
        streamingServices: new Set<string>(),
        eventWhen: null,
        eventDate: null
      };
    });
  }

  function pickExploreCategory(id: ExploreCategory) {
    commit((prev) => {
      if (prev.selectedMode === "explore" && prev.exploreCategory === id) {
        return {
          ...prev,
          exploreCategory: null,
          typeId: null,
          sportsTeamId: null,
          musicArtistId: null,
          extras: new Set<string>(),
          eventWhen: null,
          eventDate: null
        };
      }
      return {
        ...prev,
        selectedMode: "explore",
        exploreCategory: id,
        typeId: null,
        sportsTeamId: null,
        musicArtistId: null,
        extras: new Set<string>(),
        streamingType: null,
        streamingVibe: null,
        genre: null,
        streamingServices: new Set<string>(),
        eventWhen: id === "events" ? prev.eventWhen : null,
        eventDate: id === "events" ? prev.eventDate : null
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
      let eventWhen = prev.eventWhen;
      let eventDate = prev.eventDate;
      if (nextTypeId === "weekend" && eventWhen === "weekend") {
        eventWhen = null;
        eventDate = null;
      }
      return {
        ...prev,
        typeId: nextTypeId,
        sportsTeamId: null,
        musicArtistId: nextTypeId === "concerts" ? prev.musicArtistId : null,
        genre: keepGenre,
        eventWhen,
        eventDate
      };
    });
  }

  function toggleSportsTeam(id: string) {
    commit((prev) => {
      const sportId = sportIdForTeam(id) ?? prev.typeId;
      return {
        ...prev,
        selectedMode: "explore",
        exploreCategory: "sports",
        typeId: sportId,
        sportsTeamId: prev.sportsTeamId === id ? null : id
      };
    });
  }

  function toggleMusicArtist(id: string) {
    commit((prev) => ({
      ...prev,
      selectedMode: "explore",
      exploreCategory: "events",
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
      selectedMode: "explore",
      exploreCategory: prev.selectedMode === "explore" ? prev.exploreCategory : null,
      where: id,
      streamingType: null,
      streamingVibe: null,
      genre: null,
      streamingServices: new Set<string>(),
      eventWhen: null,
      eventDate: null
    }));
    onBuilderModeChange?.(builderModeForWhere(id));
  }

  function toggleGenre(genreId: string) {
    commit((prev) => {
      if (prev.selectedMode === "streaming" && normalizeStreamType(prev.streamingType)) {
        return { ...prev, genre: prev.genre === genreId ? null : genreId };
      }
      if (prev.exploreCategory === "events" && prev.typeId === "concerts") {
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

  function toggleEventWhen(when: EventWhen) {
    commit((prev) => {
      if (prev.eventWhen === when) {
        return { ...prev, eventWhen: null, eventDate: null };
      }
      if (when === "date") {
        return {
          ...prev,
          eventWhen: "date",
          eventDate: prev.eventDate ?? minSelectableEventDate()
        };
      }
      return { ...prev, eventWhen: when, eventDate: null };
    });
  }

  function setEventDate(value: string) {
    commit((prev) => ({
      ...prev,
      eventWhen: "date",
      eventDate: value
    }));
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
  const exploreCategory = state.selectedMode === "explore" ? state.exploreCategory : null;
  const typeRefinements = exploreCategory ? exploreRefinementsFor(exploreCategory) : [];
  const vibeRefinements =
    exploreCategory && exploreHasVibes(exploreCategory) ? exploreVibesFor(exploreCategory) : [];

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
        pickExploreCategory,
        pickStreamingType,
        toggleType,
        toggleSportsTeam,
        toggleMusicArtist,
        toggleExtra,
        setWhere,
        toggleGenre,
        toggleStreamingVibe,
        toggleStreamingService,
        toggleEventWhen,
        setEventDate,
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
  const { busy, state, pickMode, pickExplore, surface } = useAssistContext();
  const onPage = surface === "page";

  return (
    <section className="grid gap-2" aria-label="Choose a path">
      <HeroSectionLabel onPage={onPage}>{CONCIERGE_TAGLINE}</HeroSectionLabel>

      <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
        <ModePickChip
          emoji="🍿"
          title="Streaming"
          subtitle="Movies & TV picks"
          busy={busy}
          selected={state.selectedMode === "streaming"}
          onPick={() => pickMode("streaming")}
          onPage={onPage}
          tone="streaming"
        />
        <ModePickChip
          emoji="🧭"
          title="Explore"
          subtitle="Food, events & things to do"
          busy={busy}
          selected={state.selectedMode === "explore"}
          onPick={pickExplore}
          onPage={onPage}
          tone="explore"
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
    pickExploreCategory,
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
  const moduleBoxClass = `grid gap-3 rounded-2xl border p-3 sm:gap-3 sm:p-3.5 ${
    onPage ? "border-line/80 bg-paper shadow-soft" : "border-white/10 bg-white/[0.03]"
  }`;
  const showStreamingType = state.selectedMode === "streaming";
  const streamType = state.streamingType === "movies" || state.streamingType === "tv_shows" ? state.streamingType : null;
  const showStreamingRefinements = showStreamingType && Boolean(streamType);
  const showExploreCategories = state.selectedMode === "explore";
  const showExploreDetails = showExploreCategories && Boolean(state.exploreCategory);
  const streamGenres = streamType ? getWatchGenresForSubcategory(streamType) : [];

  const showSportsTeams = state.exploreCategory === "sports" && Boolean(state.typeId);
  const showEventDates = state.exploreCategory === "events" && state.typeId !== "weekend";
  const showMusicGenres = state.exploreCategory === "events" && state.typeId === "concerts";
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

            <div className="grid gap-2.5">
            <ChipGroup label="Type" onPage={onPage} variant="section">
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
                <ChipGroup label="✨ Vibe" onPage={onPage} variant="vibe">
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

                <ChipGroup label={getWatchGenreGroupLabel(streamType)} onPage={onPage} variant="section">
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
            </div>
          </>
        ) : null}

        {showExploreCategories ? (
          <>
            <ChipGroup label="Category" onPage={onPage}>
              {EXPLORE_CATEGORIES.map((def) => (
                <AssistChip
                  key={def.key}
                  label={def.label}
                  busy={busy}
                  variant="primary"
                  selected={state.exploreCategory === def.key}
                  onPick={() => pickExploreCategory(def.key)}
                  onPage={onPage}
                />
              ))}
            </ChipGroup>

            {showExploreDetails && state.exploreCategory ? (
              <div className="grid gap-2.5">
                <div className={`h-px ${onPage ? "bg-line/60" : "bg-white/10"}`} aria-hidden="true" />
                <ChipGroup label={exploreCategoryConfig(state.exploreCategory).subtypeLabel} onPage={onPage} variant="section">
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

                {showEventDates ? (
                  <SearchPromptEventWhen onPage={onPage} variant="section" />
                ) : null}

                {vibeRefinements.length ? (
                  <ChipGroup label="✨ Vibe" onPage={onPage} variant="vibe">
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
                  <ChipGroup label="🎤 Artists" onPage={onPage} variant="section">
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
                ) : null}

                {showMusicGenres ? (
                  <ChipGroup label="🎵 Genre" onPage={onPage} variant="section">
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
                ) : null}

                {showSportsTeams && (hasLocalSportsTeams || otherSportsTeams.length) ? (
                  <>
                    {hasLocalSportsTeams ? (
                      <ChipGroup label="📍 Near you" onPage={onPage} variant="section">
                        {localSportsTeams.map(renderSportsTeamChip)}
                      </ChipGroup>
                    ) : null}
                    {otherSportsTeams.length ? (
                      <ChipGroup label={hasLocalSportsTeams ? "🌎 All teams" : "🏟️ Teams"} onPage={onPage} variant="section">
                          {otherSportsTeams.map(renderSportsTeamChip)}
                      </ChipGroup>
                    ) : null}
                  </>
                ) : null}
              </div>
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

type ChipGroupVariant = "inline" | "section" | "vibe";

/** Event date chips — also shown in Advanced Search for event queries. */
export function SearchPromptEventWhen({
  onPage = false,
  variant = "inline"
}: {
  onPage?: boolean;
  variant?: ChipGroupVariant;
}) {
  const { busy, state, toggleEventWhen, setEventDate } = useAssistContext();
  if (state.exploreCategory !== "events" || state.typeId === "weekend") return null;

  const dateInputClass = onPage
    ? "h-9 rounded-lg border border-line bg-white px-2.5 text-sm text-ink outline-none transition focus:border-koi focus:ring-2 focus:ring-koi/15"
    : "h-9 rounded-lg border border-white/12 bg-white/[0.08] px-2.5 text-sm text-white/90 outline-none transition focus:border-koi focus:ring-2 focus:ring-koi/15";

  return (
    <ChipGroup label="📅 When" onPage={onPage} variant={variant}>
      {EVENT_WHEN_OPTIONS.map((option) => {
        const selected = state.eventWhen === option.id;
        const label =
          option.id === "date" && selected && state.eventDate
            ? eventWhenChipLabel("date", state.eventDate)
            : option.label;
        return (
          <AssistChip
            key={option.id}
            label={label}
            busy={busy}
            variant={selected ? "primary" : "accent"}
            selected={selected}
            emphasis={selected}
            onPick={() => toggleEventWhen(option.id)}
            onPage={onPage}
          />
        );
      })}
      {state.eventWhen === "date" ? (
        <input
          type="date"
          min={minSelectableEventDate()}
          value={state.eventDate ?? minSelectableEventDate()}
          onChange={(event) => setEventDate(event.target.value)}
          className={dateInputClass}
          aria-label="Event date"
        />
      ) : null}
    </ChipGroup>
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
      <SearchPromptEventWhen />
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

function ChipGroup({
  label,
  onPage = false,
  variant = "inline",
  children
}: {
  label: string;
  onPage?: boolean;
  variant?: ChipGroupVariant;
  children: ReactNode;
}) {
  if (variant === "section" || variant === "vibe") {
    const panelClass =
      variant === "vibe"
        ? onPage
          ? "border-koi/25 bg-[#FFF8F3] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
          : "border-koi/20 bg-koi/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
        : onPage
          ? "border-line/80 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
          : "border-white/12 bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]";
    const labelClass =
      variant === "vibe"
        ? onPage
          ? "text-koi"
          : "text-[#FFB07A]"
        : onPage
          ? "text-slate"
          : "text-white/55";

    return (
      <div className={`rounded-[14px] border p-3 sm:p-3.5 ${panelClass}`}>
        <p className={`mb-2.5 text-[0.6875rem] font-bold uppercase tracking-[0.16em] ${labelClass}`}>{label}</p>
        <div className="flex flex-wrap gap-2">{children}</div>
      </div>
    );
  }

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

function categoryFor(state: BuilderState): VenueCategory {
  if (state.selectedMode === "streaming") return "custom";
  if (!state.exploreCategory) return "restaurant";
  return venueCategoryForExplore(state.exploreCategory, state.typeId);
}

function eventLocationSuffix(where: WhereId) {
  if (where === "halfway") return "halfway between us";
  if (where === "choose") return "near a specific location";
  return "near me";
}

export function buildPlaceQuery(state: BuilderState): string {
  if (state.exploreCategory === "sports") {
    const suffix = eventLocationSuffix(state.where);

    if (state.sportsTeamId) {
      const team = sportsTeamById(state.sportsTeamId);
      if (team) {
        const phrase = `${team.searchTerm} games`;
        return phrase.charAt(0).toUpperCase() + phrase.slice(1);
      }
    }

    if (state.typeId && isTicketmasterExploreSubcategory("sports", state.typeId)) {
      const sport = majorSportById(state.typeId);
      if (sport) {
        const phrase = `${sport.label} games ${suffix}`;
        return phrase.charAt(0).toUpperCase() + phrase.slice(1);
      }

      const phrase = `Live sports ${suffix}`;
      return phrase.charAt(0).toUpperCase() + phrase.slice(1);
    }
  }

  if (state.exploreCategory === "events") {
    const suffix = eventLocationSuffix(state.where);
    const when = eventWhenPhrase(state);

    if (state.typeId === "concerts" && state.musicArtistId) {
      const artist = musicArtistById(state.musicArtistId);
      if (artist) {
        const phrase = [artist.searchTerm, "concerts", when, suffix].filter(Boolean).join(" ");
        return phrase.charAt(0).toUpperCase() + phrase.slice(1);
      }
    }

    const eventType = resolveEventTypeRefinement(state.typeId);
    if (eventType?.noun) {
      const musicGenre = state.typeId === "concerts" ? musicGenreById(state.genre) : null;
      const noun = musicGenre ? `${musicGenre.queryWord} concerts` : eventType.noun;
      const phrase = [noun, when, suffix].filter(Boolean).join(" ");
      return phrase.charAt(0).toUpperCase() + phrase.slice(1);
    }

    const defaultWhen = when || "this weekend";
    const phrase = ["Things to do", suffix, defaultWhen].filter(Boolean).join(" ");
    return phrase.charAt(0).toUpperCase() + phrase.slice(1);
  }

  if (!state.exploreCategory) return "";

  const def = exploreCategoryConfig(state.exploreCategory);
  const refs = [
    ...exploreRefinementsFor(state.exploreCategory),
    ...exploreVibesFor(state.exploreCategory)
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
  const isExplore = state.selectedMode === "explore" && Boolean(state.exploreCategory);

  if (!isStreaming && !isExplore) return null;

  const query = isStreaming ? buildStreamQuery(state) : buildPlaceQuery(state);
  if (!query.trim()) return null;

  const exploreIntentPayload: ExploreIntentPayload | undefined =
    !isStreaming && state.exploreCategory
      ? {
          mode: "explore",
          category: state.exploreCategory,
          subcategoryId: state.typeId,
          providers: selectProvidersForExplore(state.exploreCategory, state.typeId)
        }
      : isStreaming
        ? { mode: "streaming" }
        : undefined;

  const normalizedExplore = exploreIntentPayload
    ? normalizeExploreIntent({
        query,
        mode: exploreIntentPayload.mode,
        category: exploreIntentPayload.category,
        subcategoryId: exploreIntentPayload.subcategoryId ?? null,
        structured: Boolean(exploreIntentPayload.category)
      })
    : null;

  return {
    query,
    isStreaming,
    options: {
      category: categoryFor(state),
      watchSubcategory: isStreaming ? streamType ?? undefined : undefined,
      streamingServiceIds: isStreaming ? [...state.streamingServices] : undefined,
      searchMode: !isStreaming && state.where === "halfway" ? "midpoint" : "single",
      builderMode: builderModeForWhere(state.where),
      exploreIntent: exploreIntentPayload,
      routeViaFreeform: normalizedExplore?.routeViaTicketmaster ?? false
    }
  };
}

function buildFilterPills(state: BuilderState): FilterPill[] {
  const pills: FilterPill[] = [];

  if (state.selectedMode === "streaming") {
    pills.push({ id: "mode-streaming", label: "Streaming" });
  } else if (state.selectedMode === "explore" && state.where === "halfway") {
    pills.push({ id: "mode-halfway", label: "Meet Halfway" });
  } else if (state.selectedMode === "explore") {
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

  if (state.genre && state.exploreCategory === "events" && state.typeId === "concerts") {
    pills.push({ id: `music-genre-${state.genre}`, label: musicGenreChipLabel(state.genre) });
  }

  if (state.musicArtistId && state.exploreCategory === "events" && state.typeId === "concerts") {
    pills.push({ id: `music-artist-${state.musicArtistId}`, label: musicArtistChipLabel(state.musicArtistId) });
  }

  if (state.exploreCategory === "events" && state.eventWhen && state.typeId !== "weekend") {
    pills.push({
      id: `event-when-${state.eventWhen}`,
      label: eventWhenChipLabel(state.eventWhen, state.eventDate ?? null)
    });
  }

  if (state.exploreCategory) {
    const categoryLabel =
      EXPLORE_CATEGORIES.find((item) => item.key === state.exploreCategory)?.label ?? state.exploreCategory;
    pills.push({ id: `local-${state.exploreCategory}`, label: categoryLabel });
  }

  if (state.exploreCategory && state.typeId) {
    const typeLabel =
      exploreRefinementsFor(state.exploreCategory).find((item) => item.id === state.typeId)?.label ?? state.typeId;
    pills.push({ id: `type-${state.typeId}`, label: typeLabel });
  }

  if (state.exploreCategory === "sports" && state.sportsTeamId) {
    pills.push({ id: `sports-team-${state.sportsTeamId}`, label: sportsTeamChipLabel(state.sportsTeamId) });
  }

  for (const extraId of state.extras) {
    if (!state.exploreCategory) continue;
    const extraLabel =
      exploreVibesFor(state.exploreCategory).find((item) => item.id === extraId)?.label ?? extraId;
    pills.push({ id: `extra-${extraId}`, label: extraLabel });
  }

  if (state.selectedMode === "explore" && state.where === "choose") {
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

  if (pillId.startsWith("event-when-")) {
    return { ...state, eventWhen: null, eventDate: null };
  }

  if (pillId.startsWith("local-")) {
    return {
      ...state,
      exploreCategory: null,
      typeId: null,
      sportsTeamId: null,
      musicArtistId: null,
      extras: new Set<string>(),
      genre: null,
      eventWhen: null,
      eventDate: null
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
      exploreCategory: null,
      typeId: null,
      sportsTeamId: null,
      musicArtistId: null,
      extras: new Set<string>(),
      where: "near",
      streamingType: normalizeStreamType(opts.watchSubcategory) ?? "movies",
      streamingVibe: null,
      genre: null,
      streamingServices: new Set(opts.streamingServiceIds ?? []),
      eventWhen: null,
      eventDate: null
    };
  }

  if (opts?.category === "shopping") {
    return {
      selectedMode: "explore",
      exploreCategory: "activities",
      typeId: "thrift_stores",
      sportsTeamId: null,
      musicArtistId: null,
      extras: new Set<string>(),
      where: "near",
      streamingType: null,
      streamingVibe: null,
      genre: null,
      streamingServices: new Set<string>(),
      eventWhen: null,
      eventDate: null
    };
  }

  if (opts?.category === "activities") {
    return {
      selectedMode: "explore",
      exploreCategory: "activities",
      typeId: null,
      sportsTeamId: null,
      musicArtistId: null,
      extras: new Set<string>(),
      where: opts?.builderMode === "halfway" || opts?.searchMode === "midpoint" ? "halfway" : "near",
      streamingType: null,
      streamingVibe: null,
      genre: null,
      streamingServices: new Set<string>(),
      eventWhen: null,
      eventDate: null
    };
  }

  if (opts?.category === "events") {
    return {
      selectedMode: "explore",
      exploreCategory: "events",
      typeId: null,
      sportsTeamId: null,
      musicArtistId: null,
      extras: new Set<string>(),
      where: opts?.builderMode === "halfway" || opts?.searchMode === "midpoint" ? "halfway" : "near",
      streamingType: null,
      streamingVibe: null,
      genre: null,
      streamingServices: new Set<string>(),
      eventWhen: null,
      eventDate: null
    };
  }

  return {
    selectedMode: "explore",
    exploreCategory: "food_drink",
    typeId: null,
    sportsTeamId: null,
    musicArtistId: null,
    extras: new Set<string>(),
    where: opts?.builderMode === "halfway" || opts?.searchMode === "midpoint" ? "halfway" : "near",
    streamingType: null,
    streamingVibe: null,
    genre: null,
    streamingServices: new Set<string>(),
    eventWhen: null,
    eventDate: null
  };
}
