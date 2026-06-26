"use client";

import { EmptyState } from "@/app/components/EmptyState";
import { KoiThinkingLoader } from "@/app/components/KoiThinkingLoader";
import { EventResultCard } from "@/app/components/EventResultCard";
import { AiSearchBox, type AiSearchBoxHandle } from "@/app/components/AiSearchBox";
import { extractSportsSearchKeyword, hasNamedTeamInQuery, isTeamSpecificSportsQuery, queryRequiresEventLocation } from "@/lib/localEventIntent";
import { resolveEventSearchForm } from "@/lib/koiSearchExecute";
import { CompactResultsHeader } from "@/app/components/home/CompactResultsHeader";
import { MarketingHero } from "@/app/components/home/MarketingHero";
import { HeroPopularSearches } from "@/app/components/home/HeroPopularSearches";
import { TrendingNearYouStrip } from "@/app/components/home/TrendingNearYouStrip";
import { LocationOnboardingCard } from "@/app/components/home/LocationOnboardingCard";
import { OnboardingCapabilityPreview } from "@/app/components/home/OnboardingCapabilityPreview";
import { SelectedFiltersPanel } from "@/app/components/home/SelectedFiltersPanel";
import { ShareDialog, type ShareDialogState } from "@/app/components/home/ShareDialog";
import { CompactHeader, Footer } from "@/app/components/home/SiteChrome";
import { HeroNeedIdeas } from "@/app/components/home/HeroNeedIdeas";
import { ClassicSearchControls } from "@/app/components/ClassicSearchControls";
import { SearchContextStrip } from "@/app/components/SearchContextStrip";
import { LocationForm } from "@/app/components/LocationForm";
import { RoadDivider } from "@/app/components/BrandRoad";
import {
  SearchPromptAssistProvider,
  SearchPromptDetailChips,
  SearchPromptModePicker,
  type PickQueryOptions
} from "@/app/components/SearchPromptAssist";
import type { SearchBuilderMode } from "@/lib/searchBuilderOptions";
import { formForSessionAfterSearch, type SearchSubmitOptions } from "@/lib/searchLocation";
import { VenueCard } from "@/app/components/VenueCard";
import { WatchEventsResults } from "@/app/components/WatchEventsResults";
import { WeatherCard } from "@/app/components/WeatherCard";
import { normalizeCategory, parseMeetupMode, parseSearchMode } from "@/lib/categories";
import { parsePreferences } from "@/lib/preferences";
import { shareWithFallback, shouldUseNativeShare } from "@/lib/share";
import { trackEvent } from "@/lib/analytics";
import { DEFAULT_WATCH_SUBCATEGORY } from "@/lib/watchBrowse";
import {
  eventSearchLocationReady,
  looksLikeCurrentLocationQuery,
  needsCurrentLocationResolution,
  resolveCurrentLocationInForm,
  type CurrentLocationContext
} from "@/lib/currentLocation";
import { getCurrentPosition, geocodeManualLocation, reverseGeocodeCoordinates, shortLocationLabel } from "@/lib/geolocation";
import {
  isValidManualLocationInput,
  type LocationUiState
} from "@/lib/locationInput";
import { readStoredLocationSnapshot, resolveLocationChipLabel, restoreStoredLocation, hasHomeLocationSaved } from "@/lib/homeLocation";
import { mergeSavedUserLocation, getSavedUserLocation } from "@/lib/savedUserLocation";
import { getSearchAccent } from "@/lib/searchAccent";
import {
  classifySearchError,
  isEmptyPlacesResults,
  isEmptyWatchResults,
  isSearchError,
  searchError as createSearchError,
  SEARCH_ERROR_MESSAGES,
  shouldShowInlineSearchError,
  type SearchError,
  type SearchStatus
} from "@/lib/searchStatus";
import { STRICT_INTENT_NO_RESULTS_MESSAGE } from "@/lib/strictIntentFilters";
import { getSavedTravelMode, saveTravelMode } from "@/lib/travelMode";
import { isEvChargingIntent } from "@/lib/evSearchIntent";
import { extractStreamingProviders, mergeStreamingServiceIds } from "@/lib/streamingServices";
import {
  applyPickOptionsToSession,
  buildPlacesFormFromOptions,
  shouldRouteFilterSearchToFreeform,
  type KoiSearchApiResponse,
  type SearchIntent
} from "@/lib/searchIntent";
import { hasStreamingWatchContext, isMovieTheaterEventsQuery } from "@/lib/watchEvents";
import { resolveWatchPlaceSearchForm } from "@/lib/watchPlaceSearch";
import { KOI_PICK_DISPLAY_LIMIT, THINKING_PROGRESS_LABELS } from "@/lib/koiCapabilityExamples";
import type { KoiBotMode, LatLng, ScoredVenue, SearchHalfwayRequest, SearchHalfwayResponse, TravelMode, VenueCategory, WatchEventsApiResponse, WatchEventsResult, WatchSubcategory } from "@/lib/types";
import { BRAND } from "@/src/config/branding";
import { PAGE_CONTAINER } from "@/lib/pageLayout";
import { useEffect, useMemo, useRef, useState } from "react";

const initialForm: SearchHalfwayRequest = {
  locationA: "",
  locationB: "",
  category: "restaurant",
  searchMode: "single",
  meetupMode: "single",
  customQuery: ""
};

function eventResultsHeading(query: string) {
  if (hasNamedTeamInQuery(query) && /\bnear me\b/i.test(query)) {
    const team = extractSportsSearchKeyword(query);
    if (team) return `${team.charAt(0).toUpperCase()}${team.slice(1)} games nearby`;
  }

  if (!isTeamSpecificSportsQuery(query)) return "Live events nearby";

  const team = extractSportsSearchKeyword(query);
  if (!team) return "Upcoming games";

  return `${team.charAt(0).toUpperCase()}${team.slice(1)} games — all locations`;
}

function formWithStoredLocation(base: SearchHalfwayRequest = initialForm): SearchHalfwayRequest {
  const stored = getSavedUserLocation();
  if (!stored?.locationA?.trim()) return base;

  return {
    ...base,
    locationA: base.locationA.trim() || stored.locationA,
    locationAPlaceId: base.locationAPlaceId ?? stored.locationAPlaceId,
    locationACoordinates: base.locationACoordinates ?? stored.locationACoordinates
  };
}

type FallbackKind = "none" | "location" | "full";

type PendingRetry =
  | { kind: "events"; query: string }
  | { kind: "places"; form: SearchHalfwayRequest };

