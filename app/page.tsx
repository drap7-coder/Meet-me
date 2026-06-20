"use client";

import { EmptyState } from "@/app/components/EmptyState";
import { AiSearchBox } from "@/app/components/AiSearchBox";
import { CategoryIcon } from "@/app/components/CategoryIcon";
import { LocationForm } from "@/app/components/LocationForm";
import { Logo } from "@/app/components/Logo";
import { RoadDivider } from "@/app/components/BrandRoad";
import { ResultsMap } from "@/app/components/ResultsMap";
import { VenueCard } from "@/app/components/VenueCard";
import { WatchEventsResults } from "@/app/components/WatchEventsResults";
import { WeatherCard } from "@/app/components/WeatherCard";
import {
  clearRecentMeetups,
  createRecentMeetup,
  formatRecentMeetupDate,
  getRecentMeetupCategoryLabel,
  getRecentMeetups,
  recentMeetupToForm,
  saveRecentMeetup,
  type RecentMeetup
} from "@/lib/recentMeetups";
import { normalizeCategory, parseMeetupMode, parseSearchMode } from "@/lib/categories";
import { getPreferenceLabel, parsePreferences } from "@/lib/preferences";
import { copyTextToClipboard, shareWithFallback, shouldUseNativeShare } from "@/lib/share";
import { trackEvent } from "@/lib/analytics";
import { DEFAULT_WATCH_SUBCATEGORY } from "@/lib/watchBrowse";
import {
  looksLikeCurrentLocationQuery,
  needsCurrentLocationResolution,
  resolveCurrentLocationInForm
} from "@/lib/currentLocation";
import { getCurrentPosition, reverseGeocodeCoordinates } from "@/lib/geolocation";
import type { KoiBotMode, LatLng, ScoredVenue, SearchHalfwayRequest, SearchHalfwayResponse, VenueCategory, WatchEventsApiResponse, WatchEventsMoreResult, WatchEventsResult, WatchSubcategory } from "@/lib/types";
import { BRAND } from "@/src/config/branding";
import { useEffect, useMemo, useState } from "react";

const initialForm: SearchHalfwayRequest = {
  locationA: "",
  locationB: "",
  category: "coffee",
  searchMode: "midpoint",
  meetupMode: "single",
  customQuery: ""
};

