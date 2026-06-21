"use client";

import { KoiBrowseSelector } from "@/app/components/KoiBrowseSelector";
import type { SearchHalfwayRequest, WatchSubcategory } from "@/lib/types";
import type { CurrentLocationContext } from "@/lib/currentLocation";
import {
  DEFAULT_BROWSE_LANE_ID,
  getBrowseLaneForQuery,
  KOI_FEATURED_EXAMPLES,
  type KoiBrowseLaneId,
  type KoiBrowseOption
} from "@/lib/koiBrowse";
import { DEFAULT_WATCH_SUBCATEGORY } from "@/lib/watchBrowse";
import { BRAND } from "@/src/config/branding";
import { FormEvent, useState } from "react";

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
  const [showMoreIdeas, setShowMoreIdeas] = useState(false);
  const [activeBrowseLane, setActiveBrowseLane] = useState<KoiBrowseLaneId>(DEFAULT_BROWSE_LANE_ID);
  const [watchActiveSubcategory, setWatchActiveSubcategory] = useState<WatchSubcategory>(DEFAULT_WATCH_SUBCATEGORY);

  async function runSearch(searchQuery: string, watchSubcategory = watchActiveSubcategory) {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setError("Try something like: Coffee halfway between Hoboken and Princeton.");
      return;
    }

    if (loading || parsing) return;

    setQuery(trimmed);
    setActiveBrowseLane(getBrowseLaneForQuery(trimmed).id);
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
        onWatchSearch(trimmed, watchSubcategory);
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

  function handleBrowseSelect(option: KoiBrowseOption) {
    if (loading || parsing) return;
    if (option.watchSubcategory) {
      setWatchActiveSubcategory(option.watchSubcategory);
    }
    setQuery(option.query);
    setError("");
    void runSearch(option.query, option.watchSubcategory ?? watchActiveSubcategory);
  }

  const busy = loading || parsing;
  const normalizedSelection = query.trim().toLowerCase();

  return (
    <section
      id="ask-koi"
      className="w-full min-w-0 scroll-mt-20 rounded-[20px] border border-white/10 bg-paper p-4 shadow-[0_16px_40px_rgba(10,19,35,0.18)] sm:p-5"
      aria-labelledby="ai-search-title"
    >
      <h2 id="ai-search-title" className="sr-only">
        {BRAND.askLabel}
      </h2>

      <form onSubmit={handleSubmit} className="grid gap-3">
        <label className="grid gap-2">
          <span className="sr-only">{BRAND.askLabel}</span>
          <textarea
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (error) setError("");
            }}
            placeholder={BRAND.searchPlaceholder}
            rows={2}
            className="min-h-[3.25rem] resize-none rounded-2xl border border-line bg-white px-4 py-3.5 text-base text-ink outline-none transition placeholder:text-slate/60 focus:border-clay focus:ring-4 focus:ring-clay/10 sm:min-h-14 sm:text-lg"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="h-11 rounded-full bg-ink px-5 text-sm font-bold text-white transition hover:bg-ink/85 focus:outline-none focus:ring-4 focus:ring-ink/15 disabled:cursor-not-allowed disabled:bg-ink/30 sm:h-12 sm:text-base"
        >
          {parsing ? "Understanding..." : loading ? "Finding picks..." : BRAND.askLabel}
        </button>
      </form>

      {error ? (
        <p className="mt-3 rounded-lg border border-clay/30 bg-[#FFF4EC] px-3 py-2 text-sm font-semibold text-ink">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {KOI_FEATURED_EXAMPLES.map((example) => {
          const selected = example.query.trim().toLowerCase() === normalizedSelection;
          return (
            <button
              key={example.id}
              type="button"
              disabled={busy}
              onClick={() => handleBrowseSelect(example)}
              className={`rounded-full border px-3 py-2 text-left text-xs font-semibold leading-snug transition focus:outline-none focus:ring-4 focus:ring-clay/10 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm ${
                selected
                  ? "border-clay bg-[#FFF4EC] text-ink"
                  : "border-line bg-white text-slate hover:border-clay/40 hover:text-ink"
              }`}
            >
              {example.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        {locationStatus ? (
          <p className="text-xs font-semibold text-[#176644]">{locationStatus}</p>
        ) : (
          <button
            type="button"
            onClick={onUseLocation}
            disabled={locating || busy}
            className="text-xs font-semibold text-slate underline decoration-line underline-offset-4 transition hover:text-clay disabled:cursor-not-allowed disabled:opacity-60"
          >
            {locating ? "Checking location..." : "Use my location"}
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowMoreIdeas((current) => !current)}
          className="text-xs font-semibold text-slate transition hover:text-clay"
          aria-expanded={showMoreIdeas}
        >
          {showMoreIdeas ? "Hide more ideas" : "More ideas"}
        </button>
      </div>

      {showMoreIdeas ? (
        <div className="mt-4 border-t border-line/80 pt-4">
          <KoiBrowseSelector
            activeLaneId={activeBrowseLane}
            selectedQuery={query}
            busy={busy}
            onLaneChange={setActiveBrowseLane}
            onSelect={handleBrowseSelect}
          />
        </div>
      ) : null}
    </section>
  );
}