export default function HomePage() {
  const [form, setForm] = useState<SearchHalfwayRequest>(initialForm);
  const [results, setResults] = useState<SearchHalfwayResponse | null>(null);
  const [watchEventsResult, setWatchEventsResult] = useState<WatchEventsResult | null>(null);
  const [searchKind, setSearchKind] = useState<"places" | "watch" | "events" | null>(null);
  const [activeWatchSubcategory, setActiveWatchSubcategory] = useState<WatchSubcategory>(DEFAULT_WATCH_SUBCATEGORY);
  const [activeStreamingServiceIds, setActiveStreamingServiceIds] = useState<string[]>([]);
  const [showClassicFallback, setShowClassicFallback] = useState(false);
  const [fallbackKind, setFallbackKind] = useState<FallbackKind>("none");
  const [pendingRetry, setPendingRetry] = useState<PendingRetry | null>(null);
  const [locationStatus, setLocationStatus] = useState(() => readStoredLocationSnapshot().locationStatus);
  const [savedLocation, setSavedLocation] = useState(() => readStoredLocationSnapshot().savedLocation);
  const [savedUserAddress, setSavedUserAddress] = useState(() => readStoredLocationSnapshot().savedUserAddress);
  const [locationUiState, setLocationUiState] = useState<LocationUiState>("idle");
  const [travelMode, setTravelMode] = useState<TravelMode>(() => getSavedTravelMode());
  const [showManualFallback, setShowManualFallback] = useState(false);
  const [showLocationActions, setShowLocationActions] = useState(false);
  const [manualLocationError, setManualLocationError] = useState("");
  const [locating, setLocating] = useState(false);
  const [resolvingManual, setResolvingManual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<SearchError | null>(null);
  const [shareMessage, setShareMessage] = useState("");
  const [currentShareUrl, setCurrentShareUrl] = useState("");
  const [openedFromSharedHalfway, setOpenedFromSharedHalfway] = useState(false);
  const [shareDialog, setShareDialog] = useState<ShareDialogState | null>(null);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>("idle");
  const [showRoadDividerPreview, setShowRoadDividerPreview] = useState(false);
  const [builderExpanded, setBuilderExpanded] = useState(false);
  const [builderMode, setBuilderMode] = useState<SearchBuilderMode>("near_me");
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [lastAskQuery, setLastAskQuery] = useState("");
  const [locationSavedMessage, setLocationSavedMessage] = useState("");
  const searchBoxRef = useRef<AiSearchBoxHandle>(null);
  const searchInFlightRef = useRef(false);
  const prefetchedAskRef = useRef("");
  const trendingGeocodeAttemptRef = useRef("");
  const [trendingGeocoding, setTrendingGeocoding] = useState(false);
  const loadingPhaseLabel =
    THINKING_PROGRESS_LABELS[searchKind ?? "places"][loadingPhase] ??
    THINKING_PROGRESS_LABELS.places[loadingPhase] ??
    THINKING_PROGRESS_LABELS.places[0];

  function syncUserLocationFromStorage() {
    restoreStoredLocation({ setSavedLocation, setSavedUserAddress, setLocationStatus });
  }

  function persistSavedLocation(location: CurrentLocationContext) {
    if (!location.locationA?.trim()) return;

    mergeSavedUserLocation({
      locationA: location.locationA.trim(),
      locationAPlaceId: location.locationAPlaceId,
      locationACoordinates: location.locationACoordinates
    });
    syncUserLocationFromStorage();
  }

  function persistUserAddress(address: string) {
    const trimmed = address.trim();
    if (!trimmed) return;
    mergeSavedUserLocation({ locationA: trimmed });
    syncUserLocationFromStorage();
  }

  function getActiveLocationContext(): CurrentLocationContext {
    if (savedLocation.locationACoordinates && savedLocation.locationA?.trim()) {
      return { ...savedLocation, travelMode };
    }

    const stored = getSavedUserLocation();
    if (stored?.locationACoordinates && stored.locationA.trim()) {
      return { ...stored, travelMode };
    }

    if (savedUserAddress.trim()) {
      return {
        locationA: savedUserAddress,
        locationAPlaceId: stored?.locationAPlaceId,
        locationACoordinates: stored?.locationACoordinates,
        travelMode
      };
    }

    return {
      locationA: form.locationA,
      locationAPlaceId: form.locationAPlaceId,
      locationACoordinates: form.locationACoordinates,
      travelMode
    };
  }

  function clearSearchError() {
    setSearchError(null);
  }

  function readApiSearchError(data: { error?: unknown }): SearchError {
    return isSearchError(data.error) ? data.error : classifySearchError(data.error);
  }

  function promptNeedsLocation(message = SEARCH_ERROR_MESSAGES.NEEDS_LOCATION) {
    setShowLocationActions(true);
    setShowManualFallback(false);
    setSearchError(createSearchError("NEEDS_LOCATION", message));
    setSearchStatus("idle");
  }

  function failSearch(input: unknown) {
    const classified = classifySearchError(input);
    if (classified.kind === "NEEDS_LOCATION") {
      setShowLocationActions(true);
      setShowManualFallback(false);
    }
    setResults(null);
    setWatchEventsResult(null);
    setSearchError(classified);
    setSearchStatus("idle");
  }

  function emptySearch(message?: string) {
    setResults(null);
    setWatchEventsResult(null);
    setSearchError(createSearchError("NO_RESULTS", message ?? SEARCH_ERROR_MESSAGES.NO_RESULTS));
    setSearchStatus("idle");
  }

  function handleTravelModeChange(mode: TravelMode) {
    clearSearchError();
    setTravelMode(mode);
    saveTravelMode(mode);
    trackEvent("travel_mode_changed", { travelMode: mode });
  }

  /** Switch to EV mode when the ask explicitly mentions charging. */
  function travelModeForQuery(query: string): TravelMode {
    if (!isEvChargingIntent(query)) return travelMode;
    if (travelMode === "ev") return travelMode;
    setTravelMode("ev");
    saveTravelMode("ev");
    trackEvent("travel_mode_changed", { travelMode: "ev" });
    return "ev";
  }

  function handleBuilderModeChange(mode: SearchBuilderMode) {
    clearSearchError();
    setBuilderMode(mode);
  }

  const locationContext = useMemo(() => getActiveLocationContext(), [
    savedLocation,
    savedUserAddress,
    travelMode,
    form.locationA,
    form.locationAPlaceId,
    form.locationACoordinates
  ]);

  const activeLocationLabel = useMemo(() => resolveLocationChipLabel(savedLocation, savedUserAddress, locationStatus, locationUiState), [
    savedLocation,
    savedUserAddress,
    locationStatus,
    locationUiState
  ]);

  const hasHomeLocation = useMemo(
    () => hasHomeLocationSaved(locationContext, savedUserAddress, savedLocation, form.locationA),
    [locationContext, savedUserAddress, savedLocation, form.locationA]
  );

  const activeAccent = useMemo(() => getSearchAccent(searchKind), [searchKind]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const locationA = params.get("a") ?? "";
    const locationAPlaceId = params.get("aPlaceId") ?? undefined;
    const locationACoordinates = parseCoordinates(params.get("aLat"), params.get("aLng"));
    const locationB = params.get("b") ?? "";
    const locationBPlaceId = params.get("bPlaceId") ?? undefined;
    const locationBCoordinates = parseCoordinates(params.get("bLat"), params.get("bLng"));
    const category = normalizeCategory((params.get("category") as VenueCategory | null) ?? "coffee");
    const searchMode = parseSearchMode(params.get("searchMode"));
    const meetupMode = parseMeetupMode(params.get("mode"));
    const customQuery = params.get("q") ?? "";
    const preferences = parsePreferences(params.get("preferences"));
    const shareId = params.get("shareId");
    const shouldAutoSearch = params.get("auto") === "1";
    setShowRoadDividerPreview(params.get("roadDivider") === "1");
    if (locationA || locationB || customQuery) {
      const nextForm = { locationA, locationAPlaceId, locationACoordinates, locationB, locationBPlaceId, locationBCoordinates, category, searchMode, meetupMode, customQuery, preferences };
      setForm(nextForm);
      if (customQuery.trim()) setLastAskQuery(customQuery.trim());
      if (shareId && locationACoordinates && locationA.trim()) {
        persistSavedLocation({ locationA, locationAPlaceId, locationACoordinates });
      }
      if (shareId) {
        const shareUrl = `${window.location.origin}/s/${shareId}`;
        setCurrentShareUrl(shareUrl);
        trackEvent("share_link_opened", {
          category,
          hasPreferences: preferences.length > 0
        });
        if (searchMode === "midpoint") {
          trackEvent("halfway_share_opened", { category });
          setOpenedFromSharedHalfway(true);
        }
      }
      if (shouldAutoSearch && locationA && (searchMode === "single" || locationB)) {
        void executeSearch({
          kind: "places",
          form: nextForm,
          existingShareUrl: shareId ? `${window.location.origin}/s/${shareId}` : undefined
        });
      }
    }
  }, []);

  useEffect(() => {
    setForm((current) => formWithStoredLocation(current));
  }, []);

  useEffect(() => {
    syncUserLocationFromStorage();
  }, []);

  useEffect(() => {
    if (loading || !lastAskQuery.trim() || !searchError || !shouldShowInlineSearchError(searchError)) return;
    searchBoxRef.current?.fillQuery(lastAskQuery);
  }, [lastAskQuery, loading, searchError]);

  // Saved city/ZIP labels often lack coordinates on mobile — geocode once so Trending can load.
  useEffect(() => {
    if (locationContext.locationACoordinates) {
      setTrendingGeocoding(false);
      return;
    }

    const address = savedUserAddress.trim() || savedLocation.locationA?.trim() || form.locationA.trim();
    if (!address) {
      setTrendingGeocoding(false);
      return;
    }

    const placeId = savedLocation.locationAPlaceId ?? form.locationAPlaceId;
    const attemptKey = `${address}|${placeId ?? ""}`;
    if (trendingGeocodeAttemptRef.current === attemptKey) return;
    trendingGeocodeAttemptRef.current = attemptKey;

    let cancelled = false;
    setTrendingGeocoding(true);
    void geocodeManualLocation(address, placeId)
      .then((resolved) => {
        if (cancelled) return;
        persistSavedLocation(resolved);
        setForm((current) => ({
          ...current,
          locationA: resolved.locationA,
          locationAPlaceId: resolved.locationAPlaceId,
          locationACoordinates: resolved.locationACoordinates,
          searchMode: current.searchMode ?? "single"
        }));
      })
      .catch(() => {
        // Trending shows a location CTA until the user sets a resolvable location.
      })
      .finally(() => {
        if (!cancelled) setTrendingGeocoding(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    form.locationA,
    form.locationAPlaceId,
    locationContext.locationACoordinates,
    savedLocation.locationA,
    savedLocation.locationAPlaceId,
    savedUserAddress
  ]);

  useEffect(() => {
    if (!loading) {
      setLoadingPhase(0);
      return;
    }
    const labels = THINKING_PROGRESS_LABELS[searchKind ?? "places"];
    const timer = window.setInterval(() => {
      setLoadingPhase((phase) => (phase + 1) % labels.length);
    }, 1800);
    return () => window.clearInterval(timer);
  }, [loading, searchKind]);

  function scrollToFallback() {
    window.requestAnimationFrame(() => {
      document.getElementById("location-fallback")?.scrollIntoView({ behavior: "smooth", block: "start" });
      document.getElementById("classic-search")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function openLocationFallback(retry: PendingRetry, message: string) {
    setPendingRetry(retry);
    setFallbackKind("location");
    setShowClassicFallback(true);
    setSearchError(createSearchError("NEEDS_LOCATION", message));
    setSearchStatus("idle");
    scrollToFallback();
  }

  function openFullFallback(message?: string) {
    if (searchKind === "watch") {
      if (message) {
        setSearchError(createSearchError("NEEDS_LOCATION", message));
        setSearchStatus("idle");
      }
      return;
    }
    setPendingRetry(null);
    setFallbackKind("full");
    setShowClassicFallback(true);
    if (message) {
      setSearchError(createSearchError("NEEDS_LOCATION", message));
      setSearchStatus("idle");
    }
    scrollToFallback();
  }

  async function applyResolvedLocation(
    nextForm: SearchHalfwayRequest,
    uiState: Extract<LocationUiState, "browser_success" | "manual_success">
  ) {
    setForm(nextForm);
    persistSavedLocation(nextForm);
    setLocationUiState(uiState);
    setShowManualFallback(false);
    setShowLocationActions(false);
    setManualLocationError("");
    setLocationSavedMessage("You're all set — ask Koi anything.");
    clearSearchError();
  }

  async function resolveManualLocation(input: string, placeId?: string) {
    const trimmed = input.trim();
    if (!trimmed) {
      setManualLocationError("Enter an address, city, or ZIP code.");
      setLocationUiState("manual_error");
      return;
    }
    if (!placeId && !isValidManualLocationInput(trimmed)) {
      setManualLocationError("We couldn't find that location. Try a ZIP code or city/state.");
      setLocationUiState("manual_error");
      return;
    }

    setResolvingManual(true);
    setManualLocationError("");
    setLocationUiState("manual_resolving");
    try {
      const resolved = await geocodeManualLocation(trimmed, placeId);
      const nextForm: SearchHalfwayRequest = {
        ...form,
        locationA: resolved.locationA,
        locationAPlaceId: resolved.locationAPlaceId,
        locationACoordinates: resolved.locationACoordinates,
        searchMode: "single"
      };
      await applyResolvedLocation(nextForm, "manual_success");
    } catch {
      setManualLocationError("We couldn't find that location. Try a ZIP code or city/state.");
      setLocationUiState("manual_error");
      setShowManualFallback(true);
    } finally {
      setResolvingManual(false);
    }
  }

  function showZipFallback() {
    setShowLocationActions(false);
    setShowManualFallback(true);
    setManualLocationError("");
  }

  async function requestUserLocation(retry?: PendingRetry | null) {
    if (typeof window === "undefined" || !window.navigator?.geolocation) {
      setLocationUiState("browser_failed");
      setShowManualFallback(true);
      setShowLocationActions(false);
      setLocationStatus("");
      if (retry ?? pendingRetry) {
        setSearchError(createSearchError("NEEDS_LOCATION", "Location blocked? Enter a ZIP code instead."));
        setSearchStatus("idle");
      }
      return;
    }

    setLocating(true);
    setLocationUiState("requesting");
    setShowManualFallback(false);
    setShowLocationActions(false);
    setManualLocationError("");
    if (!savedLocation.locationACoordinates && !savedUserAddress.trim()) {
      setLocationStatus("");
    }
    try {
      const coordinates = await getCurrentPosition();
      const resolved = await reverseGeocodeCoordinates(coordinates);
      const nextForm: SearchHalfwayRequest = {
        ...form,
        locationA: resolved.locationA,
        locationAPlaceId: resolved.locationAPlaceId,
        locationACoordinates: coordinates,
        searchMode: "single"
      };
      await applyResolvedLocation(nextForm, "browser_success");
    } catch {
      syncUserLocationFromStorage();
      setLocationUiState("browser_failed");
      setManualLocationError("We couldn't access your location. Try entering a city or ZIP.");
      setShowManualFallback(false);
      setShowLocationActions(false);
      if (retry ?? pendingRetry) {
        setSearchError(createSearchError("NEEDS_LOCATION", "Location blocked? Enter a ZIP code instead."));
        setSearchStatus("idle");
      }
    } finally {
      setLocating(false);
    }
  }

  const topVenue = results?.venues[0] ?? null;
  const topWatchRecommendation = watchEventsResult?.recommendations[0] ?? null;
  const weatherPoint = results
    ? results.searchMode === "single"
      ? results.originA.location
      : results.midpoint
    : null;

  const resultContext = useMemo(() => {
    if (!results) return null;
    const singleLocation = results.searchMode === "single";
    return {
      originALabel: shortLocationLabel(results.originA.formattedAddress),
      originBLabel: singleLocation ? "" : shortLocationLabel(results.originB.formattedAddress),
      closestVenueId: findClosestVenueId(results.venues, results.midpoint),
      shortestCombinedVenueId: findShortestCombinedVenueId(results.venues)
    };
  }, [results]);

  function applyPlacesResults(
    searchForm: SearchHalfwayRequest,
    data: SearchHalfwayResponse,
    existingShareUrl?: string,
    submitOptions?: SearchSubmitOptions
  ) {
    if (isEmptyPlacesResults(data)) {
      emptySearch(data.strictIntentApplied ? STRICT_INTENT_NO_RESULTS_MESSAGE : undefined);
      return;
    }

    clearSearchError();
    setSearchStatus("success");
    setResults(data);
    setWatchEventsResult(null);
    setSearchKind("places");
    setForm(formForSessionAfterSearch(searchForm, getActiveLocationContext(), submitOptions));
    const shareUrl = updateShareUrl(searchForm);
    setCurrentShareUrl(existingShareUrl ?? shareUrl);
    syncUserLocationFromStorage();
    trackEvent("search_completed", {
      category: data.category,
      resultCount: data.venues.length,
      eventCount: data.events?.length ?? 0,
      hasEvents: Boolean(data.events?.length),
      hasWeather: true,
      hasPreferences: Boolean(data.preferences?.length)
    });
    if (data.events?.length) {
      trackEvent("event_search_completed", {
        eventCount: data.events.length,
        profile: data.eventProfile ?? "general"
      });
    }
  }

  function applyWatchEventsResults(data: WatchEventsResult) {
    if (isEmptyWatchResults(data)) {
      emptySearch();
      return;
    }

    clearSearchError();
    setSearchStatus("success");
    setWatchEventsResult(data);
    setResults(null);
    if (data.streamingServiceIds?.length) {
      setActiveStreamingServiceIds(data.streamingServiceIds);
    }
    syncUserLocationFromStorage();
    trackEvent("watch_events_completed", {
      intent: data.intent,
      resultCount: data.resultCount
    });
  }

  function preparePlacesIntent(
    searchForm: SearchHalfwayRequest,
    askQuery?: string,
    submitOptions?: SearchSubmitOptions
  ): SearchIntent | null {
    if (askQuery?.trim()) setLastAskQuery(askQuery.trim());
    const resolvedForm = resolveCurrentLocationInForm(searchForm, getActiveLocationContext());
    if (needsCurrentLocationResolution(resolvedForm)) {
      setPendingRetry({ kind: "places", form: resolvedForm });
      setShowLocationActions(true);
      setShowManualFallback(false);
      promptNeedsLocation();
      return null;
    }

    setShowClassicFallback(false);
    setFallbackKind("none");
    setPendingRetry(null);
    setShowLocationActions(false);
    return { kind: "places", form: resolvedForm, askQuery, submitOptions };
  }

  async function fetchWatchResults(
    query: string,
    subcategory: WatchSubcategory,
    streamingServiceIds: string[]
  ): Promise<WatchEventsResult> {
    const response = await fetch("/api/watch-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, subcategory, streamingServiceIds })
    });
    const data = (await response.json()) as WatchEventsResult & { error?: string };
    if (!response.ok) throw readApiSearchError(data);
    return data;
  }

  async function executeSearch(intent: SearchIntent) {
    if (searchInFlightRef.current || loading) return;
    searchInFlightRef.current = true;

    const startedAt = Date.now();
    const shouldPlayMotion = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setLoading(true);
    setSearchError(null);
    setShareMessage("");
    setLocationSavedMessage("");

    try {
      if (intent.kind === "places") {
        const prepared = preparePlacesIntent(intent.form, intent.askQuery, intent.submitOptions);
        if (!prepared || prepared.kind !== "places") return;

        setSearchKind("places");
        setWatchEventsResult(null);
        setResults(null);
        trackEvent("search_started", {
          category: prepared.form.category,
          hasPreferences: Boolean(prepared.form.preferences?.length)
        });

        const response = await fetch("/api/search-halfway", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...prepared.form, travelMode })
        });
        const data = (await response.json()) as SearchHalfwayResponse & { error?: string };
        if (!response.ok) throw readApiSearchError(data);
        applyPlacesResults(prepared.form, data, intent.existingShareUrl, intent.submitOptions);
        return;
      }

      if (intent.kind === "watch") {
        const query = intent.query.trim();
        if (!query) throw new Error("Tell Koi what you want to watch.");
        setLastAskQuery(query);

        const mergedStreamingServiceIds = mergeStreamingServiceIds(
          intent.streamingServiceIds ?? activeStreamingServiceIds,
          extractStreamingProviders(query)
        );
        const subcategory = intent.subcategory ?? activeWatchSubcategory;
        setActiveStreamingServiceIds(mergedStreamingServiceIds);
        setActiveWatchSubcategory(subcategory);
        setSearchKind("watch");
        setResults(null);
        setWatchEventsResult(null);
        setCurrentShareUrl("");
        trackEvent("watch_events_opened", { queryLength: query.length });

        const data = await fetchWatchResults(query, subcategory, mergedStreamingServiceIds);
        applyWatchEventsResults(data);
        return;
      }

      if (intent.kind === "events") {
        const query = intent.query.trim();
        if (!query) throw new Error("Tell Koi what events you want to find.");
        setLastAskQuery(query);

        let eventLocationContext = resolveEventSearchForm(
          query,
          intent.locationContext ?? form,
          getActiveLocationContext()
        );

        const placeForm = resolveWatchPlaceSearchForm(query, eventLocationContext);
        if (placeForm && !isMovieTheaterEventsQuery(query)) {
          const placesIntent = preparePlacesIntent(placeForm, query);
          if (!placesIntent || placesIntent.kind !== "places") return;

          setSearchKind("places");
          setWatchEventsResult(null);
          setResults(null);
          trackEvent("search_started", {
            category: placesIntent.form.category,
            hasPreferences: Boolean(placesIntent.form.preferences?.length)
          });

          const response = await fetch("/api/search-halfway", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...placesIntent.form, travelMode })
          });
          const data = (await response.json()) as SearchHalfwayResponse & { error?: string };
          if (!response.ok) throw readApiSearchError(data);
          applyPlacesResults(placesIntent.form, data);
          return;
        }

        if (
          !isTeamSpecificSportsQuery(query) &&
          !eventSearchLocationReady(eventLocationContext)
        ) {
          setSearchKind("events");
          setResults(null);
          setWatchEventsResult(null);
          setPendingRetry({ kind: "events", query });
          setShowLocationActions(true);
          setShowManualFallback(false);
          promptNeedsLocation();
          return;
        }

        setSearchKind("events");
        setResults(null);
        setWatchEventsResult(null);
        setCurrentShareUrl("");
        trackEvent("watch_events_opened", { queryLength: query.length });

        const response = await fetch("/api/watch-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, form: { ...eventLocationContext, travelMode } })
        });
        const data = (await response.json()) as WatchEventsApiResponse & { error?: string };
        if (!response.ok) throw readApiSearchError(data);

        if ("append" in data && data.append) {
          throw new Error("Unexpected load-more response.");
        }

        const result = data as WatchEventsResult;
        if (result.preview) {
          openLocationFallback({ kind: "events", query }, "Add your location to search nearby.");
          return;
        }

        setShowClassicFallback(false);
        setFallbackKind("none");
        setPendingRetry(null);
        applyWatchEventsResults(result);
        return;
      }

      if (intent.kind === "freeform") {
        const query = intent.query.trim();
        if (!query) throw new Error("Tell Koi what you are looking for.");
        setLastAskQuery(query);
        const activeTravelMode = travelModeForQuery(query);

        if (hasStreamingWatchContext(query)) {
          const mergedStreamingServiceIds = mergeStreamingServiceIds(
            intent.streamingServiceIds ?? activeStreamingServiceIds,
            extractStreamingProviders(query)
          );
          const subcategory = intent.watchSubcategory ?? activeWatchSubcategory;
          setActiveStreamingServiceIds(mergedStreamingServiceIds);
          setActiveWatchSubcategory(subcategory);
          setSearchKind("watch");
          setCurrentShareUrl("");
          trackEvent("watch_events_opened", { queryLength: query.length });
          applyWatchEventsResults(await fetchWatchResults(query, subcategory, mergedStreamingServiceIds));
          return;
        }

        setResults(null);
        setWatchEventsResult(null);

        const response = await fetch("/api/koi-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            context: { ...(intent.context ?? getActiveLocationContext()), travelMode: activeTravelMode },
            form: { ...(intent.form ?? form), travelMode: activeTravelMode },
            watchSubcategory: intent.watchSubcategory,
            streamingServiceIds: intent.streamingServiceIds,
            exploreIntent: intent.exploreIntent
          })
        });
        const data = (await response.json()) as KoiSearchApiResponse & {
          error?: string;
          needsLocation?: boolean;
          form?: SearchHalfwayRequest;
        };
        if (!response.ok) {
          const apiError = readApiSearchError(data);
          if (
            response.status === 422 &&
            (data.kind === "needs_location" ||
              data.needsLocation ||
              (apiError.kind === "NEEDS_LOCATION" && !shouldShowInlineSearchError(apiError)))
          ) {
            handleFreeformNeedsLocation(query, { ...data, error: apiError.message });
            return;
          }
          failSearch(apiError);
          return;
        }

        if (data.kind === "places") {
          setSearchKind("places");
          trackEvent("search_started", {
            category: data.data.category,
            hasPreferences: Boolean(data.data.preferences?.length)
          });
          applyPlacesResults(
            {
              ...form,
              category: data.data.category,
              customQuery: query,
              searchMode: data.data.searchMode
            },
            data.data
          );
          return;
        }

        if (data.kind === "watch") {
          if (data.data.preview) {
            setPendingRetry({ kind: "events", query });
            setShowLocationActions(true);
            setShowManualFallback(false);
            setSearchError(createSearchError("NEEDS_LOCATION", data.data.message || SEARCH_ERROR_MESSAGES.NEEDS_LOCATION));
            setSearchStatus("idle");
            return;
          }
          setSearchKind("watch");
          trackEvent("watch_events_opened", { queryLength: query.length });
          applyWatchEventsResults(data.data);
          return;
        }

        if (data.kind === "events") {
          if (data.data.preview) {
            setPendingRetry({ kind: "events", query });
            setShowLocationActions(true);
            setShowManualFallback(false);
            setSearchError(createSearchError("NEEDS_LOCATION", data.data.message || SEARCH_ERROR_MESSAGES.NEEDS_LOCATION));
            setSearchStatus("idle");
            return;
          }
          setSearchKind("events");
          trackEvent("watch_events_opened", { queryLength: query.length });
          applyWatchEventsResults(data.data);
        }
      }
    } catch (failure) {
      failSearch(failure);
    } finally {
      searchInFlightRef.current = false;
      const motionMs = intent.kind === "places" ? 950 : 650;
      const remainingMotionTime = motionMs - (Date.now() - startedAt);
      if (shouldPlayMotion && remainingMotionTime > 0) await wait(remainingMotionTime);
      setLoading(false);
    }
  }

  function handleFormChange(nextForm: SearchHalfwayRequest) {
    const locationChanged =
      nextForm.locationA.trim() !== form.locationA.trim() ||
      nextForm.locationAPlaceId !== form.locationAPlaceId ||
      JSON.stringify(nextForm.locationACoordinates) !== JSON.stringify(form.locationACoordinates);

    // Home location persists only from explicit builder/location edits — never from destination search submits.
    if (nextForm.locationA.trim() && locationChanged) {
      persistSavedLocation({
        locationA: nextForm.locationA,
        locationAPlaceId: nextForm.locationAPlaceId,
        locationACoordinates: nextForm.locationACoordinates
      });
    }

    if (locationChanged) {
      clearSearchError();
    }

    setForm(nextForm);
  }

  function startNewSearch() {
    if (openedFromSharedHalfway) {
      trackEvent("halfway_recipient_search_started", { category: form.category });
    }
    setResults(null);
    setWatchEventsResult(null);
    setSearchKind(null);
    clearSearchError();
    setShareMessage("");
    setCurrentShareUrl("");
    setOpenedFromSharedHalfway(false);
    setSearchStatus("idle");
    setLastAskQuery("");
    setLocationSavedMessage("");
    setShowClassicFallback(false);
    setFallbackKind("none");
    setPendingRetry(null);
    setShowLocationActions(false);
    setShowManualFallback(false);
    setForm(formWithStoredLocation(initialForm));
    syncUserLocationFromStorage();
    window.history.replaceState(null, "", "/");
    window.requestAnimationFrame(() => document.getElementById("search")?.scrollIntoView({ behavior: "smooth" }));
  }

  function promptForEventLocation(query: string): boolean {
    if (!queryRequiresEventLocation(query)) return false;

    const context = getActiveLocationContext();
    const eventForm = resolveEventSearchForm(query, form, context);
    if (eventSearchLocationReady(eventForm)) return false;

    setPendingRetry({ kind: "events", query });
    setShowLocationActions(true);
    setShowManualFallback(false);
    setShowClassicFallback(false);
    setFallbackKind("none");
    promptNeedsLocation();
    return true;
  }

  function handleFreeformNeedsLocation(
    query: string,
    data: {
      error?: string;
      needsLocation?: boolean;
      kind?: string;
      botMode?: "places" | "events";
      form?: SearchHalfwayRequest;
    }
  ) {
    if (data.botMode === "places" && data.form) {
      handleNeedsLocation(data.form);
    } else {
      setPendingRetry({ kind: "events", query });
      setShowLocationActions(true);
      setShowManualFallback(false);
    }
    const classified = classifySearchError(data.error ?? SEARCH_ERROR_MESSAGES.NEEDS_LOCATION);
    setSearchError(classified);
    setSearchStatus("idle");
  }

  function handleNeedsLocation(pendingForm: SearchHalfwayRequest) {
    setPendingRetry({ kind: "places", form: pendingForm });
    setShowLocationActions(true);
    setShowManualFallback(false);
  }

  function handleAiSubmitQuery(
    query: string,
    options?: {
      watchSubcategory?: WatchSubcategory;
      streamingServiceIds?: string[];
      builderStreaming?: boolean;
    }
  ) {
    if (options?.builderStreaming || hasStreamingWatchContext(query)) {
      void executeSearch({
        kind: "watch",
        query,
        subcategory: options?.watchSubcategory,
        streamingServiceIds: options?.streamingServiceIds
      });
      return;
    }

    if (promptForEventLocation(query)) return;

    void executeSearch({
      kind: "freeform",
      query,
      context: getActiveLocationContext(),
      watchSubcategory: options?.watchSubcategory,
      streamingServiceIds: options?.streamingServiceIds
    });
  }

  // Warm the koi-search cache before the user commits. Only fires when we already
  // have a resolved location (so it can return a cacheable result, not a 422
  // location prompt) and skips streaming asks, which route to a different endpoint.
  function prefetchAskQuery(query: string) {
    const trimmed = query.trim();
    if (!trimmed || loading) return;
    if (hasStreamingWatchContext(trimmed)) return;

    const context = getActiveLocationContext();
    const hasResolvedLocation =
      Boolean(context.locationACoordinates) || Boolean(form.locationACoordinates);
    if (!hasResolvedLocation) return;

    if (prefetchedAskRef.current === trimmed.toLowerCase()) return;
    prefetchedAskRef.current = trimmed.toLowerCase();

    void fetch("/api/koi-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: trimmed, context, form })
    }).catch(() => {});
  }

  function runWatchSearch(query: string, subcategory: WatchSubcategory) {
    void executeSearch({
      kind: "watch",
      query,
      subcategory,
      streamingServiceIds: mergeStreamingServiceIds(activeStreamingServiceIds, extractStreamingProviders(query))
    });
  }

  function runEventsSearch(query: string) {
    void executeSearch({ kind: "events", query });
  }

  function runPlacesSearchFromBuilder(nextForm: SearchHalfwayRequest, options?: SearchSubmitOptions) {
    void executeSearch({
      kind: "places",
      form: nextForm,
      askQuery: nextForm.customQuery?.trim() || lastAskQuery.trim() || "restaurants near me",
      submitOptions: options
    });
  }

  function handleBuilderExpanded(expanded: boolean) {
    setBuilderExpanded(expanded);
  }

  function openLocationChange() {
    clearSearchError();
    if (activeLocationLabel.trim()) {
      setShowManualFallback(true);
      setShowLocationActions(false);
    } else {
      setShowLocationActions(true);
      setShowManualFallback(false);
    }
    setManualLocationError("");
    setLocationSavedMessage("");
    window.requestAnimationFrame(() => {
      document.getElementById("ask-koi")?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function applyPopularSearch(query: string) {
    searchBoxRef.current?.fillQuery(query);
  }

  function runFilterSearch(query: string, options: PickQueryOptions, isStreaming: boolean) {
    applyPickOptionsToSession(options, handleBuilderModeChange, setActiveWatchSubcategory, setActiveStreamingServiceIds);

    if (isStreaming || options.watchSubcategory) {
      void executeSearch({
        kind: "watch",
        query,
        subcategory: options.watchSubcategory ?? activeWatchSubcategory,
        streamingServiceIds: options.streamingServiceIds ?? activeStreamingServiceIds
      });
      return;
    }

    // Sports/events chip picks ("Yankees games", "Concerts near me") belong on the
    // koi-search events path — not search-halfway, which would call Google Places first.
    if (shouldRouteFilterSearchToFreeform(query, options)) {
      if (promptForEventLocation(query)) return;

      const location = getActiveLocationContext();
      void executeSearch({
        kind: "freeform",
        query,
        context: location,
        form: {
          ...form,
          locationA: location.locationA?.trim() || form.locationA,
          locationAPlaceId: location.locationAPlaceId ?? form.locationAPlaceId,
          locationACoordinates: location.locationACoordinates ?? form.locationACoordinates,
          searchMode: "single"
        },
        watchSubcategory: options.watchSubcategory,
        streamingServiceIds: options.streamingServiceIds,
        exploreIntent: options.exploreIntent
      });
      return;
    }

    const searchForm = buildPlacesFormFromOptions(form, query, options, getActiveLocationContext());
    void executeSearch({
      kind: "places",
      form: searchForm,
      askQuery: query,
      submitOptions: options.builderMode === "destination" ? { preserveSavedHomeLocation: true } : undefined
    });
  }

  function submitLocationFallback() {
    if (!form.locationA.trim()) {
      setSearchError(
        createSearchError("NEEDS_LOCATION", "Add where you are, or tap Use my location below the search box.")
      );
      setSearchStatus("idle");
      scrollToFallback();
      return;
    }

    const searchMode = form.searchMode ?? "midpoint";
    if (searchMode === "midpoint" && !form.locationB.trim() && pendingRetry?.kind === "places") {
      setSearchError(createSearchError("NEEDS_LOCATION", "Add a second location for a fair midpoint search."));
      setSearchStatus("idle");
      scrollToFallback();
      return;
    }

    if (!pendingRetry) {
      setSearchError(createSearchError("NEEDS_LOCATION", "Ask Koi what you want up above, then try again."));
      setSearchStatus("idle");
      return;
    }

    setShowClassicFallback(false);
    setFallbackKind("none");
    const retry = pendingRetry;
    setPendingRetry(null);
    clearSearchError();
    persistSavedLocation(form);

    if (retry.kind === "events") {
      void executeSearch({ kind: "events", query: retry.query, locationContext: form });
      return;
    }

    void executeSearch({
      kind: "places",
      form: {
        ...retry.form,
        locationA: form.locationA,
        locationAPlaceId: form.locationAPlaceId,
        locationACoordinates: form.locationACoordinates,
        locationB: form.locationB,
        locationBPlaceId: form.locationBPlaceId,
        locationBCoordinates: form.locationBCoordinates,
        searchMode: form.searchMode ?? retry.form.searchMode
      },
      askQuery: retry.form.customQuery?.trim() || lastAskQuery.trim() || "restaurants near me"
    });
  }

  function submitClassicSearch() {
    void executeSearch({ kind: "places", form });
  }

  async function shareVenue(venue: ScoredVenue) {
    const url = currentShareUrl || window.location.href;
    const text = buildSingleVenueEmailBody(venue, url, results?.searchMode ?? "midpoint");
    if (!shouldUseNativeShare()) {
      setShareDialog({
        title: "Share this meetup",
        url,
        subject: "Let’s meet here",
        body: text
      });
      if (results?.searchMode === "midpoint") {
        trackEvent("halfway_result_shared", { category: results.category, scope: "venue" });
      }
      return;
    }

    const result = await shareWithFallback({ title: BRAND.name, text, url });
    if (result === "shared") setShareMessage("");
    if (result === "copied") setShareMessage("Spot copied to clipboard.");
    if (result === "email") setShareMessage("Email draft opened.");
    if (result === "cancelled") setShareMessage("Sharing was cancelled.");
    if (results?.searchMode === "midpoint") {
      trackEvent("halfway_result_shared", { category: results.category, scope: "venue" });
    }
  }

  async function shareMeetup() {
    if (!results) return;
    setShareMessage("Creating meetup link...");
    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form,
          results,
          selectedResultIds: results.venues.slice(0, 5).map((venue) => venue.id)
        })
      });
      const data = (await response.json()) as { shareUrl?: string; error?: string };
      if (!response.ok || !data.shareUrl) throw new Error(data.error ?? "Share link creation failed.");

      setCurrentShareUrl(data.shareUrl);
      const text =
        results.searchMode === "single"
          ? `Here are places that could work near ${shortLocationLabel(results.originA.formattedAddress)}.`
          : buildMeetupEmailBody(results, data.shareUrl);
      if (!shouldUseNativeShare()) {
        setShareDialog({
          title: "Share this meetup",
          url: data.shareUrl,
          subject: "Let’s meet here",
          body: buildMeetupEmailBody(results, data.shareUrl)
        });
        setShareMessage("");
        return;
      }

      const result = await shareWithFallback({ title: `${BRAND.name} meetup`, text, url: data.shareUrl });
      if (result === "shared" || result === "copied") setShareMessage("Meetup link copied.");
      if (result === "email") setShareMessage("Email draft opened.");
      if (result === "cancelled") setShareMessage("Sharing was cancelled.");
      trackEvent("share_link_created", {
        category: results.category,
        resultCount: results.venues.length,
        hasPreferences: results.preferences.length > 0
      });
      if (results.searchMode === "midpoint") {
        trackEvent("halfway_result_shared", { category: results.category, resultCount: results.venues.length });
      }
    } catch (error) {
      console.warn("[share] Falling back to URL search sharing.", error);
      const fallbackUrl = currentShareUrl || window.location.href;
      if (!shouldUseNativeShare() && results) {
        setShareDialog({
          title: "Share this meetup",
          url: fallbackUrl,
          subject: "Let’s meet here",
          body: buildMeetupEmailBody(results, fallbackUrl)
        });
        setShareMessage("");
        return;
      }
      const result = await shareWithFallback({
        title: `${BRAND.name} meetup`,
        text: "Here is the Koi search.",
        url: fallbackUrl
      });
      if (result === "shared" || result === "copied") setShareMessage("Search link copied.");
      if (result === "email") setShareMessage("Email draft opened.");
      if (result === "cancelled") setShareMessage("Sharing was cancelled.");
    }
  }

  const hasSuccessfulResults =
    searchStatus === "success" &&
    Boolean((results && !isEmptyPlacesResults(results)) || (watchEventsResult && !isEmptyWatchResults(watchEventsResult)));
  const showLandingHero = !hasSuccessfulResults;
  const showResultsChrome = hasSuccessfulResults;
  const showLocationOnboarding = showLandingHero && !hasHomeLocation;

  return (
    <main className="min-h-screen overflow-x-hidden bg-mint text-ink">
      {showLandingHero ? null : <CompactHeader variant="light" />}

      {showLandingHero ? (
        <>
          <section id="search" className="relative isolate overflow-x-hidden bg-ink pb-8 pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:pb-10 sm:pt-[calc(env(safe-area-inset-top)+1rem)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-15%,rgba(255,90,0,0.14),transparent_58%),radial-gradient(circle_at_88%_8%,rgba(10,132,255,0.08),transparent_32%),linear-gradient(180deg,#0A1323_0%,#0c1729_50%,#0A1323_100%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0A1323] via-[#0A1323]/70 to-transparent sm:h-24" />
            <div className={`relative z-10 grid w-full gap-5 py-2 sm:gap-6 sm:py-4 ${PAGE_CONTAINER}`}>
              {showLocationOnboarding ? (
                <>
                  <MarketingHero />
                  <LocationOnboardingCard
                    locating={locating}
                    resolvingManual={resolvingManual}
                    manualLocationError={manualLocationError}
                    onUseCurrentLocation={() => void requestUserLocation()}
                    onSubmitManualLocation={(input, placeId) => void resolveManualLocation(input, placeId)}
                  />
                  <OnboardingCapabilityPreview />
                </>
              ) : (
                <>
              <MarketingHero />
              <SearchContextStrip
                locationLabel={activeLocationLabel}
                onChangeLocation={openLocationChange}
                travelMode={travelMode}
                onTravelModeChange={handleTravelModeChange}
                busy={loading || locating || resolvingManual}
              />
              <SearchPromptAssistProvider
                busy={loading || locating || resolvingManual}
                builderMode={builderMode}
                onBuilderModeChange={handleBuilderModeChange}
                userCoordinates={locationContext.locationACoordinates}
              >
                <AiSearchBox
                  ref={searchBoxRef}
                  surface="hero"
                  loading={loading}
                  locationStatus={locationStatus}
                  locationUiState={locationUiState}
                  showManualFallback={showManualFallback}
                  showLocationActions={showLocationActions}
                  manualLocationError={manualLocationError}
                  locationContext={locationContext}
                  defaultUserAddress={savedUserAddress}
                  locating={locating}
                  resolvingManual={resolvingManual}
                  locationSavedMessage={locationSavedMessage}
                  searchError={searchError}
                  onSubmitQuery={handleAiSubmitQuery}
                  onPrefetchQuery={prefetchAskQuery}
                  onNeedsLocation={handleNeedsLocation}
                  onPersistUserAddress={persistUserAddress}
                  onUseLocation={() => void requestUserLocation()}
                  onShowZipFallback={showZipFallback}
                  onSubmitManualLocation={(input, placeId) => void resolveManualLocation(input, placeId)}
                />
                <TrendingNearYouStrip
                  latitude={locationContext.locationACoordinates?.lat}
                  longitude={locationContext.locationACoordinates?.lng}
                  locationPending={trendingGeocoding}
                  busy={loading || locating || resolvingManual}
                  onSearchQuery={applyPopularSearch}
                  onRequestLocation={openLocationChange}
                />
                <SearchPromptModePicker />
                <ClassicSearchControls
                  form={form}
                  loading={loading}
                  savedLocationLabel={activeLocationLabel}
                  expanded={builderExpanded}
                  onExpandedChange={handleBuilderExpanded}
                  mode={builderMode}
                  onSearchPlaces={runPlacesSearchFromBuilder}
                  onSearchWatch={runWatchSearch}
                />
                <SearchPromptDetailChips />
                <SelectedFiltersPanel
                  busy={loading || locating || resolvingManual}
                  onSearch={runFilterSearch}
                />
                <HeroPopularSearches
                  compact
                  busy={loading || locating || resolvingManual}
                  onSelect={applyPopularSearch}
                />
                <HeroNeedIdeas
                  busy={loading || locating || resolvingManual}
                  onSelect={applyPopularSearch}
                />
              </SearchPromptAssistProvider>
              {loading ? (
                <section className="mt-2" aria-live="polite">
                  <KoiThinkingLoader searchKind={searchKind} phase={loadingPhase} />
                </section>
              ) : null}
              <LocationFallbackPanel
                form={form}
                loading={loading}
                pendingQuery={pendingRetry?.kind === "events" ? pendingRetry.query : undefined}
                hidden={!showClassicFallback || fallbackKind !== "location"}
                onChange={handleFormChange}
                onSubmit={submitLocationFallback}
              />
              <ClassicSearchPanel
                form={form}
                loading={loading}
                discoveryMode="places"
                onChange={handleFormChange}
                onSubmit={submitClassicSearch}
                hidden={!showClassicFallback || fallbackKind !== "full" || searchKind === "watch"}
              />
                </>
              )}
            </div>
          </section>
        </>
      ) : null}

      <div className={showResultsChrome ? "relative overflow-hidden bg-[#0A1323] text-ink" : "bg-mint"}>
        {showResultsChrome ? (
          <>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-10%,rgba(255,90,0,0.18),transparent_62%),radial-gradient(circle_at_90%_8%,rgba(10,132,255,0.12),transparent_28%),linear-gradient(180deg,#0A1323_0%,#0d1829_42%,#F5F7F2_42%,#F5F7F2_100%)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-white/[0.04] to-transparent" />
          </>
        ) : null}
        <div className={`relative z-10 ${PAGE_CONTAINER}`}>
          {showResultsChrome ? (
            <CompactResultsHeader
              loading={loading}
              searchKind={searchKind}
              topVenue={topVenue}
              searchMode={results?.searchMode}
              searchCategory={results?.category}
              weatherPoint={weatherPoint}
              topRecommendation={topWatchRecommendation}
              loadingLabel={
                searchKind === "watch"
                  ? "Finding streaming picks"
                  : searchKind === "events"
                    ? "Finding local events"
                    : loadingPhaseLabel
              }
              canShare={Boolean(results?.venues.length || currentShareUrl)}
              onShare={shareMeetup}
              onNewSearch={startNewSearch}
            />
          ) : null}

          {showRoadDividerPreview ? (
            <RoadDivider className="mt-5 w-full" />
          ) : null}

        {loading && !showLandingHero ? (
          <section className="mt-8">
            <KoiThinkingLoader searchKind={searchKind} phase={loadingPhase} />
          </section>
        ) : null}

        {watchEventsResult && !loading ? (
          <WatchEventsResults
            result={watchEventsResult}
            onRefineWatch={(query, subcategory) => runWatchSearch(query, subcategory ?? activeWatchSubcategory)}
            onRefineEvents={runEventsSearch}
          />
        ) : null}

        {results && !loading ? (
          <section className="search-results-enter mt-5 grid gap-5 pb-16">
            <div className="results-panel-enter grid gap-5">
              {openedFromSharedHalfway && results.searchMode === "midpoint" ? (
                <SharedHalfwayReferralBanner onStartSearch={startNewSearch} />
              ) : null}

              {shareMessage ? (
                <p className={`mb-4 text-sm font-semibold ${activeAccent.text}`}>{shareMessage}</p>
              ) : null}

              <WeatherCard midpoint={results.midpoint} searchMode={results.searchMode} />

              {results.events?.length ? (
                <div className="results-list-enter grid gap-4">
                  <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate">
                    {eventResultsHeading(results.query)}
                  </h2>
                  {results.events.map((event, index) => (
                    <EventResultCard key={event.id} event={event} rank={index + 1} isKoiPick={index === 0} />
                  ))}
                </div>
              ) : null}

              {results.venues.length ? (
                <div className="results-list-enter grid gap-4">
                  {(() => {
                    const curated = results.venues.slice(0, KOI_PICK_DISPLAY_LIMIT);
                    const [koiPick, ...otherOptions] = curated;
                    return (
                      <>
                        {koiPick ? (
                          <VenueCard
                            key={koiPick.id}
                            venue={koiPick}
                            rank={1}
                            isKoiPick
                            originALabel={resultContext?.originALabel ?? "Person A"}
                            originBLabel={resultContext?.originBLabel ?? "Person B"}
                            isClosestToHalfway={koiPick.id === resultContext?.closestVenueId}
                            isShortestCombined={koiPick.id === resultContext?.shortestCombinedVenueId}
                            searchCategory={results.category}
                            searchMode={results.searchMode}
                            meetupMode={results.meetupMode}
                            onShare={shareVenue}
                            shareUrl={currentShareUrl}
                          />
                        ) : null}
                        {otherOptions.length ? (
                          <div className="grid gap-4">
                            <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate">Other Good Options</h2>
                            {otherOptions.map((venue, index) => (
                              <VenueCard
                                key={venue.id}
                                venue={venue}
                                rank={index + 2}
                                originALabel={resultContext?.originALabel ?? "Person A"}
                                originBLabel={resultContext?.originBLabel ?? "Person B"}
                                isClosestToHalfway={venue.id === resultContext?.closestVenueId}
                                isShortestCombined={venue.id === resultContext?.shortestCombinedVenueId}
                                searchCategory={results.category}
                                searchMode={results.searchMode}
                                meetupMode={results.meetupMode}
                                onShare={shareVenue}
                                shareUrl={currentShareUrl}
                              />
                            ))}
                          </div>
                        ) : null}
                      </>
                    );
                  })()}
                </div>
              ) : results.events?.length ? null : results.eventProfile ? (
                <EmptyState
                  title="No upcoming events found"
                  description="We couldn't find matching events in this window. Try another team, sport, or a wider timeframe."
                />
              ) : (
                <EmptyState />
              )}
            </div>
          </section>
        ) : null}
        </div>
      </div>

      <Footer />
      {shareDialog ? (
        <ShareDialog
          dialog={shareDialog}
          onCopied={() => setShareMessage("Link copied")}
          onClose={() => setShareDialog(null)}
        />
      ) : null}
    </main>
  );
}

