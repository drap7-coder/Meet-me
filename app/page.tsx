"use client";

import { EmptyState } from "@/app/components/EmptyState";
import { FairMeetupPreview } from "@/app/components/FairMeetupPreview";
import { KoiThinkingLoader } from "@/app/components/KoiThinkingLoader";
import { AiSearchBox, type AiSearchBoxHandle } from "@/app/components/AiSearchBox";
import { CompactResultsHeader } from "@/app/components/home/CompactResultsHeader";
import { MarketingHero } from "@/app/components/home/MarketingHero";
import { ShareDialog, type ShareDialogState } from "@/app/components/home/ShareDialog";
import { Footer, SiteHeader } from "@/app/components/home/SiteChrome";
import { ClassicSearchControls } from "@/app/components/ClassicSearchControls";
import { PersistentLocationBar } from "@/app/components/PersistentLocationBar";
import { KoiExampleSearchCard } from "@/app/components/KoiExampleSearchCard";
import { LocationForm } from "@/app/components/LocationForm";
import { RoadDivider } from "@/app/components/BrandRoad";
import { ResultsMap } from "@/app/components/ResultsMap";
import { SearchPromptAssist, type PickQueryOptions } from "@/app/components/SearchPromptAssist";
import type { SearchBuilderMode } from "@/lib/searchBuilderOptions";
import { formForSessionAfterSearch, type SearchSubmitOptions } from "@/lib/searchLocation";
import { VenueCard } from "@/app/components/VenueCard";
import { WatchEventsResults } from "@/app/components/WatchEventsResults";
import { WeatherCard } from "@/app/components/WeatherCard";
import {
  clearRecentMeetups,
  createRecentMeetup,
  getRecentMeetupCardDisplay,
  getRecentMeetups,
  recentMeetupToForm,
  saveRecentMeetup,
  type RecentMeetup
} from "@/lib/recentMeetups";
import { normalizeCategory, parseMeetupMode, parseSearchMode } from "@/lib/categories";
import { parsePreferences } from "@/lib/preferences";
import { shareWithFallback, shouldUseNativeShare } from "@/lib/share";
import { trackEvent } from "@/lib/analytics";
import { DEFAULT_WATCH_SUBCATEGORY } from "@/lib/watchBrowse";
import {
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
import { readStoredLocationSnapshot, resolveLocationChipLabel, restoreStoredLocation } from "@/lib/homeLocation";
import { mergeSavedUserLocation, getSavedUserLocation } from "@/lib/savedUserLocation";
import { getSearchAccent } from "@/lib/searchAccent";
import { KOI_PICK_DISPLAY_LIMIT, THINKING_PROGRESS_LABELS } from "@/lib/koiCapabilityExamples";
import type { KoiBotMode, LatLng, ScoredVenue, SearchHalfwayRequest, SearchHalfwayResponse, VenueCategory, WatchEventsApiResponse, WatchEventsResult, WatchSubcategory } from "@/lib/types";
import { BRAND } from "@/src/config/branding";
import { useEffect, useMemo, useRef, useState } from "react";

const initialForm: SearchHalfwayRequest = {
  locationA: "",
  locationB: "",
  category: "restaurant",
  searchMode: "single",
  meetupMode: "single",
  customQuery: ""
};

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
  const [showClassicFallback, setShowClassicFallback] = useState(false);
  const [fallbackKind, setFallbackKind] = useState<FallbackKind>("none");
  const [pendingRetry, setPendingRetry] = useState<PendingRetry | null>(null);
  const [locationStatus, setLocationStatus] = useState(() => readStoredLocationSnapshot().locationStatus);
  const [savedLocation, setSavedLocation] = useState(() => readStoredLocationSnapshot().savedLocation);
  const [savedUserAddress, setSavedUserAddress] = useState(() => readStoredLocationSnapshot().savedUserAddress);
  const [locationUiState, setLocationUiState] = useState<LocationUiState>("idle");
  const [showManualFallback, setShowManualFallback] = useState(false);
  const [showLocationActions, setShowLocationActions] = useState(false);
  const [manualLocationError, setManualLocationError] = useState("");
  const [locating, setLocating] = useState(false);
  const [resolvingManual, setResolvingManual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [currentShareUrl, setCurrentShareUrl] = useState("");
  const [openedFromSharedHalfway, setOpenedFromSharedHalfway] = useState(false);
  const [shareDialog, setShareDialog] = useState<ShareDialogState | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentMeetups, setRecentMeetups] = useState<RecentMeetup[]>([]);
  const [showRoadDividerPreview, setShowRoadDividerPreview] = useState(false);
  const [builderExpanded, setBuilderExpanded] = useState(false);
  const [builderMode, setBuilderMode] = useState<SearchBuilderMode>("near_me");
  const [loadingPhase, setLoadingPhase] = useState(0);
  const searchBoxRef = useRef<AiSearchBoxHandle>(null);
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
      return savedLocation;
    }

    const stored = getSavedUserLocation();
    if (stored?.locationACoordinates && stored.locationA.trim()) {
      return stored;
    }

    if (savedUserAddress.trim()) {
      return {
        locationA: savedUserAddress,
        locationAPlaceId: stored?.locationAPlaceId,
        locationACoordinates: stored?.locationACoordinates
      };
    }

    return {
      locationA: form.locationA,
      locationAPlaceId: form.locationAPlaceId,
      locationACoordinates: form.locationACoordinates
    };
  }

  const locationContext = useMemo(() => getActiveLocationContext(), [
    savedLocation,
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
        submitSearch(nextForm, shareId ? `${window.location.origin}/s/${shareId}` : undefined);
      }
    }
  }, []);

  useEffect(() => {
    setForm((current) => formWithStoredLocation(current));
  }, []);

  useEffect(() => {
    setRecentMeetups(getRecentMeetups());
  }, []);

  useEffect(() => {
    syncUserLocationFromStorage();
  }, []);

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
    setError(message);
    scrollToFallback();
  }

  function openFullFallback(message?: string) {
    setPendingRetry(null);
    setFallbackKind("full");
    setShowClassicFallback(true);
    if (message) setError(message);
    scrollToFallback();
  }

  async function applyResolvedLocation(
    nextForm: SearchHalfwayRequest,
    uiState: Extract<LocationUiState, "browser_success" | "manual_success">,
    retry?: PendingRetry | null
  ) {
    setForm(nextForm);
    persistSavedLocation(nextForm);
    setLocationUiState(uiState);
    setShowManualFallback(false);
    setShowLocationActions(false);
    setManualLocationError("");

    const activeRetry = retry ?? pendingRetry;
    if (activeRetry?.kind === "events") {
      setShowClassicFallback(false);
      setFallbackKind("none");
      setPendingRetry(null);
      await submitEventsSearch(activeRetry.query, nextForm);
      return;
    }
    if (activeRetry?.kind === "places") {
      setShowClassicFallback(false);
      setFallbackKind("none");
      setPendingRetry(null);
      runParsedSearch({
        ...activeRetry.form,
        locationA: nextForm.locationA,
        locationAPlaceId: nextForm.locationAPlaceId,
        locationACoordinates: nextForm.locationACoordinates,
        searchMode: "single"
      });
    }
  }

  async function resolveManualLocation(input: string) {
    const trimmed = input.trim();
    if (!trimmed) {
      setManualLocationError("Enter a ZIP code or city.");
      setLocationUiState("manual_error");
      return;
    }
    if (!isValidManualLocationInput(trimmed)) {
      setManualLocationError("We couldn't find that location. Try a ZIP code or city/state.");
      setLocationUiState("manual_error");
      return;
    }

    setResolvingManual(true);
    setManualLocationError("");
    setLocationUiState("manual_resolving");
    try {
      const resolved = await geocodeManualLocation(trimmed);
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
        setError("Location blocked? Enter a ZIP code instead.");
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
      await applyResolvedLocation(nextForm, "browser_success", retry ?? pendingRetry);
    } catch {
      syncUserLocationFromStorage();
      setLocationUiState("browser_failed");
      setShowManualFallback(true);
      setShowLocationActions(false);
      if (retry ?? pendingRetry) {
        setError("Location blocked? Enter a ZIP code instead.");
      }
    } finally {
      setLocating(false);
    }
  }

  const resultCountLabel = useMemo(() => {
    if (watchEventsResult?.recommendations.length) return "Koi Pick ready";
    if (results?.venues.length) return "Koi Pick ready";
    return "";
  }, [results, watchEventsResult]);

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

  async function submitSearch(searchForm: SearchHalfwayRequest = form, existingShareUrl?: string) {
    const startedAt = Date.now();
    const shouldPlayMotion = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setSearchKind("places");
    setHasSearched(true);
    setLoading(true);
    setError("");
    setShareMessage("");
    setWatchEventsResult(null);
    trackEvent("search_started", {
      category: searchForm.category,
      hasPreferences: Boolean(searchForm.preferences?.length)
    });
    try {
      const response = await fetch("/api/search-halfway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchForm)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Search failed.");
      setResults(data);
      const shareUrl = updateShareUrl(searchForm);
      setCurrentShareUrl(existingShareUrl ?? shareUrl);
      setRecentMeetups(saveRecentMeetup(createRecentMeetup(searchForm, data, shareUrl)));
      syncUserLocationFromStorage();
      trackEvent("search_completed", {
        category: data.category,
        resultCount: data.venues.length,
        hasWeather: true,
        hasPreferences: data.preferences.length > 0
      });
    } catch (searchError) {
      setResults(null);
      setError(searchError instanceof Error ? searchError.message : "Search failed.");
    } finally {
      const remainingMotionTime = 950 - (Date.now() - startedAt);
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

    setForm(nextForm);
  }

  function startNewSearch() {
    if (openedFromSharedHalfway) {
      trackEvent("halfway_recipient_search_started", { category: form.category });
    }
    setResults(null);
    setWatchEventsResult(null);
    setSearchKind(null);
    setError("");
    setShareMessage("");
    setCurrentShareUrl("");
    setOpenedFromSharedHalfway(false);
    setHasSearched(false);
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

  function rerunRecentMeetup(meetup: RecentMeetup) {
    const nextForm = recentMeetupToForm(meetup);
    setForm(nextForm);
    submitSearch(nextForm);
  }

  function runParsedSearch(nextForm: SearchHalfwayRequest, options?: SearchSubmitOptions) {
    setWatchEventsResult(null);
    const resolvedForm = resolveCurrentLocationInForm(nextForm, getActiveLocationContext());
    if (needsCurrentLocationResolution(resolvedForm)) {
      setPendingRetry({ kind: "places", form: resolvedForm });
      setShowLocationActions(true);
      setShowManualFallback(false);
      setError("Add your location to search nearby.");
      return;
    }
    setShowClassicFallback(false);
    setFallbackKind("none");
    setPendingRetry(null);
    setShowLocationActions(false);
    setForm(formForSessionAfterSearch(resolvedForm, getActiveLocationContext(), options));
    submitSearch(resolvedForm);
  }

  function handleNeedsLocation(pendingForm: SearchHalfwayRequest) {
    setPendingRetry({ kind: "places", form: pendingForm });
    setShowLocationActions(true);
    setShowManualFallback(false);
  }

  async function submitWatchSearch(query: string, subcategory: WatchSubcategory = activeWatchSubcategory) {
    const startedAt = Date.now();
    const shouldPlayMotion = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setSearchKind("watch");
    setActiveWatchSubcategory(subcategory);
    setHasSearched(true);
    setLoading(true);
    setResults(null);
    setWatchEventsResult(null);
    setError("");
    setShareMessage("");
    setCurrentShareUrl("");
    trackEvent("watch_events_opened", {
      queryLength: query.length
    });

    try {
      const response = await fetch("/api/watch-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, subcategory })
      });
      const data = (await response.json()) as WatchEventsResult & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Watch search failed.");

      setWatchEventsResult(data);
      syncUserLocationFromStorage();
      trackEvent("watch_events_completed", {
        intent: data.intent,
        resultCount: data.resultCount
      });
    } catch (searchError) {
      setWatchEventsResult(null);
      setError(searchError instanceof Error ? searchError.message : "Watch search failed.");
    } finally {
      const remainingMotionTime = 650 - (Date.now() - startedAt);
      if (shouldPlayMotion && remainingMotionTime > 0) await wait(remainingMotionTime);
      setLoading(false);
    }
  }

  async function submitEventsSearch(query: string, locationContext?: SearchHalfwayRequest) {
    const startedAt = Date.now();
    const shouldPlayMotion = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let redirectedToPlaces = false;
    let eventLocationContext = resolveCurrentLocationInForm(locationContext ?? form, getActiveLocationContext());
    if (looksLikeCurrentLocationQuery(query) && needsCurrentLocationResolution({ ...eventLocationContext, locationA: "me", searchMode: "single" })) {
      setPendingRetry({ kind: "events", query });
      setShowLocationActions(true);
      setShowManualFallback(false);
      setError("Add your location to search nearby.");
      return;
    }
    if (!eventLocationContext.locationA.trim() || needsCurrentLocationResolution(eventLocationContext)) {
      setSearchKind("events");
      setHasSearched(true);
      setResults(null);
      setWatchEventsResult(null);
      openLocationFallback({ kind: "events", query }, "Add your location to search nearby.");
      return;
    }

    setSearchKind("events");
    setHasSearched(true);
    setLoading(true);
    setResults(null);
    setWatchEventsResult(null);
    setError("");
    setShareMessage("");
    setCurrentShareUrl("");
    trackEvent("watch_events_opened", {
      queryLength: query.length
    });

    try {
      const response = await fetch("/api/watch-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, form: eventLocationContext })
      });
      const data = (await response.json()) as WatchEventsApiResponse & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Search failed.");

      if (data.botMode === "places") {
        setForm(data.form);
        await submitSearch(data.form);
        redirectedToPlaces = true;
        return;
      }

      if ("append" in data && data.append) {
        throw new Error("Unexpected load-more response.");
      }

      const result = data as WatchEventsResult;
      if (result.preview) {
        openLocationFallback({ kind: "events", query }, "Add your location to search nearby.");
        throw new Error("Add your location to search nearby.");
      }
      setShowClassicFallback(false);
      setFallbackKind("none");
      setPendingRetry(null);
      setWatchEventsResult(result);
      syncUserLocationFromStorage();
      trackEvent("watch_events_completed", {
        intent: result.intent,
        resultCount: result.resultCount
      });
    } catch (searchError) {
      setWatchEventsResult(null);
      setError(searchError instanceof Error ? searchError.message : "Search failed.");
      scrollToFallback();
    } finally {
      if (!redirectedToPlaces) {
        const remainingMotionTime = 650 - (Date.now() - startedAt);
        if (shouldPlayMotion && remainingMotionTime > 0) await wait(remainingMotionTime);
        setLoading(false);
      }
    }
  }

  function runWatchSearch(query: string, subcategory: WatchSubcategory) {
    void submitWatchSearch(query, subcategory);
  }

  function runEventsSearch(query: string) {
    void submitEventsSearch(query);
  }

  function expandBuilder(mode?: SearchBuilderMode) {
    setBuilderExpanded(true);
    if (mode) setBuilderMode(mode);
  }

  function openLocationChange() {
    if (activeLocationLabel.trim()) {
      setShowManualFallback(true);
      setShowLocationActions(false);
    } else {
      setShowLocationActions(true);
      setShowManualFallback(false);
    }
    setManualLocationError("");
    window.requestAnimationFrame(() => {
      document.getElementById("ask-koi")?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function fillSuggestedQuery(query: string, options?: PickQueryOptions) {
    searchBoxRef.current?.fillQuery(query, options?.watchSubcategory);
    const stored = getActiveLocationContext();
    if (options?.searchMode === "midpoint") expandBuilder("halfway");
    setForm((current) => {
      const next = { ...current };
      if (!next.locationA.trim() && stored.locationA?.trim()) {
        next.locationA = stored.locationA;
        next.locationAPlaceId = stored.locationAPlaceId;
        next.locationACoordinates = stored.locationACoordinates;
      }
      if (options?.category) next.category = options.category;
      if (options?.watchSubcategory) next.watchSubcategory = options.watchSubcategory;
      else if (options?.category && options.category !== "custom") next.watchSubcategory = undefined;
      if (options?.searchMode) next.searchMode = options.searchMode;
      return next;
    });
  }

  function submitLocationFallback() {
    if (!form.locationA.trim()) {
      setError("Add where you are, or tap Use my location below the search box.");
      scrollToFallback();
      return;
    }

    const searchMode = form.searchMode ?? "midpoint";
    if (searchMode === "midpoint" && !form.locationB.trim() && pendingRetry?.kind === "places") {
      setError("Add a second location for a fair midpoint search.");
      scrollToFallback();
      return;
    }

    if (!pendingRetry) {
      setError("Ask Koi what you want up above, then try again.");
      return;
    }

    setShowClassicFallback(false);
    setFallbackKind("none");
    const retry = pendingRetry;
    setPendingRetry(null);
    setError("");
    persistSavedLocation(form);

    if (retry.kind === "events") {
      void submitEventsSearch(retry.query, form);
      return;
    }

    runParsedSearch({
      ...retry.form,
      locationA: form.locationA,
      locationAPlaceId: form.locationAPlaceId,
      locationACoordinates: form.locationACoordinates,
      locationB: form.locationB,
      locationBPlaceId: form.locationBPlaceId,
      locationBCoordinates: form.locationBCoordinates,
      searchMode: form.searchMode ?? retry.form.searchMode
    });
  }

  function submitClassicSearch() {
    submitSearch();
  }

  function clearRecent() {
    clearRecentMeetups();
    setRecentMeetups([]);
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

  return (
    <main className="min-h-screen overflow-x-hidden bg-mint text-ink">
      <SiteHeader />

      {!hasSearched && !results && !watchEventsResult && !loading ? (
        <>
          <section id="search" className="relative isolate overflow-x-clip bg-ink px-4 pb-10 pt-4 sm:px-6 sm:pb-12 sm:pt-5 lg:px-8 lg:pb-14">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-15%,rgba(255,90,0,0.14),transparent_58%),radial-gradient(circle_at_88%_8%,rgba(10,132,255,0.08),transparent_32%),linear-gradient(180deg,#0A1323_0%,#0c1729_50%,#0A1323_100%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0A1323] via-[#0A1323]/70 to-transparent sm:h-28" />
            <div className="relative z-10 mx-auto grid w-full max-w-5xl gap-5 py-5 sm:gap-6 sm:py-7 lg:gap-7 lg:py-8">
              <MarketingHero />
              <FairMeetupPreview />
              <SearchPromptAssist
                form={form}
                busy={loading || locating || resolvingManual}
                onPickQuery={fillSuggestedQuery}
                onExpandBuilder={(mode) => expandBuilder(mode ?? "halfway")}
              />
              <AiSearchBox
                ref={searchBoxRef}
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
                onParsed={runParsedSearch}
                onWatchSearch={runWatchSearch}
                onEventsSearch={runEventsSearch}
                onNeedsFullFallback={() => openFullFallback()}
                onNeedsLocation={handleNeedsLocation}
                onPersistUserAddress={persistUserAddress}
                onUseLocation={() => void requestUserLocation()}
                onShowZipFallback={showZipFallback}
                onSubmitManualLocation={(input) => void resolveManualLocation(input)}
              />
              <PersistentLocationBar
                label={activeLocationLabel}
                busy={loading || locating || resolvingManual}
                onChange={openLocationChange}
              />
              <ClassicSearchControls
                form={form}
                loading={loading}
                savedLocationLabel={activeLocationLabel}
                expanded={builderExpanded}
                onExpandedChange={setBuilderExpanded}
                mode={builderMode}
                onModeChange={setBuilderMode}
                onChange={handleFormChange}
                onSearchPlaces={runParsedSearch}
                onSearchWatch={runWatchSearch}
              />
              <RecentSearchesSection meetups={recentMeetups} onSelect={rerunRecentMeetup} onClear={clearRecent} />
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
                hidden={!showClassicFallback || fallbackKind !== "full"}
              />
            </div>
          </section>
        </>
      ) : null}

      <div className="bg-mint px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {hasSearched || results || watchEventsResult || loading ? (
            <CompactResultsHeader
              loading={loading}
              searchKind={searchKind}
              locationLabel={activeLocationLabel}
              loadingLabel={
                searchKind === "watch"
                  ? "Finding streaming picks"
                  : searchKind === "events"
                    ? "Finding local events"
                    : loadingPhaseLabel
              }
              resultCountLabel={resultCountLabel}
              title={watchEventsResult ? watchEventsResult.title : "Koi's pick"}
              originSummary={
                watchEventsResult
                  ? watchEventsResult.contextSummary
                  : results
                  ? results.searchMode === "single"
                    ? `Near ${results.originA.formattedAddress}`
                    : `${results.originA.formattedAddress} → ${results.originB.formattedAddress}`
                  : ""
              }
              canShareOptions={Boolean(results?.venues.length)}
              onShareOptions={shareMeetup}
              onNewSearch={startNewSearch}
            />
          ) : null}

          {hasSearched || results || watchEventsResult || loading || showRoadDividerPreview ? (
            <RoadDivider className="mt-5 w-full" />
          ) : null}

          {error ? (
            <div
              className={`mt-5 rounded-lg border p-4 text-sm font-semibold ${activeAccent.borderMuted} ${activeAccent.bgMuted} ${activeAccent.text}`}
            >
              {error}
            </div>
          ) : null}

          {error && !loading && !results && !watchEventsResult ? (
          <section id="search" className="mt-5 grid w-full max-w-5xl gap-5">
              <SearchPromptAssist
                form={form}
                busy={loading || locating || resolvingManual}
                onPickQuery={fillSuggestedQuery}
                onExpandBuilder={(mode) => expandBuilder(mode ?? "halfway")}
              />
              <AiSearchBox
                ref={searchBoxRef}
                surface="page"
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
                onParsed={runParsedSearch}
                onWatchSearch={runWatchSearch}
                onEventsSearch={runEventsSearch}
                onNeedsFullFallback={() => openFullFallback()}
                onNeedsLocation={handleNeedsLocation}
                onPersistUserAddress={persistUserAddress}
                onUseLocation={() => void requestUserLocation()}
                onShowZipFallback={showZipFallback}
                onSubmitManualLocation={(input) => void resolveManualLocation(input)}
              />
              <PersistentLocationBar
                label={activeLocationLabel}
                busy={loading || locating || resolvingManual}
                onChange={openLocationChange}
              />
              <ClassicSearchControls
                form={form}
                loading={loading}
                savedLocationLabel={activeLocationLabel}
                expanded={builderExpanded}
                onExpandedChange={setBuilderExpanded}
                mode={builderMode}
                onModeChange={setBuilderMode}
                onChange={handleFormChange}
                onSearchPlaces={runParsedSearch}
                onSearchWatch={runWatchSearch}
              />
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
                hidden={!showClassicFallback || fallbackKind !== "full"}
              />
              <RecentSearchesSection meetups={recentMeetups} onSelect={rerunRecentMeetup} onClear={clearRecent} />
            </section>
          ) : null}

        {loading ? (
          <section className="mt-8">
            <KoiThinkingLoader searchKind={searchKind} phase={loadingPhase} />
          </section>
        ) : null}

        {watchEventsResult && !loading ? (
          <WatchEventsResults result={watchEventsResult} />
        ) : null}

        {results && !loading ? (
          <section className="search-results-enter mt-5 grid gap-5 pb-16 lg:grid-cols-[1fr_420px] lg:items-start">
            {results.venues.length ? (
              <div className="results-panel-enter order-1 lg:order-2">
                <ResultsMap
                  originA={results.originA}
                  originB={results.originB}
                  midpoint={results.midpoint}
                  venues={results.venues}
                  searchMode={results.searchMode}
                />
              </div>
            ) : null}

            <div className="results-panel-enter order-2 grid gap-5 lg:order-1">
              {openedFromSharedHalfway && results.searchMode === "midpoint" ? (
                <SharedHalfwayReferralBanner onStartSearch={startNewSearch} />
              ) : null}

              {shareMessage ? (
                <p className={`mb-4 text-sm font-semibold ${activeAccent.text}`}>{shareMessage}</p>
              ) : null}

              <WeatherCard midpoint={results.midpoint} searchMode={results.searchMode} />

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

function RecentSearchesSection({
  meetups,
  onSelect,
  onClear
}: {
  meetups: RecentMeetup[];
  onSelect: (meetup: RecentMeetup) => void;
  onClear: () => void;
}) {
  if (!meetups.length) return null;

  return (
    <section className="w-full min-w-0">
      <div className="flex min-w-0 items-start justify-between gap-3 sm:items-center sm:gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-white/45">Recent Searches</h2>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 rounded-lg border border-white/15 bg-white/[0.03] px-3 py-2 text-sm font-bold text-white/75 transition hover:border-white/22 hover:bg-white/[0.05] hover:text-white"
        >
          Clear
        </button>
      </div>
      <div className="mt-4 grid min-w-0 grid-cols-1 gap-3">
        {meetups.slice(0, 2).map((meetup) => {
          const card = getRecentMeetupCardDisplay(meetup);
          const isHalfway = meetup.searchMode !== "single";
          return (
            <KoiExampleSearchCard
              key={meetup.id}
              icon={card.icon}
              title={card.title}
              subtitle={card.subtitle}
              accent="places"
              featured={isHalfway}
              onClick={() => onSelect(meetup)}
            />
          );
        })}
      </div>
    </section>
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
