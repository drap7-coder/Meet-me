"use client";

import type { SearchHalfwayRequest, WatchSubcategory } from "@/lib/types";
import type { CurrentLocationContext } from "@/lib/currentLocation";
import type { LocationUiState } from "@/lib/locationInput";
import { trackEvent } from "@/lib/analytics";
import { buildHalfwaySearchQuery } from "@/lib/halfwayBrowse";
import { KOI_EXAMPLE } from "@/lib/koiExamples";
import { DEFAULT_WATCH_SUBCATEGORY, EVENTS_PLACEHOLDER } from "@/lib/watchBrowse";
import { LOCAL_HAPPENINGS_OPTIONS } from "@/lib/localHappenings";
import { SPOT_OPTIONS, type SpotOptionAccent } from "@/lib/spotBrowse";
import { recordTrendingSearch } from "@/lib/trendingSearches";
import { BRAND } from "@/src/config/branding";
import { SavedLocationBadge } from "@/app/components/SavedLocationBadge";
import { FormEvent, forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

type Props = {
  loading: boolean;
  locationStatus?: string;
  locationLabel?: string;
  locationUiState?: LocationUiState;
  showManualFallback?: boolean;
  manualLocationError?: string;
  locationContext?: CurrentLocationContext;
  defaultUserAddress?: string;
  onParsed: (form: SearchHalfwayRequest) => void;
  onWatchSearch: (query: string, subcategory: WatchSubcategory) => void;
  onEventsSearch: (query: string) => void;
  onNeedsFullFallback: () => void;
  onNeedsLocation: (form: SearchHalfwayRequest) => void;
  onPersistUserAddress?: (address: string) => void;
  onUseLocation: () => void;
  onShowZipFallback: () => void;
  onSubmitManualLocation: (input: string) => void;
  showLocationActions?: boolean;
  locating?: boolean;
  resolvingManual?: boolean;
  surface?: "hero" | "page";
};

type ParseSearchResult = {
  botMode?: "places" | "watch" | "events";
  form?: SearchHalfwayRequest;
  error?: string;
  needsLocation?: boolean;
};

export type AiSearchBoxHandle = {
  runQuery: (query: string, watchSubcategory?: WatchSubcategory) => void;
  fillQuery: (query: string, watchSubcategory?: WatchSubcategory) => void;
  fillHalfwayIntent: (lookingFor: string, exampleQuery?: string) => void;
  fillEventsQuery: (query: string) => void;
  fillSpotQuery: (query?: string) => void;
  setGuidedMode: (mode: GuidedSearchMode) => void;
};

type GuidedSearchMode = null | "spot" | "halfway" | "events";

function AiSparkleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0 text-koi"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" opacity="0.35" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

export const AiSearchBox = forwardRef<AiSearchBoxHandle, Props>(function AiSearchBox(
  {
    loading,
    locationStatus,
    locationLabel = "",
    locationUiState = "idle",
    showManualFallback = false,
    manualLocationError,
    locationContext,
    defaultUserAddress = "",
    onParsed,
    onWatchSearch,
    onEventsSearch,
    onNeedsFullFallback,
    onNeedsLocation,
    onPersistUserAddress,
    onUseLocation,
    onShowZipFallback,
    onSubmitManualLocation,
    showLocationActions = false,
    locating = false,
    resolvingManual = false,
    surface = "hero"
  },
  ref
) {
  const [query, setQuery] = useState("");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");
  const [manualLocationInput, setManualLocationInput] = useState("");
  const [watchActiveSubcategory, setWatchActiveSubcategory] = useState<WatchSubcategory>(DEFAULT_WATCH_SUBCATEGORY);
  const [guidedMode, setGuidedMode] = useState<GuidedSearchMode>(null);
  const [locationA, setLocationA] = useState("");
  const [locationB, setLocationB] = useState("");
  const [halfwayLookingFor, setHalfwayLookingFor] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const address = defaultUserAddress.trim() || locationContext?.locationA?.trim() || "";
    if (!address) return;
    setLocationA((current) => (current.trim() ? current : address));
  }, [defaultUserAddress, locationContext?.locationA, locationContext?.locationAPlaceId, locationContext?.locationACoordinates]);

  const scrollToSearch = useCallback(() => {
    window.requestAnimationFrame(() => {
      containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, []);

  const fillQuery = useCallback((searchQuery: string, watchSubcategory?: WatchSubcategory) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    if (watchSubcategory) setWatchActiveSubcategory(watchSubcategory);
    setGuidedMode(null);
    setQuery(trimmed);
    setError("");
    scrollToSearch();
    window.requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
      const length = trimmed.length;
      inputRef.current?.setSelectionRange(length, length);
    });
  }, [scrollToSearch]);

  const fillHalfwayIntent = useCallback((lookingFor: string, exampleQuery?: string) => {
    setGuidedMode("halfway");
    setHalfwayLookingFor(lookingFor);
    if (exampleQuery) setQuery(exampleQuery);
    setError("");
    scrollToSearch();
  }, [scrollToSearch]);

  const fillEventsQuery = useCallback((searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    setGuidedMode("events");
    setQuery(trimmed);
    setError("");
    scrollToSearch();
    window.requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
      const length = trimmed.length;
      inputRef.current?.setSelectionRange(length, length);
    });
  }, [scrollToSearch]);

  const fillSpotQuery = useCallback((searchQuery?: string) => {
    setGuidedMode("spot");
    if (searchQuery?.trim()) {
      setQuery(searchQuery.trim());
    }
    setError("");
    scrollToSearch();
    window.requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });
  }, [scrollToSearch]);

  const runSearch = useCallback(
    async (searchQuery: string, watchSubcategory = watchActiveSubcategory) => {
      const trimmed = searchQuery.trim();
      if (!trimmed) {
        setError(`Try something like: ${KOI_EXAMPLE.halfwayQuery}.`);
        return;
      }

      if (loading || parsing) return;

      setQuery(trimmed);
      setParsing(true);
      setError("");

      try {
        const response = await fetch("/api/parse-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed, context: locationContext })
        });
        const data = (await response.json()) as ParseSearchResult;
        if (!response.ok) {
          if (response.status === 422 && data.needsLocation && data.form) {
            onNeedsLocation(data.form);
            setError(data.error ?? "Add your location to search nearby.");
            return;
          }
          throw new Error(data.error ?? "I could not understand that search.");
        }

        if (data.botMode === "watch") {
          recordTrendingSearch(trimmed, watchSubcategory);
          onWatchSearch(trimmed, watchSubcategory);
          return;
        }

        if (data.botMode === "events") {
          recordTrendingSearch(trimmed);
          onEventsSearch(trimmed);
          return;
        }

        if (!data.form) throw new Error(data.error ?? "I could not understand that search.");
        recordTrendingSearch(trimmed);
        if (data.form.searchMode === "midpoint") {
          trackEvent("halfway_search_submitted", { source: "freeform" });
        }
        onParsed(data.form);
      } catch (parseError) {
        setError(parseError instanceof Error ? parseError.message : "I could not understand that search.");
        onNeedsFullFallback();
      } finally {
        setParsing(false);
      }
    },
    [
      loading,
      parsing,
      locationContext,
      onEventsSearch,
      onNeedsFullFallback,
      onNeedsLocation,
      onParsed,
      onWatchSearch,
      watchActiveSubcategory
    ]
  );

  useImperativeHandle(
    ref,
    () => ({
      runQuery: (searchQuery, watchSubcategory) => {
        if (watchSubcategory) setWatchActiveSubcategory(watchSubcategory);
        void runSearch(searchQuery, watchSubcategory);
      },
      fillQuery,
      fillHalfwayIntent,
      fillEventsQuery,
      fillSpotQuery,
      setGuidedMode: (mode) => {
        setGuidedMode(mode);
        scrollToSearch();
      }
    }),
    [fillEventsQuery, fillHalfwayIntent, fillQuery, fillSpotQuery, runSearch, scrollToSearch]
  );

  function handleGuidedModeChange(mode: Exclude<GuidedSearchMode, null>) {
    const next = guidedMode === mode ? null : mode;
    setGuidedMode(next);
    if (next === "spot") {
      trackEvent("spot_mode_selected", { mode: "spot" });
    }
    if (next === "halfway") {
      trackEvent("halfway_mode_selected", { mode: "halfway" });
    }
    if (next === "events") {
      trackEvent("events_mode_selected", { mode: "events" });
    }
    setError("");
  }

  function submitSpotGuided(queryValue: string) {
    const trimmed = queryValue.trim();
    if (!trimmed || loading || parsing) return;
    setQuery(trimmed);
    setError("");
    void runSearch(trimmed);
  }

  function submitEventsGuided(queryValue: string) {
    const trimmed = queryValue.trim();
    if (!trimmed || loading || parsing) return;
    setQuery(trimmed);
    setError("");
    onEventsSearch(trimmed);
  }

  function submitHalfwayGuided(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || parsing) return;

    const a = locationA.trim();
    const b = locationB.trim();
    const lookingFor = halfwayLookingFor.trim();

    if (!a || !b || !lookingFor) {
      setError("Add both locations and what you are looking for.");
      return;
    }

    trackEvent("halfway_search_submitted", { source: "guided" });

    onPersistUserAddress?.(a);

    const form: SearchHalfwayRequest = {
      locationA: a,
      locationB: b,
      category: "custom",
      searchMode: "midpoint",
      meetupMode: "single",
      customQuery: lookingFor
    };

    setError("");
    onParsed(form);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSearch(query);
  }

  function handleManualLocationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmitManualLocation(manualLocationInput);
  }

  const busy = loading || parsing;
  const locationBusy = locating || resolvingManual;
  const activeLocationLabel = locationLabel.trim();
  const hasLocation = Boolean(activeLocationLabel || locationStatus);
  const submitLabel = parsing ? "Understanding" : loading ? "Finding options" : BRAND.askLabel;
  const onHero = surface === "hero";
  const locationButtonClass = onHero
    ? "inline-flex items-center gap-1.5 text-left text-base font-semibold text-white/80 transition hover:text-koi focus:outline-none focus:ring-4 focus:ring-koi/20 disabled:cursor-not-allowed disabled:opacity-60 sm:text-lg"
    : "inline-flex items-center gap-1.5 text-left text-base font-semibold text-ink transition hover:text-koi focus:outline-none focus:ring-4 focus:ring-koi/15 disabled:cursor-not-allowed disabled:opacity-60 sm:text-lg";
  const locationHintClass = onHero ? "mt-1 max-w-md text-xs leading-5 text-white/50" : "mt-1 max-w-md text-xs leading-5 text-slate/80";
  const heroFieldClass = "koi-hero-field h-11 w-full px-4 text-base outline-none transition disabled:cursor-not-allowed disabled:opacity-60";
  const fieldClass = "koi-field h-11 w-full px-4 text-base outline-none transition placeholder:text-slate/60 disabled:cursor-not-allowed disabled:opacity-60";
  const addressInputClass = onHero ? heroFieldClass : fieldClass;
  const guidedInputClass = onHero ? heroFieldClass : fieldClass;
  const pillClass = (active: boolean, accent: "default" | "events" = "default") =>
    onHero
      ? `inline-flex h-9 items-center rounded-full px-4 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-white/15 disabled:cursor-not-allowed disabled:opacity-60 ${
          active
            ? accent === "events"
              ? "border border-events bg-events text-white"
              : "border border-koi bg-koi text-white"
            : "border border-white/15 bg-white/5 text-white/85 hover:border-white/25 hover:bg-white/8"
        }`
      : `inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-koi/15 disabled:cursor-not-allowed disabled:opacity-60 ${
          active
            ? accent === "events"
              ? "border border-events bg-events text-white"
              : "border border-koi bg-koi text-white"
            : "border border-line bg-white text-ink hover:border-koi/40 hover:bg-[#EDFFED]"
        }`;
  const searchPlaceholder =
    guidedMode === "spot"
      ? BRAND.searchPlaceholderSpot
      : guidedMode === "halfway"
        ? buildHalfwaySearchQuery(locationA, locationB, halfwayLookingFor) || "Add locations above, or ask in plain language below"
        : guidedMode === "events"
          ? EVENTS_PLACEHOLDER
          : BRAND.searchPlaceholderFreeform;

  return (
    <div ref={containerRef} id="ask-koi" className="w-full min-w-0 max-w-full scroll-mt-24">
      <section
        className="w-full min-w-0"
        aria-labelledby="ai-search-title"
      >
        <h2 id="ai-search-title" className="sr-only">
          {BRAND.askLabel}
        </h2>

        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => handleGuidedModeChange("spot")}
            className={pillClass(guidedMode === "spot")}
          >
            Find a Spot
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => handleGuidedModeChange("halfway")}
            className={pillClass(guidedMode === "halfway")}
          >
            Meet Halfway
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => handleGuidedModeChange("events")}
            className={pillClass(guidedMode === "events", "events")}
          >
            Find Events
          </button>
        </div>

        {guidedMode === "spot" ? (
          <div className="mb-3 rounded-[18px] border border-koi/20 bg-koi/5 p-3 sm:p-4">
            <p className={`text-sm font-black ${onHero ? "text-white" : "text-koi"}`}>Nearby Spots</p>
            <p className={`mt-1 text-xs font-semibold leading-5 ${onHero ? "text-white/65" : "text-slate"}`}>
              Restaurants, coffee, drinks, shopping, and activities near you.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SPOT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  disabled={busy}
                  onClick={() => submitSpotGuided(option.query)}
                  className={`rounded-[14px] border px-3 py-2.5 text-left text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${spotOptionClass(option.accent, onHero)}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {guidedMode === "events" ? (
          <div className="mb-3 rounded-[18px] border border-events/20 bg-events/5 p-3 sm:p-4">
            <p className={`text-sm font-black ${onHero ? "text-white" : "text-events"}`}>Local Happenings</p>
            <p className={`mt-1 text-xs font-semibold leading-5 ${onHero ? "text-white/65" : "text-slate"}`}>
              Street fairs, farmers markets, festivals, and seasonal events near you.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {LOCAL_HAPPENINGS_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  disabled={busy}
                  onClick={() => submitEventsGuided(option.query)}
                  className={`rounded-[14px] border px-3 py-2.5 text-left text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    option.accent === "market"
                      ? onHero
                        ? "border-[#14B8A6]/40 bg-[#14B8A6]/10 text-white hover:border-[#14B8A6]/60"
                        : "border-[#14B8A6]/35 bg-[#E6FFFA] text-ink hover:border-[#14B8A6]/60"
                      : onHero
                        ? "border-events/35 bg-events/10 text-white hover:border-events/55"
                        : "border-events/30 bg-events/5 text-ink hover:border-events/50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {guidedMode === "halfway" ? (
          <form onSubmit={submitHalfwayGuided} className="mb-3 grid gap-2 sm:grid-cols-2">
            <label className="block min-w-0 sm:col-span-1">
              <span className={`mb-1 block text-xs font-semibold ${onHero ? "text-white/70" : "text-slate"}`}>Your address</span>
              <input
                type="text"
                value={locationA}
                onChange={(event) => setLocationA(event.target.value)}
                placeholder={KOI_EXAMPLE.locationA}
                disabled={busy}
                className={addressInputClass}
              />
            </label>
            <label className="block min-w-0 sm:col-span-1">
              <span className={`mb-1 block text-xs font-bold ${onHero ? "text-white/75" : "text-slate"}`}>Location B</span>
              <input
                type="text"
                value={locationB}
                onChange={(event) => setLocationB(event.target.value)}
                placeholder={KOI_EXAMPLE.locationB}
                disabled={busy}
                className={addressInputClass}
              />
            </label>
            <label className="block min-w-0 sm:col-span-2">
              <span className={`mb-1 block text-xs font-bold ${onHero ? "text-white/75" : "text-slate"}`}>
                What are you looking for?
              </span>
              <input
                type="text"
                value={halfwayLookingFor}
                onChange={(event) => setHalfwayLookingFor(event.target.value)}
                placeholder="Dinner, brewery, lunch, happy hour, date night"
                disabled={busy}
                className={guidedInputClass}
              />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-koi px-5 text-sm font-bold text-white transition hover:bg-koi-hover focus:outline-none focus:ring-4 focus:ring-koi/25 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                Find halfway spot
              </button>
            </div>
          </form>
        ) : null}

        <form onSubmit={handleSubmit} className="w-full min-w-0">
          <label className="block w-full min-w-0">
            <span className="sr-only">{BRAND.askLabel}</span>
            <div className="group/search w-full min-w-0 overflow-hidden rounded-[18px] bg-white shadow-[0_2px_16px_rgba(10,19,35,0.05)] transition focus-within:shadow-[0_4px_28px_rgba(10,19,35,0.08)]">
              <div className="flex w-full min-w-0 items-center gap-2 px-2.5 py-2.5 sm:px-3 sm:py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center sm:h-10 sm:w-10">
                  <AiSparkleIcon />
                </div>
                <textarea
                  ref={inputRef}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    if (error) setError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void runSearch(query);
                    }
                  }}
                  placeholder={searchPlaceholder}
                  rows={2}
                  className="m-0 min-h-[2.75rem] w-0 min-w-0 flex-1 resize-none appearance-none border-0 bg-transparent py-1.5 text-base leading-6 text-ink outline-none placeholder:text-slate/55 [field-sizing:content] sm:min-h-[3rem] sm:py-2 sm:text-[1.0625rem]"
                />
                <button
                  type="submit"
                  disabled={busy}
                  aria-label={submitLabel}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-white transition hover:bg-ink/88 focus:outline-none focus:ring-4 focus:ring-ink/15 disabled:cursor-not-allowed disabled:bg-ink/30 sm:h-10 sm:w-10"
                >
                  {busy ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <SendIcon />
                  )}
                </button>
              </div>
              {hasLocation && activeLocationLabel && !showLocationActions && !showManualFallback ? (
                <SavedLocationBadge label={activeLocationLabel} />
              ) : null}
            </div>
          </label>
        </form>
      </section>

      {hasLocation && activeLocationLabel && !showLocationActions && !showManualFallback ? null : !showLocationActions && !showManualFallback ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={onUseLocation}
            disabled={locationBusy || busy}
            className={locationButtonClass}
          >
            {locating || locationUiState === "requesting" ? "Checking location..." : "Use my location"}
          </button>
          <p className={locationHintClass}>
            Optional — helps with nearby place searches.
          </p>
        </div>
      ) : null}

      {showLocationActions ? (
        <div className="mt-3 flex flex-wrap gap-2" aria-live="polite">
          <button
            type="button"
            onClick={onUseLocation}
            disabled={locationBusy || busy}
            className={
              onHero
                ? "inline-flex h-11 items-center rounded-full border border-white/25 bg-white/10 px-5 text-base font-bold text-white transition hover:border-white/40 hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                : "inline-flex h-11 items-center rounded-full border border-line/80 bg-white px-5 text-base font-bold text-ink shadow-sm transition hover:border-clay/50 hover:bg-[#EDFFED] focus:outline-none focus:ring-4 focus:ring-clay/10 disabled:cursor-not-allowed disabled:opacity-60"
            }
          >
            {locating ? "Checking location..." : "Use my location"}
          </button>
          <button
            type="button"
            onClick={onShowZipFallback}
            disabled={locationBusy || busy}
            className={
              onHero
                ? "inline-flex h-10 items-center rounded-full border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white/90 transition hover:border-white/35 hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                : "inline-flex h-10 items-center rounded-full border border-line/80 bg-white px-4 text-sm font-semibold text-ink shadow-sm transition hover:border-clay/50 hover:bg-[#EDFFED] focus:outline-none focus:ring-4 focus:ring-clay/10 disabled:cursor-not-allowed disabled:opacity-60"
            }
          >
            Enter ZIP Code
          </button>
        </div>
      ) : null}

      {showManualFallback ? (
        <form
          onSubmit={handleManualLocationSubmit}
          className={
            onHero
              ? "mt-3 koi-premium-card p-3 backdrop-blur-sm"
              : "mt-3 rounded-card border border-line bg-paper p-3 shadow-soft"
          }
          aria-live="polite"
        >
          <p className={`text-sm font-semibold ${onHero ? "text-white" : "text-ink"}`}>
            Location blocked? Enter a ZIP code instead.
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              value={manualLocationInput}
              onChange={(event) => setManualLocationInput(event.target.value)}
              placeholder="ZIP code or city"
              autoComplete="postal-code"
              disabled={locationBusy || busy}
              className={`h-11 min-w-0 flex-1 px-4 text-base outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${onHero ? heroFieldClass : fieldClass}`}
            />
            <button
              type="submit"
              disabled={locationBusy || busy}
              className={
                onHero
                  ? "inline-flex h-11 shrink-0 items-center justify-center rounded-full border-2 border-white/25 bg-white/10 px-4 text-sm font-bold text-white transition hover:border-white/40 hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                  : "inline-flex h-11 shrink-0 items-center justify-center rounded-full border-2 border-line bg-white px-4 text-sm font-bold text-ink transition hover:border-clay hover:bg-[#EDFFED] focus:outline-none focus:ring-4 focus:ring-clay/10 disabled:cursor-not-allowed disabled:opacity-60"
              }
            >
              {resolvingManual ? "Finding..." : "Use this location"}
            </button>
          </div>
          {manualLocationError ? (
            <p className="mt-2 text-xs font-semibold text-events">{manualLocationError}</p>
          ) : null}
          <p className={`mt-2 text-xs leading-5 ${onHero ? "text-white/55" : "text-slate"}`}>
            You can still search by typing a place, like &apos;{KOI_EXAMPLE.spotQuery}&apos; or &apos;{KOI_EXAMPLE.italianQuery}&apos;.
          </p>
        </form>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-xl border border-events/20 bg-events/10 px-3 py-2.5 text-sm font-semibold text-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
});

function spotOptionClass(accent: SpotOptionAccent, onHero: boolean) {
  if (accent === "food") {
    return onHero
      ? "border-food/40 bg-food/10 text-white hover:border-food/60"
      : "border-food/35 bg-food/10 text-ink hover:border-food/60";
  }
  if (accent === "drinks") {
    return onHero
      ? "border-drinks/40 bg-drinks/10 text-white hover:border-drinks/60"
      : "border-drinks/35 bg-drinks/10 text-ink hover:border-drinks/60";
  }
  if (accent === "outdoor") {
    return onHero
      ? "border-outdoor/40 bg-outdoor/10 text-white hover:border-outdoor/60"
      : "border-outdoor/35 bg-outdoor/10 text-ink hover:border-outdoor/60";
  }
  return onHero
    ? "border-koi/35 bg-koi/10 text-white hover:border-koi/55"
    : "border-koi/30 bg-koi/5 text-ink hover:border-koi/50";
}
