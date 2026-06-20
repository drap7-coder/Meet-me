"use client";

import { WatchBrowseSelector } from "@/app/components/WatchBrowseSelector";
import type { SearchHalfwayRequest, WatchSubcategory } from "@/lib/types";
import type { CurrentLocationContext } from "@/lib/currentLocation";
import { DEFAULT_WATCH_SUBCATEGORY, type WatchGenreOption } from "@/lib/watchBrowse";
import { BRAND } from "@/src/config/branding";
import { FormEvent, useEffect, useRef, useState } from "react";

type Props = {
  loading: boolean;
  locationStatus?: string;
  locationContext?: CurrentLocationContext;
  onParsed: (form: SearchHalfwayRequest) => void;
  onWatchSearch: (query: string, subcategory: WatchSubcategory) => void;
  onEventsSearch: (query: string) => void;
  onNeedsFullFallback: () => void;
  onNeedsLocation: (form: SearchHalfwayRequest) => void;
  onUseLocation: () => void;
  locating?: boolean;
};

type ParseSearchResult = {
  botMode?: "places" | "watch" | "events";
  form?: SearchHalfwayRequest;
  error?: string;
  needsLocation?: boolean;
};

const EXAMPLE_PROMPTS = [
  "Coffee between Hoboken and Edison",
  "Shopping between Hoboken and Edison",
  "Dinner near me",
  "Funny movies like Superbad",
  "Concerts this weekend"
];

export function AiSearchBox({
  loading,
  locationStatus,
  locationContext,
  onParsed,
  onWatchSearch,
  onEventsSearch,
  onNeedsFullFallback,
  onNeedsLocation,
  onUseLocation,
  locating = false
}: Props) {
  const [query, setQuery] = useState("");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");
  const [showWatchGenres, setShowWatchGenres] = useState(false);
  const [watchActiveSubcategory, setWatchActiveSubcategory] = useState<WatchSubcategory | null>(DEFAULT_WATCH_SUBCATEGORY);
  const genrePanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showWatchGenres) return;
    requestAnimationFrame(() => {
      genrePanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, [showWatchGenres]);

  async function runSearch(searchQuery: string) {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setError("Try a sentence like: Coffee between Hoboken and Edison.");
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
        onWatchSearch(trimmed, watchActiveSubcategory ?? DEFAULT_WATCH_SUBCATEGORY);
        return;
      }

      if (data.botMode === "events") {
        onEventsSearch(trimmed);
        return;
      }

      if (!data.form) throw new Error(data.error ?? "I could not understand that search.");
      onParsed(data.form);
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : "I could not understand that search.");
      onNeedsFullFallback();
    } finally {
      setParsing(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSearch(query);
  }

  function handleWatchGenreSelect(subcategory: WatchSubcategory, option: WatchGenreOption) {
    if (loading || parsing) return;
    setWatchActiveSubcategory(subcategory);
    setQuery(option.query);
    setError("");
    onWatchSearch(option.query, subcategory);
  }

  const busy = loading || parsing;

  return (
    <section
      id="ask-koi"
      className="w-full min-w-0 scroll-mt-24 rounded-lg border border-line bg-paper p-5 shadow-soft sm:p-7"
      aria-labelledby="ai-search-title"
    >
      <div className="mb-5">
        <p className="text-sm font-black uppercase tracking-[0.14em] text-clay">{BRAND.askLabel}</p>
        <h2 id="ai-search-title" className="mt-2 text-2xl font-black tracking-tight text-ink sm:text-3xl">
          Koi finds the plan.
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate">
          Places to meet. Movies to watch. Events nearby. Just say what you&apos;re looking for.
        </p>
        {locationStatus ? (
          <p className="mt-3 inline-flex rounded-full bg-[#F3FBF6] px-3 py-1.5 text-xs font-black text-[#176644]">
            {locationStatus}
          </p>
        ) : (
          <button
            type="button"
            onClick={onUseLocation}
            disabled={locating || busy}
            className="mt-3 inline-flex rounded-full border border-line bg-white px-3 py-1.5 text-xs font-black text-ink transition hover:border-clay hover:text-clay disabled:cursor-not-allowed disabled:opacity-60"
          >
            {locating ? "Checking location..." : "Use my location"}
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3">
        <label className="grid gap-2">
          <span className="sr-only">Ask Koi</span>
          <textarea
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (error) setError("");
            }}
            placeholder={`${BRAND.askLabel}...`}
            rows={3}
            className="min-h-24 resize-none rounded-lg border border-line bg-mint px-4 py-3 text-base text-ink outline-none transition placeholder:text-slate/70 focus:border-clay focus:ring-4 focus:ring-clay/10"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="h-11 rounded-full bg-ink px-5 font-bold text-white shadow-[0_10px_24px_rgba(17,24,39,0.14)] transition hover:bg-ink/85 focus:outline-none focus:ring-4 focus:ring-ink/15 disabled:cursor-not-allowed disabled:bg-ink/30 sm:h-12"
        >
          {parsing ? "Understanding..." : loading ? "Finding picks..." : BRAND.askLabel}
        </button>
      </form>

      {error ? (
        <p className="mt-3 rounded-lg border border-clay/30 bg-[#FFF4EC] px-3 py-2 text-sm font-semibold text-ink">
          {error}
        </p>
      ) : null}

      <div className="mt-5 grid gap-3">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate">Try one</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void runSearch(prompt)}
              className="rounded-full border border-line bg-white px-3 py-2 text-left text-xs font-semibold text-slate transition hover:border-clay hover:text-clay sm:text-sm"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3 border-t border-line/70 pt-5">
        <button
          type="button"
          onClick={() => setShowWatchGenres((current) => !current)}
          className="justify-self-start rounded-full border border-line bg-white px-4 py-2 text-sm font-black text-ink transition hover:border-clay hover:text-clay"
        >
          {showWatchGenres ? "Hide movie genres" : "Browse movie genres"}
        </button>
        {showWatchGenres ? (
          <WatchBrowseSelector
            genrePanelRef={genrePanelRef}
            activeSubcategory={watchActiveSubcategory}
            selectedGenreQuery={query}
            busy={busy}
            onSubcategorySelect={setWatchActiveSubcategory}
            onGenreSelect={handleWatchGenreSelect}
          />
        ) : null}
      </div>
    </section>
  );
}
