"use client";

import type { SearchHalfwayRequest, WatchSubcategory } from "@/lib/types";
import type { CurrentLocationContext } from "@/lib/currentLocation";
import type { LocationUiState } from "@/lib/locationInput";
import { KOI_EXAMPLE } from "@/lib/koiExamples";
import { KOI_ROTATING_PLACEHOLDERS } from "@/lib/koiCapabilityExamples";
import { DEFAULT_WATCH_SUBCATEGORY } from "@/lib/watchBrowse";
import { hasStreamingWatchContext } from "@/lib/watchEvents";
import { useSearchPromptAssist } from "@/app/components/SearchPromptAssist";
import { BRAND } from "@/src/config/branding";
import { LocationPinIcon } from "@/app/components/SavedLocationBadge";
import { useSpeechRecognition } from "@/app/components/useSpeechRecognition";
import { FormEvent, forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

type Props = {
  loading: boolean;
  locationStatus?: string;
  locationUiState?: LocationUiState;
  showManualFallback?: boolean;
  manualLocationError?: string;
  locationContext?: CurrentLocationContext;
  defaultUserAddress?: string;
  locationSavedMessage?: string;
  submitError?: string;
  onSubmitQuery: (
    query: string,
    options?: {
      watchSubcategory?: WatchSubcategory;
      streamingServiceIds?: string[];
      builderStreaming?: boolean;
    }
  ) => void;
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

export type AiSearchBoxHandle = {
  runQuery: (query: string, watchSubcategory?: WatchSubcategory) => void;
  fillQuery: (query: string, watchSubcategory?: WatchSubcategory) => void;
  fillHalfwayIntent: (lookingFor: string, exampleQuery?: string) => void;
};

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0 text-white/45"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

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

function MicIcon({ active = false }: { active?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-4 w-4 ${active ? "text-koi" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" />
      <path d="M19 11a7 7 0 0 1-14 0" />
      <path d="M12 18v3" />
    </svg>
  );
}

export const AiSearchBox = forwardRef<AiSearchBoxHandle, Props>(function AiSearchBox(
  {
    loading,
    showManualFallback = false,
    manualLocationError,
    locationSavedMessage,
    submitError,
    onSubmitQuery,
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
  const { filterPreview, isStreaming: builderStreaming } = useSearchPromptAssist();
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [manualLocationInput, setManualLocationInput] = useState("");
  const [watchActiveSubcategory, setWatchActiveSubcategory] = useState<WatchSubcategory>(DEFAULT_WATCH_SUBCATEGORY);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    supported: speechSupported,
    listening,
    message: speechMessage,
    toggleListening,
    stopListening,
    clearMessage: clearSpeechMessage
  } = useSpeechRecognition((transcript) => {
    setQuery(transcript);
    if (error) setError("");
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPlaceholderIndex((current) => (current + 1) % KOI_ROTATING_PLACEHOLDERS.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, []);

  const scrollToSearch = useCallback(() => {
    window.requestAnimationFrame(() => {
      containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, []);

  const fillQuery = useCallback(
    (searchQuery: string, watchSubcategory?: WatchSubcategory) => {
      const trimmed = searchQuery.trim();
      if (!trimmed) return;
      if (watchSubcategory) setWatchActiveSubcategory(watchSubcategory);
      setQuery(trimmed);
      setError("");
      scrollToSearch();
      window.requestAnimationFrame(() => {
        inputRef.current?.focus({ preventScroll: true });
        const length = trimmed.length;
        inputRef.current?.setSelectionRange(length, length);
      });
    },
    [scrollToSearch]
  );

  const fillHalfwayIntent = useCallback(
    (_lookingFor: string, exampleQuery?: string) => {
      if (exampleQuery?.trim()) fillQuery(exampleQuery);
      else scrollToSearch();
    },
    [fillQuery, scrollToSearch]
  );

  const runSearch = useCallback(
    (searchQuery: string, watchSubcategory = watchActiveSubcategory) => {
      const trimmed = searchQuery.trim();
      if (!trimmed) {
        setError(`Try something like: ${KOI_EXAMPLE.halfwayQuery}.`);
        return;
      }

      if (loading) return;

      stopListening();
      setQuery(trimmed);
      setError("");

      onSubmitQuery(trimmed, {
        watchSubcategory,
        streamingServiceIds: filterPreview?.options.streamingServiceIds,
        builderStreaming: builderStreaming || hasStreamingWatchContext(trimmed)
      });
    },
    [builderStreaming, filterPreview?.options.streamingServiceIds, loading, onSubmitQuery, stopListening, watchActiveSubcategory]
  );

  useImperativeHandle(
    ref,
    () => ({
      runQuery: (searchQuery, watchSubcategory) => {
        if (watchSubcategory) setWatchActiveSubcategory(watchSubcategory);
        void runSearch(searchQuery, watchSubcategory);
      },
      fillQuery,
      fillHalfwayIntent
    }),
    [fillHalfwayIntent, fillQuery, runSearch]
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSearch(query);
  }

  function handleManualLocationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmitManualLocation(manualLocationInput);
  }

  const busy = loading;
  const locationBusy = locating || resolvingManual;
  const submitLabel = loading ? "Finding options" : BRAND.askLabel;
  const onHero = surface === "hero";
  const heroFieldClass = "koi-hero-field h-11 w-full px-4 text-base outline-none transition disabled:cursor-not-allowed disabled:opacity-60";
  const fieldClass = "koi-field h-11 w-full px-4 text-base outline-none transition placeholder:text-slate/60 disabled:cursor-not-allowed disabled:opacity-60";
  const rotatingPlaceholder = KOI_ROTATING_PLACEHOLDERS[placeholderIndex] ?? BRAND.searchPlaceholder;
  const combinedError = error.trim() || submitError?.trim() || "";
  const locationPromptMessage = combinedError || "Add your location so Koi can search nearby.";
  const manualPromptMessage = combinedError || "Enter a city, ZIP code, or address to search nearby.";
  const showStandaloneError = Boolean(combinedError) && !showLocationActions && !showManualFallback;
  const showSpeechMessage = Boolean(speechMessage) && !showLocationActions && !showManualFallback;
  const promptPanelClass = onHero
    ? "rounded-[14px] border border-koi/35 bg-koi/20 p-3 shadow-[0_8px_24px_rgba(255,90,0,0.14)]"
    : "rounded-[14px] border border-koi/30 bg-koi/10 p-3";
  const promptTextClass = onHero ? "text-white" : "text-ink";

  return (
    <div ref={containerRef} id="ask-koi" className="w-full min-w-0 max-w-full scroll-mt-24">
      <section className="w-full min-w-0" aria-labelledby="ai-search-title">
        <h2 id="ai-search-title" className="sr-only">
          {BRAND.askLabel}
        </h2>

        <form onSubmit={handleSubmit} className="w-full min-w-0">
          <label className="block w-full min-w-0">
            <span className="sr-only">{BRAND.askLabel}</span>
            <div
              className={
                onHero
                  ? "koi-premium-card group/search flex w-full min-w-0 items-center gap-2 px-3 py-2.5 transition focus-within:border-koi/35"
                  : "group/search w-full min-w-0 overflow-x-clip rounded-[18px] bg-white shadow-[0_2px_16px_rgba(10,19,35,0.05)] transition focus-within:shadow-[0_4px_28px_rgba(10,19,35,0.08)]"
              }
            >
              <div className={`flex w-full min-w-0 items-center gap-2 ${onHero ? "" : "px-2.5 py-2.5 sm:px-3 sm:py-3"}`}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center sm:h-10 sm:w-10">
                  {onHero ? <SearchIcon /> : <AiSparkleIcon />}
                </div>
                <textarea
                  ref={inputRef}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    if (error) setError("");
                    if (speechMessage) clearSpeechMessage();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void runSearch(query);
                    }
                  }}
                  placeholder={onHero ? BRAND.searchPlaceholder : rotatingPlaceholder}
                  rows={onHero ? 1 : 2}
                  className={
                    onHero
                      ? "m-0 min-h-[2.5rem] w-0 min-w-0 flex-1 resize-none appearance-none border-0 bg-transparent py-1.5 text-base leading-6 text-white outline-none placeholder:text-white/42 [field-sizing:content]"
                      : "m-0 min-h-[2.75rem] w-0 min-w-0 flex-1 resize-none appearance-none border-0 bg-transparent py-1.5 text-base leading-6 text-ink outline-none placeholder:text-slate/55 [field-sizing:content] sm:min-h-[3rem] sm:py-2 sm:text-[1.0625rem]"
                  }
                />
                {speechSupported ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => toggleListening(query)}
                    aria-label={listening ? "Stop listening" : "Start voice input"}
                    aria-pressed={listening}
                    title={listening ? "Listening… tap to stop" : "Speak your ask"}
                    className={
                      onHero
                        ? `inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:w-10 ${
                            listening
                              ? "border-koi/70 bg-koi/20 text-white shadow-[0_0_0_3px_rgba(255,90,0,0.22)] focus:ring-koi/30"
                              : "border-white/20 bg-white/8 text-white/80 hover:border-white/35 hover:bg-white/12 focus:ring-white/15"
                          }`
                        : `inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:w-10 ${
                            listening
                              ? "border-koi/60 bg-koi/10 text-koi shadow-[0_0_0_3px_rgba(255,90,0,0.16)] focus:ring-koi/20"
                              : "border-line/80 bg-white text-slate/80 hover:border-koi/45 hover:bg-koi/8 hover:text-ink focus:ring-koi/10"
                          }`
                    }
                  >
                    {listening ? (
                      <span className="relative flex h-4 w-4 items-center justify-center">
                        <span className="absolute inline-flex h-4 w-4 animate-ping rounded-full bg-koi/35" />
                        <MicIcon active />
                      </span>
                    ) : (
                      <MicIcon />
                    )}
                  </button>
                ) : null}
                <button
                  type="submit"
                  disabled={busy}
                  aria-label={submitLabel}
                  className={
                    onHero
                      ? "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-koi text-white shadow-[0_8px_18px_rgba(255,90,0,0.28)] transition hover:bg-koi-hover focus:outline-none focus:ring-4 focus:ring-koi/25 disabled:cursor-not-allowed disabled:bg-koi/40 sm:h-10 sm:w-10"
                      : "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-white transition hover:bg-ink/88 focus:outline-none focus:ring-4 focus:ring-ink/15 disabled:cursor-not-allowed disabled:bg-ink/30 sm:h-10 sm:w-10"
                  }
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

      {!showLocationActions && !showManualFallback && !showStandaloneError && locationSavedMessage ? (
        <p className={`mt-2 px-1 text-xs font-semibold ${onHero ? "text-koi" : "text-koi"}`}>{locationSavedMessage}</p>
      ) : null}

      {listening ? (
        <p className={`mt-2 px-1 text-xs font-semibold ${onHero ? "text-koi" : "text-koi"}`} aria-live="polite">
          Listening… speak your ask, then edit or tap Search.
        </p>
      ) : null}

      {showSpeechMessage ? (
        <p
          className={`mt-2 px-1 text-xs font-semibold leading-5 ${onHero ? "text-[#FFD4C8]" : "text-events"}`}
          role="status"
          aria-live="polite"
        >
          {speechMessage}
        </p>
      ) : null}

      {showLocationActions ? (
        <div className={`mt-3 ${promptPanelClass}`} aria-live="polite">
          <div className="flex items-start gap-2">
            <LocationPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-koi" />
            <p className={`min-w-0 flex-1 text-sm font-semibold leading-6 ${promptTextClass}`}>{locationPromptMessage}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onUseLocation}
              disabled={locationBusy || busy}
              className={
                onHero
                  ? "inline-flex h-11 items-center rounded-full border border-white/25 bg-white/10 px-5 text-base font-bold text-white transition hover:border-white/40 hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                  : "inline-flex h-11 items-center rounded-full border border-line/80 bg-white px-5 text-base font-bold text-ink shadow-sm transition hover:border-koi/50 hover:bg-koi/10 focus:outline-none focus:ring-4 focus:ring-koi/10 disabled:cursor-not-allowed disabled:opacity-60"
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
                  : "inline-flex h-10 items-center rounded-full border border-line/80 bg-white px-4 text-sm font-semibold text-ink shadow-sm transition hover:border-koi/50 hover:bg-koi/10 focus:outline-none focus:ring-4 focus:ring-koi/10 disabled:cursor-not-allowed disabled:opacity-60"
              }
            >
              Enter city or ZIP
            </button>
          </div>
        </div>
      ) : null}

      {showManualFallback ? (
        <form onSubmit={handleManualLocationSubmit} className={`mt-3 ${promptPanelClass}`} aria-live="polite">
          <div className="flex items-start gap-2">
            <LocationPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-koi" />
            <p className={`min-w-0 flex-1 text-sm font-semibold leading-6 ${promptTextClass}`}>{manualPromptMessage}</p>
          </div>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <LocationPinIcon
                className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${onHero ? "text-koi" : "text-watch"}`}
              />
              <input
                type="text"
                value={manualLocationInput}
                onChange={(event) => setManualLocationInput(event.target.value)}
                placeholder="City, ZIP code, or address"
                autoComplete="postal-code"
                disabled={locationBusy || busy}
                className={`h-11 w-full min-w-0 pl-10 pr-4 text-base outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${onHero ? heroFieldClass : fieldClass}`}
              />
            </div>
            <button
              type="submit"
              disabled={locationBusy || busy}
              className={
                onHero
                  ? "inline-flex h-11 shrink-0 items-center justify-center rounded-full border-2 border-white/25 bg-white/10 px-4 text-sm font-bold text-white transition hover:border-white/40 hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                  : "inline-flex h-11 shrink-0 items-center justify-center rounded-full border-2 border-line bg-white px-4 text-sm font-bold text-ink transition hover:border-koi hover:bg-koi/10 focus:outline-none focus:ring-4 focus:ring-koi/10 disabled:cursor-not-allowed disabled:opacity-60"
              }
            >
              {resolvingManual ? "Finding..." : "Continue"}
            </button>
          </div>
      {manualLocationError ? (
            <p className={`mt-2 text-xs font-semibold leading-5 ${onHero ? "text-[#FFD4C8]" : "text-events"}`}>
              {manualLocationError}
            </p>
          ) : null}
        </form>
      ) : null}

      {showStandaloneError ? (
        <div className={`mt-3 flex items-start gap-2 ${promptPanelClass}`} role="status">
          <LocationPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-koi" />
          <p className={`min-w-0 flex-1 text-sm font-semibold leading-6 ${promptTextClass}`}>{combinedError}</p>
        </div>
      ) : null}
    </div>
  );
});
