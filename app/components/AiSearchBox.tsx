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
      setError("Try something like: Coffee between us.");
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
      className="w-full min-w-0 scroll-mt-24 rounded-lg border border-line bg-paper p-5 shadow-soft sm:p-7"
      aria-labelledby="ai-search-title"
    >
      <h2 id="ai-search-title" className="sr-only">
        {BRAND.askLabel}
      </h2>

      {locationStatus ? (
        <p className="mb-4 inline-flex rounded-full bg-[#F3FBF6] px-3 py-1.5 text-xs font-black text-[#176644]">
          {locationStatus}
        </p>
      ) : (
        <button
          type="button"
          onClick={onUseLocation}
          disabled={locating || busy}
          className="mb-4 inline-flex rounded-full border border-line bg-white px-3 py-1.5 text-xs font-black text-ink transition hover:border-clay hover:text-clay disabled:cursor-not-allowed disabled:opacity-60"
        >
          {locating ? "Checking location..." : "Use my location"}
        </button>
      )}

      <form onSubmit={handleSubmit} className="grid gap-3">
        <label className="grid gap-2">
          <span className="sr-only">{BRAND.askLabel}</span>
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
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate">Try an example</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {KOI_FEATURED_EXAMPLES.map((example) => {
            const selected = example.query.trim().toLowerCase() === normalizedSelection;
            return (
              <button
                key={example.id}
                type="button"
                disabled={busy}
                onClick={() => handleBrowseSelect(example)}
                className={`group flex items-center gap-3 rounded-[18px] border-2 px-3 py-3 text-left transition focus:outline-none focus:ring-4 focus:ring-clay/10 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 ${
                  selected
                    ? "border-[var(--mmh-coral)] bg-[#FFF4EC] shadow-[0_0_0_4px_rgba(214,90,46,0.10)]"
                    : "border-[#D8DDE6] bg-white hover:border-ink/25 hover:bg-sky"
                }`}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#FFF4EC] text-lg">
                  {example.emoji}
                </span>
                <span className="min-w-0 text-sm font-black leading-snug text-ink group-hover:text-clay">
                  {example.label}
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setShowMoreIdeas((current) => !current)}
          className="justify-self-start text-sm font-black text-clay transition hover:text-[#B94A22]"
          aria-expanded={showMoreIdeas}
        >
          {showMoreIdeas ? "Hide more ideas" : "More ideas"}
        </button>
        {showMoreIdeas ? (
          <KoiBrowseSelector
            activeLaneId={activeBrowseLane}
            selectedQuery={query}
            busy={busy}
            onLaneChange={setActiveBrowseLane}
            onSelect={handleBrowseSelect}
          />
        ) : null}
      </div>
    </section>
  );
}
