"use client";

import type { SearchHalfwayRequest, WatchSubcategory } from "@/lib/types";
import type { CurrentLocationContext } from "@/lib/currentLocation";
import type { LocationUiState } from "@/lib/locationInput";
import { DEFAULT_WATCH_SUBCATEGORY } from "@/lib/watchBrowse";
import { recordTrendingSearch } from "@/lib/trendingSearches";
import { BRAND } from "@/src/config/branding";
import { FormEvent, forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";

type Props = {
  loading: boolean;
  locationStatus?: string;
  locationUiState?: LocationUiState;
  showManualFallback?: boolean;
  manualLocationError?: string;
  locationContext?: CurrentLocationContext;
  onParsed: (form: SearchHalfwayRequest) => void;
  onWatchSearch: (query: string, subcategory: WatchSubcategory) => void;
  onEventsSearch: (query: string) => void;
  onNeedsFullFallback: () => void;
  onNeedsLocation: (form: SearchHalfwayRequest) => void;
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
};

function AiSparkleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0 text-clay"
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
    locationUiState = "idle",
    showManualFallback = false,
    manualLocationError,
    locationContext,
    onParsed,
    onWatchSearch,
    onEventsSearch,
    onNeedsFullFallback,
    onNeedsLocation,
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fillQuery = useCallback((searchQuery: string, watchSubcategory?: WatchSubcategory) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    if (watchSubcategory) setWatchActiveSubcategory(watchSubcategory);
    setQuery(trimmed);
    setError("");
    window.requestAnimationFrame(() => {
      containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      inputRef.current?.focus({ preventScroll: true });
      const length = trimmed.length;
      inputRef.current?.setSelectionRange(length, length);
    });
  }, []);

  const runSearch = useCallback(
    async (searchQuery: string, watchSubcategory = watchActiveSubcategory) => {
      const trimmed = searchQuery.trim();
      if (!trimmed) {
        setError("Try something like: Coffee halfway between Hoboken and Princeton.");
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
      fillQuery
    }),
    [fillQuery, runSearch]
  );

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
  const hasLocation = Boolean(locationStatus);
  const submitLabel = parsing ? "Understanding" : loading ? "Finding picks" : BRAND.askLabel;
  const onHero = surface === "hero";
  const locationButtonClass = onHero
    ? "inline-flex items-center gap-1.5 text-left text-base font-bold text-white transition hover:text-white/85 focus:outline-none focus:ring-4 focus:ring-white/15 disabled:cursor-not-allowed disabled:opacity-60 sm:text-lg"
    : "inline-flex items-center gap-1.5 text-left text-base font-bold text-ink transition hover:text-clay focus:outline-none focus:ring-4 focus:ring-clay/10 disabled:cursor-not-allowed disabled:opacity-60 sm:text-lg";
  const locationHintClass = onHero ? "mt-1 max-w-md text-xs leading-5 text-white/55" : "mt-1 max-w-md text-xs leading-5 text-slate/80";
  const locationStatusClass = onHero ? "mt-3 text-xs leading-5 text-white/70" : "mt-3 text-xs leading-5 text-slate/90";

  return (
    <div ref={containerRef} id="ask-koi" className="w-full min-w-0 max-w-full scroll-mt-24">
      <section
        className="w-full min-w-0"
        aria-labelledby="ai-search-title"
      >
        <h2 id="ai-search-title" className="sr-only">
          {BRAND.askLabel}
        </h2>

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
                  placeholder={BRAND.searchPlaceholder}
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
            </div>
          </label>
        </form>
      </section>

      {hasLocation && locationStatus && !showLocationActions && !showManualFallback ? (
        <p className={locationStatusClass}>{locationStatus}</p>
      ) : !showLocationActions && !showManualFallback ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={onUseLocation}
            disabled={locationBusy || busy}
            className={locationButtonClass}
          >
            {locating || locationUiState === "requesting" ? "Checking location..." : "📍 Use my location"}
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
                : "inline-flex h-11 items-center rounded-full border border-line/80 bg-white px-5 text-base font-bold text-ink shadow-sm transition hover:border-clay/50 hover:bg-[#FFF4EC] focus:outline-none focus:ring-4 focus:ring-clay/10 disabled:cursor-not-allowed disabled:opacity-60"
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
                : "inline-flex h-10 items-center rounded-full border border-line/80 bg-white px-4 text-sm font-semibold text-ink shadow-sm transition hover:border-clay/50 hover:bg-[#FFF4EC] focus:outline-none focus:ring-4 focus:ring-clay/10 disabled:cursor-not-allowed disabled:opacity-60"
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
              ? "mt-3 rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm"
              : "mt-3 rounded-xl border border-line/80 bg-mint/80 p-3"
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
              className="h-11 min-w-0 flex-1 rounded-full border border-line bg-white px-4 text-base text-ink outline-none transition placeholder:text-slate/60 focus:border-clay focus:ring-4 focus:ring-clay/10"
            />
            <button
              type="submit"
              disabled={locationBusy || busy}
              className={
                onHero
                  ? "inline-flex h-11 shrink-0 items-center justify-center rounded-full border-2 border-white/25 bg-white/10 px-4 text-sm font-bold text-white transition hover:border-white/40 hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                  : "inline-flex h-11 shrink-0 items-center justify-center rounded-full border-2 border-line bg-white px-4 text-sm font-bold text-ink transition hover:border-clay hover:bg-[#FFF4EC] focus:outline-none focus:ring-4 focus:ring-clay/10 disabled:cursor-not-allowed disabled:opacity-60"
              }
            >
              {resolvingManual ? "Finding..." : "Use this location"}
            </button>
          </div>
          {manualLocationError ? (
            <p className="mt-2 text-xs font-semibold text-clay">{manualLocationError}</p>
          ) : null}
          <p className={`mt-2 text-xs leading-5 ${onHero ? "text-white/55" : "text-slate"}`}>
            You can still search by typing a place, like &apos;pizza near 19038&apos; or &apos;coffee near Hoboken&apos;.
          </p>
        </form>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-xl border border-clay/25 bg-[#FFF4EC] px-3 py-2.5 text-sm font-semibold text-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
});