type ShareDialogState = {
  title: string;
  url: string;
  subject: string;
  body: string;
};

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
  const [locationStatus, setLocationStatus] = useState("");
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMoreWatchEvents, setLoadingMoreWatchEvents] = useState(false);
  const [error, setError] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [currentShareUrl, setCurrentShareUrl] = useState("");
  const [shareDialog, setShareDialog] = useState<ShareDialogState | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentMeetups, setRecentMeetups] = useState<RecentMeetup[]>([]);
  const [showRoadDividerPreview, setShowRoadDividerPreview] = useState(false);

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
      if (shareId) {
        const shareUrl = `${window.location.origin}/s/${shareId}`;
        setCurrentShareUrl(shareUrl);
        trackEvent("share_link_opened", {
          category,
          hasPreferences: preferences.length > 0
        });
      }
      if (shouldAutoSearch && locationA && (searchMode === "single" || locationB)) {
        submitSearch(nextForm, shareId ? `${window.location.origin}/s/${shareId}` : undefined);
      }
    }
  }, []);

  useEffect(() => {
    setRecentMeetups(getRecentMeetups());
  }, []);

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

  async function requestUserLocation(retry?: PendingRetry | null) {
    if (typeof window === "undefined" || !window.navigator?.geolocation) {
      setError("Location is not available in this browser.");
      if (retry ?? pendingRetry) {
        openLocationFallback(
          retry ?? pendingRetry!,
          "Add where you are to continue."
        );
      }
      return;
    }

    setLocating(true);
    setLocationStatus("Checking your location...");
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
      setForm(nextForm);
      setLocationStatus(`Using your location: ${shortLocationLabel(resolved.locationA)}`);

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
    } catch {
      setLocationStatus("");
      setError("Couldn’t access your location. Type a city or address below.");
      if (retry ?? pendingRetry) {
        openLocationFallback(
          retry ?? pendingRetry!,
          "Couldn’t access your location. Add where you are to continue."
        );
      }
    } finally {
      setLocating(false);
    }
  }

  const resultCountLabel = useMemo(() => {
    if (watchEventsResult) {
      const label = watchEventsResult.preview ? "preview option" : "streaming pick";
      return `${watchEventsResult.resultCount} ${label}${watchEventsResult.resultCount === 1 ? "" : "s"}`;
    }
    if (!results) return "";
    return `${results.venues.length} place${results.venues.length === 1 ? "" : "s"} that could work`;
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

  function startNewSearch() {
    setResults(null);
    setWatchEventsResult(null);
    setSearchKind(null);
    setError("");
    setShareMessage("");
    setCurrentShareUrl("");
    setHasSearched(false);
    setShowClassicFallback(false);
    setFallbackKind("none");
    setPendingRetry(null);
    window.history.replaceState(null, "", "/");
    window.requestAnimationFrame(() => document.getElementById("search")?.scrollIntoView({ behavior: "smooth" }));
  }

  function rerunRecentMeetup(meetup: RecentMeetup) {
    const nextForm = recentMeetupToForm(meetup);
    setForm(nextForm);
    submitSearch(nextForm);
  }

  function runParsedSearch(nextForm: SearchHalfwayRequest) {
    setWatchEventsResult(null);
    const resolvedForm = resolveCurrentLocationInForm(nextForm, form);
    if (needsCurrentLocationResolution(resolvedForm)) {
      setPendingRetry({ kind: "places", form: resolvedForm });
      void requestUserLocation({ kind: "places", form: resolvedForm });
      return;
    }
    setShowClassicFallback(false);
    setFallbackKind("none");
    setPendingRetry(null);
    setForm(resolvedForm);
    submitSearch(resolvedForm);
  }

  function handleNeedsLocation(pendingForm: SearchHalfwayRequest) {
    setPendingRetry({ kind: "places", form: pendingForm });
    void requestUserLocation({ kind: "places", form: pendingForm });
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
    let eventLocationContext = resolveCurrentLocationInForm(locationContext ?? form, form);
    if (looksLikeCurrentLocationQuery(query) && needsCurrentLocationResolution({ ...eventLocationContext, locationA: "me", searchMode: "single" })) {
      setPendingRetry({ kind: "events", query });
      await requestUserLocation({ kind: "events", query });
      return;
    }
    if (!eventLocationContext.locationA.trim() || needsCurrentLocationResolution(eventLocationContext)) {
      setSearchKind("events");
      setHasSearched(true);
      setResults(null);
      setWatchEventsResult(null);
      openLocationFallback({ kind: "events", query }, "Add your location to discover nearby events.");
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
      if (!response.ok) throw new Error(data.error ?? "Events search failed.");

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
        openLocationFallback({ kind: "events", query }, "Add your location to discover nearby events.");
        throw new Error("Add your location to discover nearby events.");
      }
      setShowClassicFallback(false);
      setFallbackKind("none");
      setPendingRetry(null);
      setWatchEventsResult(result);
      trackEvent("watch_events_completed", {
        intent: result.intent,
        resultCount: result.resultCount
      });
    } catch (searchError) {
      setWatchEventsResult(null);
      setError(searchError instanceof Error ? searchError.message : "Events search failed.");
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

  function submitLocationFallback() {
    if (!form.locationA.trim()) {
      setError("Add where you are, or tap Use my location.");
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

  async function loadMoreWatchEvents() {
    if (!watchEventsResult?.hasMore || loadingMoreWatchEvents) return;

    const excludeKeys = watchEventsResult.recommendations
      .filter((item) => typeof item.tmdbId === "number")
      .map((item) => `${item.mediaType ?? "movie"}:${item.tmdbId}`);

    setLoadingMoreWatchEvents(true);
    setError("");
    try {
      const endpoint = searchKind === "watch" ? "/api/watch-search" : "/api/watch-events";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: watchEventsResult.query,
          excludeKeys,
          ...(searchKind === "watch" ? { subcategory: activeWatchSubcategory } : {})
        })
      });
      const data = (await response.json()) as WatchEventsMoreResult & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not load more picks.");

      setWatchEventsResult((current) => {
        if (!current || data.append !== true) return current;
        const recommendations = [...current.recommendations, ...data.recommendations].map((item, index) => ({
          ...item,
          rank: index + 1
        }));
        return {
          ...current,
          recommendations,
          hasMore: data.hasMore,
          resultCount: recommendations.length
        };
      });
    } catch (loadMoreError) {
      setError(loadMoreError instanceof Error ? loadMoreError.message : "Could not load more picks.");
    } finally {
      setLoadingMoreWatchEvents(false);
    }
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
    const text = buildSingleVenueEmailBody(venue, url);
    if (!shouldUseNativeShare()) {
      setShareDialog({
        title: "Share this meetup",
        url,
        subject: "Let’s meet here",
        body: text
      });
      return;
    }

    const result = await shareWithFallback({ title: BRAND.name, text, url });
    if (result === "shared") setShareMessage("");
    if (result === "copied") setShareMessage("Spot copied to clipboard.");
    if (result === "email") setShareMessage("Email draft opened.");
    if (result === "cancelled") setShareMessage("Sharing was cancelled.");
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
          : `Here are places that could work between ${shortLocationLabel(results.originA.formattedAddress)} and ${shortLocationLabel(results.originB.formattedAddress)}.`;
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
          <section id="search" className="relative isolate overflow-hidden bg-ink px-4 pb-8 pt-4 sm:px-6 sm:pt-6 lg:px-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(214,90,46,0.24),transparent_28%),radial-gradient(circle_at_72%_8%,rgba(242,239,231,0.10),transparent_24%)]" />
            <div className="relative z-10 mx-auto grid w-full max-w-5xl gap-6 py-8 lg:py-12">
              <MarketingHero />
              <AiSearchBox
                loading={loading}
                locationStatus={locationStatus}
                locationContext={{
                  locationA: form.locationA,
                  locationAPlaceId: form.locationAPlaceId,
                  locationACoordinates: form.locationACoordinates
                }}
                locating={locating}
                onParsed={runParsedSearch}
                onWatchSearch={runWatchSearch}
                onEventsSearch={runEventsSearch}
                onNeedsFullFallback={() => openFullFallback()}
                onNeedsLocation={handleNeedsLocation}
                onUseLocation={() => void requestUserLocation()}
              />
              <LocationFallbackPanel
                form={form}
                loading={loading}
                pendingQuery={pendingRetry?.kind === "events" ? pendingRetry.query : undefined}
                hidden={!showClassicFallback || fallbackKind !== "location"}
                onChange={setForm}
                onSubmit={submitLocationFallback}
              />
              <ClassicSearchPanel
                form={form}
                loading={loading}
                discoveryMode="places"
                onChange={setForm}
                onSubmit={submitClassicSearch}
                hidden={!showClassicFallback || fallbackKind !== "full"}
              />
            </div>
          </section>
          <section className="bg-mint px-4 pb-10 pt-5 sm:px-6 lg:px-8">
            <div className="mx-auto grid w-full max-w-5xl gap-5">
              <RecentMeetupsSection meetups={recentMeetups} onSelect={rerunRecentMeetup} onClear={clearRecent} />
            </div>
          </section>
        </>
      ) : null}

      <div className="bg-mint px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {hasSearched || results || watchEventsResult || loading ? (
            <CompactResultsHeader
              loading={loading}
              loadingLabel={
                searchKind === "watch"
                  ? "Finding streaming picks"
                  : searchKind === "events"
                    ? "Finding local events"
                    : "Finding places"
              }
              resultCountLabel={resultCountLabel}
              title={watchEventsResult ? watchEventsResult.title : "Recommended places"}
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
            <div className="mt-5 rounded-lg border border-[#FFD2D2] bg-[#FFF1F1] p-4 text-sm font-semibold text-clay">
              {error}
            </div>
          ) : null}

          {error && !loading && !results && !watchEventsResult ? (
          <section id="search" className="mt-5 grid w-full max-w-5xl gap-5">
              <AiSearchBox
                loading={loading}
                locationStatus={locationStatus}
                locationContext={{
                  locationA: form.locationA,
                  locationAPlaceId: form.locationAPlaceId,
                  locationACoordinates: form.locationACoordinates
                }}
                locating={locating}
                onParsed={runParsedSearch}
                onWatchSearch={runWatchSearch}
                onEventsSearch={runEventsSearch}
                onNeedsFullFallback={() => openFullFallback()}
                onNeedsLocation={handleNeedsLocation}
                onUseLocation={() => void requestUserLocation()}
              />
              <LocationFallbackPanel
                form={form}
                loading={loading}
                pendingQuery={pendingRetry?.kind === "events" ? pendingRetry.query : undefined}
                hidden={!showClassicFallback || fallbackKind !== "location"}
                onChange={setForm}
                onSubmit={submitLocationFallback}
              />
              <ClassicSearchPanel
                form={form}
                loading={loading}
                discoveryMode="places"
                onChange={setForm}
                onSubmit={submitClassicSearch}
                hidden={!showClassicFallback || fallbackKind !== "full"}
              />
              <RecentMeetupsSection meetups={recentMeetups} onSelect={rerunRecentMeetup} onClear={clearRecent} />
            </section>
          ) : null}

        {loading ? (
          <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_420px]">
            <div className="grid gap-3">
              {searchKind === "watch" || searchKind === "events" ? <WatchEventsLoader /> : <MeetInMiddleLoader />}
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-48 animate-pulse rounded-lg bg-sky shadow-soft" />
              ))}
            </div>
            <div className="h-[420px] animate-pulse rounded-lg bg-sky shadow-soft" />
          </section>
        ) : null}

        {watchEventsResult && !loading ? (
          <WatchEventsResults
            result={watchEventsResult}
            loadingMore={loadingMoreWatchEvents}
            onLoadMore={watchEventsResult.hasMore ? loadMoreWatchEvents : undefined}
          />
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
              {shareMessage ? <p className="mb-4 text-sm font-semibold text-clay">{shareMessage}</p> : null}

              <WeatherCard midpoint={results.midpoint} searchMode={results.searchMode} />

              {results.venues.length ? (
                <div className="results-list-enter grid gap-4">
                  {results.venues.map((venue, index) => (
                    <VenueCard
                      key={venue.id}
                      venue={venue}
                      rank={index + 1}
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
              ) : (
                <EmptyState />
              )}
            </div>
          </section>
        ) : null}
        </div>
      </div>

      <FeedbackSection />
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

function MarketingHero() {
  return (
      <div className="max-w-4xl">
        <div className="flex items-center gap-4 sm:gap-6">
          <h1 className="min-w-0 flex-1 text-[2.4rem] font-black leading-[0.96] tracking-[-0.04em] text-[#FFFDF8] sm:text-[clamp(48px,8vw,72px)]">
            {BRAND.heroHeadline}
          </h1>
          <div className="shrink-0 rounded-[20px] border border-white/10 bg-paper/95 p-2 shadow-[0_16px_40px_rgba(10,19,35,0.22)] sm:p-3">
            <Logo size="lg" />
          </div>
        </div>
        <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-[#D7D0C4] sm:mt-6 sm:text-xl sm:leading-8">
          {BRAND.heroSubheadline}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:gap-4">
          <a
            href="#ask-koi"
            className="inline-flex h-12 items-center justify-center rounded-full bg-clay px-7 text-base font-bold text-white shadow-glow transition hover:bg-[#B94A22] focus:outline-none focus:ring-4 focus:ring-clay/25"
          >
            {BRAND.askLabel}
          </a>
        </div>
      </div>
  );
}

function CompactResultsHeader({
  loading,
  loadingLabel = "Finding places",
  resultCountLabel,
  title,
  originSummary,
  canShareOptions,
  onShareOptions,
  onNewSearch
}: {
  loading: boolean;
  loadingLabel?: string;
  resultCountLabel: string;
  title: string;
  originSummary: string;
  canShareOptions: boolean;
  onShareOptions: () => void;
  onNewSearch: () => void;
}) {
  return (
    <section className="pt-[max(72px,calc(env(safe-area-inset-top)+64px))]">
      <div className="rounded-lg border border-line bg-paper p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-clay">{BRAND.name}</p>
            <p className="mt-2 text-sm font-bold uppercase tracking-wide text-clay">
              {loading ? loadingLabel : resultCountLabel || "Results"}
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-ink sm:text-4xl">{title}</h1>
            {originSummary ? <p className="mt-2 text-sm leading-6 text-slate">{originSummary}</p> : null}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {canShareOptions ? (
              <button
                type="button"
                onClick={onShareOptions}
                className="inline-flex h-10 items-center justify-center rounded-full bg-clay px-4 text-sm font-bold text-white transition hover:bg-[#B94A22] focus:outline-none focus:ring-4 focus:ring-clay/25"
              >
                Share this meetup
              </button>
            ) : null}
            <button
              type="button"
              onClick={onNewSearch}
              className="inline-flex h-10 items-center justify-center rounded-full border border-line bg-paper px-4 text-sm font-bold text-ink transition hover:border-clay hover:text-clay focus:outline-none focus:ring-4 focus:ring-ink/10"
            >
              New search
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ShareDialog({
  dialog,
  onCopied,
  onClose
}: {
  dialog: ShareDialogState;
  onCopied: () => void;
  onClose: () => void;
}) {
  const [status, setStatus] = useState("");
  const mailto = `mailto:?subject=${encodeURIComponent(dialog.subject)}&body=${encodeURIComponent(dialog.body)}`;

  async function copyLink() {
    const copied = await copyTextToClipboard(dialog.url);
    setStatus(copied ? "Link copied" : "Copy failed. Try Email Results instead.");
    if (copied) onCopied();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/30 p-3 sm:place-items-center" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-[24px] border border-line bg-white p-5 shadow-[0_24px_80px_rgba(17,24,39,0.24)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-clay">Share</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-ink">{dialog.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line px-3 py-1.5 text-sm font-bold text-slate transition hover:border-clay hover:text-clay"
          >
            Close
          </button>
        </div>
        <div className="mt-5 grid gap-2">
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex h-11 items-center justify-center rounded-full bg-clay px-4 text-sm font-bold text-white transition hover:bg-[#B94A22] focus:outline-none focus:ring-4 focus:ring-clay/25"
          >
            Copy Link
          </button>
          <a
            href={mailto}
            onClick={() => setStatus("Email draft opened.")}
            className="inline-flex h-11 items-center justify-center rounded-full border border-line bg-paper px-4 text-sm font-bold text-ink transition hover:border-clay hover:text-clay focus:outline-none focus:ring-4 focus:ring-ink/10"
          >
            Email Results
          </a>
        </div>
        {status ? <p className="mt-3 text-center text-xs font-semibold text-slate">{status}</p> : null}
      </div>
    </div>
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
        discoveryMode="events"
        variant="location-only"
        submitLabel={pendingQuery ? "Find events" : "Search nearby"}
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

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/95 pt-[env(safe-area-inset-top)] shadow-[0_10px_28px_rgba(10,19,35,0.08)] backdrop-blur">
      <div className="mx-auto flex h-[64px] w-full max-w-7xl items-center justify-between gap-2 px-3 sm:h-[72px] sm:gap-4 sm:px-6 lg:px-8">
        <a href="/" className="group inline-flex min-w-0 flex-1 items-center gap-2 sm:gap-3" aria-label={`${BRAND.displayName} home`}>
          <Logo variant="lockup" size="md" showEyebrow className="transition group-hover:opacity-90" />
        </a>
        <a
          href="#ask-koi"
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-clay px-3 text-xs font-black text-white shadow-[0_10px_24px_rgba(214,90,46,0.28)] transition hover:bg-[#B94A22] focus:outline-none focus:ring-4 focus:ring-clay/25 sm:h-11 sm:px-6 sm:text-sm"
        >
          {BRAND.askLabel}
        </a>
      </div>
    </header>
  );
}

function WatchEventsLoader() {
  return (
    <div
      className="rounded-[24px] border border-line bg-paper p-5 shadow-[0_14px_38px_rgba(18,50,74,0.08)] sm:p-6"
      role="status"
      aria-live="polite"
      aria-label="Finding watch and event options"
    >
      <div className="mx-auto grid max-w-md gap-3">
        <div className="grid grid-cols-3 gap-2">
          {["Movies", "Sports", "Live"].map((label) => (
            <div key={label} className="rounded-lg bg-sky px-3 py-4 text-center text-xs font-black uppercase tracking-[0.12em] text-slate">
              {label}
            </div>
          ))}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-sky">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-clay/70" />
        </div>
      </div>
      <div className="mt-4 text-center">
        <p className="text-sm font-black text-ink">Finding watch & event options</p>
        <p className="mt-1 text-xs font-semibold text-slate">Matching your ask to movies, sports, and live plans.</p>
      </div>
    </div>
  );
}

function MeetInMiddleLoader() {
  return (
    <div
      className="meet-middle-motion rounded-[24px] border border-line bg-paper p-5 shadow-[0_14px_38px_rgba(18,50,74,0.08)] sm:p-6"
      role="status"
      aria-live="polite"
      aria-label="Finding a fair midpoint"
    >
      <div className="relative mx-auto h-20 max-w-md overflow-hidden rounded-full bg-sky/80 px-8">
        <div className="absolute left-8 right-8 top-1/2 h-px -translate-y-1/2 bg-line" />
        <div className="meet-middle-dot meet-middle-dot-left absolute left-8 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[#2D3E57] shadow-[0_0_0_8px_rgba(45,62,87,0.12)]" />
        <div className="meet-middle-dot meet-middle-dot-right absolute right-8 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-ink shadow-[0_0_0_8px_rgba(18,50,74,0.10)]" />
        <div className="meet-middle-pin absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-clay text-white shadow-[0_12px_28px_rgba(255,107,95,0.28)] ring-8 ring-clay/10">
          <span className="h-3 w-3 rounded-full bg-white" />
        </div>
      </div>
      <div className="mt-4 text-center">
        <p className="text-sm font-black text-ink">Finding the midpoint</p>
        <p className="mt-1 text-xs font-semibold text-slate">Balancing drive times and local options.</p>
      </div>
    </div>
  );
}

function FeedbackSection() {
  const feedbackHref = `mailto:nathandrapkin@gmail.com?subject=${encodeURIComponent(
    `${BRAND.name} feedback`
  )}&body=${encodeURIComponent("What worked:\n\nWhat felt confusing:\n\nWhat I'd like you to add:\n")}`;

  return (
    <section className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-lg border border-line bg-paper p-6 shadow-soft sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-clay">Beta feedback</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-ink sm:text-4xl">
              Help shape {BRAND.name}.
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate">
              We're actively building this product and would love your feedback.
            </p>
            <div className="mt-5 grid gap-2 text-sm font-semibold text-slate sm:grid-cols-3">
              <span className="rounded-lg border border-line bg-sky px-3 py-2">What worked</span>
              <span className="rounded-lg border border-line bg-sky px-3 py-2">What felt confusing</span>
              <span className="rounded-lg border border-line bg-sky px-3 py-2">What you'd like us to add</span>
            </div>
          </div>
          <a
            href={feedbackHref}
            className="inline-flex h-11 items-center justify-center rounded-full bg-clay px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(214,90,46,0.24)] transition hover:bg-[#B94A22] focus:outline-none focus:ring-4 focus:ring-clay/25"
          >
            Send Feedback
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const feedbackHref = `mailto:nathandrapkin@gmail.com?subject=${encodeURIComponent(
    `${BRAND.name} feedback`
  )}&body=${encodeURIComponent("Questions, ideas, or feedback:\n")}`;

  return (
    <footer className="border-t border-line px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 text-sm text-slate sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Logo variant="lockup" size="sm" />
          <p className="mt-3 font-semibold">Currently in Beta</p>
          <p className="mt-3 max-w-sm leading-6">{BRAND.footerDescription}</p>
        </div>
        <div className="sm:text-right">
          <p className="leading-6">Questions, ideas, or feedback?</p>
          <p className="leading-6">We'd love to hear from you.</p>
          <a href={feedbackHref} className="mt-3 inline-flex font-bold text-clay hover:text-[#B94A22]">
            Send Feedback -&gt;
          </a>
        </div>
      </div>
    </footer>
  );
}

function RecentMeetupsSection({
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
    <section className="w-full min-w-0 overflow-hidden rounded-lg border border-line bg-paper p-4 shadow-soft sm:p-6">
      <div className="flex min-w-0 items-start justify-between gap-3 sm:items-center sm:gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold uppercase tracking-wide text-clay">Recent Meetups</p>
          <h2 className="mt-1 truncate text-xl font-black tracking-tight text-ink sm:text-2xl">Pick up where you left off.</h2>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 rounded-lg border border-line bg-mint px-3 py-2 text-sm font-bold text-slate transition hover:border-clay hover:text-clay"
        >
          Clear
        </button>
      </div>
      <div className="mt-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        {meetups.slice(0, 5).map((meetup) => (
          <button
            key={meetup.id}
            type="button"
            onClick={() => onSelect(meetup)}
            className="w-full min-w-0 overflow-hidden rounded-lg border border-line bg-mint p-4 text-left shadow-[0_8px_22px_rgba(17,24,39,0.04)] transition hover:border-clay hover:bg-white hover:shadow-soft"
          >
            <div className="flex min-w-0 items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sky" aria-hidden="true">
                <CategoryIcon category={meetup.category} className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-black text-ink">
                  {meetup.searchMode === "single"
                    ? `Near ${shortLocationLabel(meetup.originA)}`
                    : `${shortLocationLabel(meetup.originA)} ↔ ${shortLocationLabel(meetup.originB)}`}
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-slate">
                  {getRecentMeetupCategoryLabel(meetup)} · {(meetup.meetupMode ?? "single") === "district" ? "District" : "Single place"} · {formatRecentMeetupDate(meetup.timestamp)}
                </p>
                {meetup.preferences?.length ? (
                  <p className="mt-1 truncate text-xs font-semibold text-clay">
                    {meetup.preferences.map(getPreferenceLabel).join(" + ")}
                  </p>
                ) : null}
                <p className="mt-2 text-xs font-semibold text-slate">Tap to meet here again</p>
              </div>
            </div>
          </button>
        ))}
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

function buildSingleVenueEmailBody(venue: ScoredVenue, currentUrl: string) {
  return [
    "Koi found a meetup option:",
    "",
    venue.name,
    venue.address,
    "",
    "Drive times:",
    `Me: ${formatMinutes(venue.travelFromA.durationMinutes)}`,
    `You: ${formatMinutes(venue.travelFromB.durationMinutes)}`,
    "",
    "View details:",
    currentUrl
  ].join("\n");
}

function buildMeetupEmailBody(results: SearchHalfwayResponse, currentUrl: string) {
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

function shortLocationLabel(address: string) {
  return address.split(",")[0]?.trim() || "Person";
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