function LocationFallbackPanel({
  form,
  loading,
  pendingQuery,
  onChange,
  onSubmit,
  hidden = false
}: {
  form: SearchHalfwayRequest;
  loading: boolean;
  pendingQuery?: string;
  onChange: (form: SearchHalfwayRequest) => void;
  onSubmit: () => void;
  hidden?: boolean;
}) {
  if (hidden) return null;

  return (
    <section id="location-fallback" className="scroll-mt-24">
      <p className="mb-3 text-sm font-black uppercase tracking-[0.14em] text-clay">Add your location</p>
      {pendingQuery ? (
        <p className="mb-4 rounded-lg border border-line bg-mint px-4 py-3 text-sm font-semibold text-ink">
          Looking for: “{pendingQuery}”
        </p>
      ) : null}
      <LocationForm
        form={form}
        loading={loading}
        discoveryMode="watch"
        variant="location-only"
        submitLabel={pendingQuery ? "Search" : "Search nearby"}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    </section>
  );
}

function ClassicSearchPanel({
  form,
  loading,
  discoveryMode,
  onChange,
  onSubmit,
  hidden = false
}: {
  form: SearchHalfwayRequest;
  loading: boolean;
  discoveryMode: KoiBotMode;
  onChange: (form: SearchHalfwayRequest) => void;
  onSubmit: () => void;
  hidden?: boolean;
}) {
  if (hidden) return null;

  return (
    <section id="classic-search" className="scroll-mt-24">
      <p className="mb-3 text-sm font-black uppercase tracking-[0.14em] text-clay">Use classic search</p>
      <LocationForm
        form={form}
        loading={loading}
        discoveryMode={discoveryMode}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    </section>
  );
}

function SharedHalfwayReferralBanner({ onStartSearch }: { onStartSearch: () => void }) {
  return (
    <div className="rounded-card border border-line bg-paper p-4 shadow-soft sm:p-5">
      <p className="text-sm font-bold text-ink">Shared meetup spot</p>
      <p className="mt-1 text-sm leading-6 text-slate">
        Planning your own meetup? Ask Koi to find a spot that works for both of you.
      </p>
      <button
        type="button"
        onClick={onStartSearch}
        className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-koi px-5 text-sm font-bold text-white transition hover:bg-koi-hover focus:outline-none focus:ring-4 focus:ring-koi/25"
      >
        Ask Koi your own question
      </button>
    </div>
  );
}

function updateShareUrl(form: SearchHalfwayRequest) {
  const params = new URLSearchParams();
  if (form.locationA) params.set("a", form.locationA);
  if (form.locationAPlaceId) params.set("aPlaceId", form.locationAPlaceId);
  if (form.locationACoordinates) {
    params.set("aLat", String(form.locationACoordinates.lat));
    params.set("aLng", String(form.locationACoordinates.lng));
  }
  if (form.locationB) params.set("b", form.locationB);
  if (form.locationBPlaceId) params.set("bPlaceId", form.locationBPlaceId);
  if (form.locationBCoordinates) {
    params.set("bLat", String(form.locationBCoordinates.lat));
    params.set("bLng", String(form.locationBCoordinates.lng));
  }
  params.set("category", form.category);
  if (form.searchMode === "single") params.set("searchMode", "single");
  if (form.meetupMode && form.meetupMode !== "single") params.set("mode", form.meetupMode);
  if (form.customQuery) params.set("q", form.customQuery);
  if (form.preferences?.length) params.set("preferences", form.preferences.join(","));
  const path = `/?${params.toString()}`;
  window.history.replaceState(null, "", path);
  return `${window.location.origin}${path}`;
}

function parseCoordinates(latValue: string | null, lngValue: string | null) {
  if (!latValue || !lngValue) return undefined;
  const lat = Number(latValue);
  const lng = Number(lngValue);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  return { lat, lng };
}

function formatMinutes(value: number | null) {
  if (typeof value !== "number") return "N/A";
  if (value < 60) return `${value} min`;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

function buildSingleVenueEmailBody(venue: ScoredVenue, currentUrl: string, searchMode: SearchHalfwayResponse["searchMode"] = "midpoint") {
  const a = formatMinutes(venue.travelFromA.durationMinutes);
  const b = formatMinutes(venue.travelFromB.durationMinutes);
  const hasTimes =
    typeof venue.travelFromA.durationMinutes === "number" &&
    typeof venue.travelFromB.durationMinutes === "number" &&
    venue.travelFromA.status === "OK" &&
    venue.travelFromB.status === "OK";

  if (searchMode === "midpoint" && hasTimes) {
    return [
      "Found a spot that works for both of us.",
      "",
      venue.name,
      venue.address,
      "",
      `${a} for me.`,
      `${b} for you.`,
      "",
      "Think this works?",
      "",
      currentUrl,
      "",
      "Ask Koi your own question:",
      BRAND.url
    ].join("\n");
  }

  return [
    "Koi found a meetup option:",
    "",
    venue.name,
    venue.address,
    "",
    "Drive times:",
    `Me: ${a}`,
    `You: ${b}`,
    "",
    "View details:",
    currentUrl
  ].join("\n");
}

function buildMeetupEmailBody(results: SearchHalfwayResponse, currentUrl: string) {
  const topVenue = results.venues[0];
  const hasTimes =
    topVenue &&
    typeof topVenue.travelFromA.durationMinutes === "number" &&
    typeof topVenue.travelFromB.durationMinutes === "number" &&
    topVenue.travelFromA.status === "OK" &&
    topVenue.travelFromB.status === "OK";

  if (results.searchMode === "midpoint" && topVenue && hasTimes) {
    return [
      "Found a spot that works for both of us.",
      "",
      topVenue.name,
      topVenue.address,
      "",
      `${formatMinutes(topVenue.travelFromA.durationMinutes)} for me.`,
      `${formatMinutes(topVenue.travelFromB.durationMinutes)} for you.`,
      "",
      "Think this works?",
      "",
      currentUrl,
      "",
      "Ask Koi your own question:",
      BRAND.url
    ].join("\n");
  }

  const recommendations = results.venues.slice(0, 3).map((venue, index) => {
    const rating = typeof venue.rating === "number" ? `${venue.rating.toFixed(1)} stars` : "Not rated";
    return `${index + 1}. ${venue.name} — ${venue.category} — ${rating} — ${formatDriveComparison(venue)}`;
  });

  return [
    results.searchMode === "single" ? "Koi found meetup options nearby:" : "Koi found a meetup option:",
    "",
    ...recommendations,
    "",
    "View details:",
    currentUrl
  ].join("\n");
}

function formatDriveComparison(venue: ScoredVenue) {
  return `${formatMinutes(venue.travelFromA.durationMinutes)} / ${formatMinutes(venue.travelFromB.durationMinutes)}`;
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function findClosestVenueId(venues: ScoredVenue[], midpoint: LatLng) {
  return venues.reduce<{ id: string; distance: number } | null>((closest, venue) => {
    const distance = distanceBetween(venue.location, midpoint);
    if (!closest || distance < closest.distance) return { id: venue.id, distance };
    return closest;
  }, null)?.id;
}

function findShortestCombinedVenueId(venues: ScoredVenue[]) {
  return venues.reduce<{ id: string; total: number } | null>((shortest, venue) => {
    if (typeof venue.totalTravelMinutes !== "number") return shortest;
    if (!shortest || venue.totalTravelMinutes < shortest.total) {
      return { id: venue.id, total: venue.totalTravelMinutes };
    }
    return shortest;
  }, null)?.id;
}

function distanceBetween(a: LatLng, b: LatLng) {
  const lat = a.lat - b.lat;
  const lng = a.lng - b.lng;
  return Math.sqrt(lat * lat + lng * lng);
}
