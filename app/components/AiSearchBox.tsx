"use client";

import { WatchBrowseSelector } from "@/app/components/WatchBrowseSelector";
import type { KoiBotMode, SearchHalfwayRequest, WatchSubcategory } from "@/lib/types";
import {
  EVENTS_DESCRIPTION,
  EVENTS_EXAMPLE_PROMPTS,
  EVENTS_PLACEHOLDER,
  getWatchSubcategoryDescription,
  getWatchSubcategoryLabel,
  DEFAULT_WATCH_SUBCATEGORY,
  watchSubcategoryHasGenres,
  WATCH_PLACEHOLDER,
  WATCH_PROMPTS_BY_SUBCATEGORY,
  type WatchGenreOption
} from "@/lib/watchBrowse";
import { BRAND } from "@/src/config/branding";
import { FormEvent, useEffect, useRef, useState } from "react";

type Props = {
  loading: boolean;
  botMode: KoiBotMode;
  onBotModeChange: (mode: KoiBotMode) => void;
  onParsed: (form: SearchHalfwayRequest) => void;
  onWatchSearch: (query: string, subcategory: WatchSubcategory) => void;
  onEventsSearch: (query: string) => void;
};

type ParseSearchResult = {
  botMode?: KoiBotMode;
  form?: SearchHalfwayRequest;
  error?: string;
};

type WatchFlowStep = "categories" | "search";

const BOT_MODES = [
  {
    id: "places" as const,
    title: "Find Places",
    description: "Food, drinks, coffee, activities, and halfway meetup spots."
  },
  {
    id: "watch" as const,
    title: "Watch",
    description: "Movies, TV shows, streaming, and what to watch tonight."
  },
  {
    id: "events" as const,
    title: "Events",
    description: EVENTS_DESCRIPTION
  }
];

const PLACE_EXAMPLE_PROMPTS = [
  "Find coffee near Hoboken with easy parking.",
  "Find a coffee shop between Hoboken and Edison with easy parking.",
  "Where should we meet between NYC and Princeton?"
];

const NEUTRAL_SUBHEADLINE = "Find places, watch picks, and local events — nearby or halfway.";

function FlowBackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 text-sm font-bold text-slate transition hover:text-clay focus:outline-none focus:ring-4 focus:ring-clay/10"
    >
      <span aria-hidden="true">←</span>
      {label}
    </button>
  );
}

type SearchPanelProps = {
  query: string;
  error: string;
  busy: boolean;
  placeholder: string;
  submitLabel: string;
  examplePrompts: string[];
  onQueryChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onExampleSelect: (prompt: string) => void;
};

function SearchPanel({
  query,
  error,
  busy,
  placeholder,
  submitLabel,
  examplePrompts,
  onQueryChange,
  onSubmit,
  onExampleSelect
}: SearchPanelProps) {
  return (
    <div className="grid gap-5">
      <form onSubmit={onSubmit} className="grid gap-3">
        <label className="grid gap-2">
          <span className="sr-only">Natural language search</span>
          <textarea
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={placeholder}
            rows={3}
            className="min-h-24 resize-none rounded-lg border border-line bg-mint px-4 py-3 text-base text-ink outline-none transition placeholder:text-slate/70 focus:border-clay focus:ring-4 focus:ring-clay/10"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="h-11 rounded-full bg-ink px-5 font-bold text-white shadow-[0_10px_24px_rgba(17,24,39,0.14)] transition hover:bg-ink/85 focus:outline-none focus:ring-4 focus:ring-ink/15 disabled:cursor-not-allowed disabled:bg-ink/30 sm:h-12"
        >
          {submitLabel}
        </button>
      </form>

      {error ? (
        <p className="rounded-lg border border-clay/30 bg-[#FFF4EC] px-3 py-2 text-sm font-semibold text-ink">{error}</p>
      ) : null}

      <div className="grid gap-3">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate">Example prompts</p>
        <div className="flex flex-wrap gap-2">
          {examplePrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onExampleSelect(prompt)}
              className="rounded-full border border-line bg-white px-3 py-2 text-left text-xs font-semibold text-slate transition hover:border-clay hover:text-clay sm:text-sm"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AiSearchBox({
  loading,
  botMode,
  onBotModeChange,
  onParsed,
  onWatchSearch,
  onEventsSearch
}: Props) {
  const [query, setQuery] = useState("");
  const [watchFlowStep, setWatchFlowStep] = useState<WatchFlowStep>("categories");
  const [watchSubcategory, setWatchSubcategory] = useState<WatchSubcategory | null>(null);
  const [watchActiveSubcategory, setWatchActiveSubcategory] = useState<WatchSubcategory | null>(DEFAULT_WATCH_SUBCATEGORY);
  const genrePanelRef = useRef<HTMLDivElement | null>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (botMode !== "watch") {
      setWatchFlowStep("categories");
      setWatchSubcategory(null);
      setWatchActiveSubcategory(DEFAULT_WATCH_SUBCATEGORY);
    }
  }, [botMode]);

  useEffect(() => {
    if (botMode !== "watch" || watchFlowStep !== "categories" || !watchActiveSubcategory) return;
    if (!watchSubcategoryHasGenres(watchActiveSubcategory)) return;

    genrePanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [botMode, watchActiveSubcategory, watchFlowStep]);

  function handleModeSelect(mode: KoiBotMode) {
    onBotModeChange(mode);
    setError("");
    setQuery("");
    if (mode === "watch") {
      setWatchFlowStep("categories");
      setWatchSubcategory(null);
      setWatchActiveSubcategory(DEFAULT_WATCH_SUBCATEGORY);
    }
  }

  function handleWatchSubcategorySelect(subcategory: WatchSubcategory) {
    setWatchActiveSubcategory(subcategory);
    setError("");

    if (watchSubcategoryHasGenres(subcategory)) {
      setWatchSubcategory(null);
      setQuery("");
      return;
    }

    setWatchSubcategory(subcategory);
    setWatchFlowStep("search");
    setQuery("");
  }

  function handleWatchGenreSelect(subcategory: WatchSubcategory, option: WatchGenreOption) {
    if (loading || parsing) return;

    setWatchActiveSubcategory(subcategory);
    setWatchSubcategory(subcategory);
    setQuery(option.query);
    setWatchFlowStep("search");
    setError("");
    onWatchSearch(option.query, subcategory);
  }

  function backToWatchCategories() {
    setWatchFlowStep("categories");
    setWatchSubcategory(null);
    setWatchActiveSubcategory(watchSubcategory ?? DEFAULT_WATCH_SUBCATEGORY);
    setQuery("");
    setError("");
  }

  async function runSearch(searchQuery: string, mode: KoiBotMode = botMode) {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setError(
        mode === "watch"
          ? "Try a sentence like: Funny movies like Superbad"
          : mode === "events"
            ? "Try a sentence like: Any comedy shows near Philly this weekend?"
            : "Try a sentence like: Find coffee near Hoboken with easy parking."
      );
      return;
    }

    if (loading || parsing) return;

    setQuery(trimmed);
    setParsing(true);
    setError("");

    try {
      if (mode === "watch") {
        if (!watchSubcategory) return;
        onWatchSearch(trimmed, watchSubcategory);
        return;
      }

      const response = await fetch("/api/parse-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, botMode: mode })
      });
      const data = (await response.json()) as ParseSearchResult;
      if (!response.ok) throw new Error(data.error ?? "I could not understand that search.");

      if (mode === "events" || data.botMode === "events") {
        onEventsSearch(trimmed);
        return;
      }

      if (!data.form) throw new Error(data.error ?? "I could not understand that search.");
      onParsed(data.form);
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : "I could not understand that search.");
    } finally {
      setParsing(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runSearch(query);
  }

  const busy = loading || parsing;
  const submitLabel = parsing
    ? "Understanding..."
    : loading
      ? botMode === "watch"
        ? "Finding watch picks..."
        : botMode === "events"
          ? "Finding events..."
          : "Finding places..."
      : BRAND.askLabel;

  const searchPanelProps: SearchPanelProps = {
    query,
    error,
    busy,
    onQueryChange: (value) => {
      setQuery(value);
      if (error) setError("");
    },
    onSubmit: handleSubmit,
    onExampleSelect: (prompt) => {
      setQuery(prompt);
      if (error) setError("");
      if (botMode === "watch" && watchSubcategory && watchFlowStep === "search") {
        onWatchSearch(prompt, watchSubcategory);
      }
    },
    submitLabel,
    placeholder:
      botMode === "events"
        ? EVENTS_PLACEHOLDER
        : `${BRAND.askLabel} what you're looking for…`,
    examplePrompts: botMode === "events" ? EVENTS_EXAMPLE_PROMPTS : PLACE_EXAMPLE_PROMPTS
  };

  return (
    <section id="ask-koi" className="w-full min-w-0 scroll-mt-24 rounded-lg border border-line bg-paper p-5 shadow-soft sm:p-7" aria-labelledby="ai-search-title">
      <div className="mb-5">
        <p className="text-sm font-black uppercase tracking-[0.14em] text-clay">{BRAND.askLabel}</p>
        <h2 id="ai-search-title" className="mt-2 text-2xl font-black tracking-tight text-ink sm:text-3xl">
          Tell {BRAND.name} what you want to find.
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate">{NEUTRAL_SUBHEADLINE}</p>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {BOT_MODES.map((mode) => {
          const selected = botMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => handleModeSelect(mode.id)}
              className={`rounded-lg border px-4 py-4 text-left transition focus:outline-none focus:ring-4 focus:ring-clay/10 sm:py-5 ${
                selected
                  ? "border-clay bg-[#FFF4EC] shadow-[inset_0_0_0_1px_rgba(214,90,46,0.12)]"
                  : "border-line bg-white hover:border-clay/40"
              }`}
              aria-pressed={selected}
            >
              <p className="text-sm font-black text-ink sm:text-base">{mode.title}</p>
              <p className="mt-1 text-xs leading-5 text-slate sm:text-sm">{mode.description}</p>
            </button>
          );
        })}
      </div>

      <div key={botMode === "watch" ? `watch-${watchFlowStep}` : botMode} className="grid gap-5 border-t border-line/70 pt-5">
        {botMode === "places" ? (
          <div className="grid gap-2">
            <h3 className="text-lg font-black text-ink">Find a place to meet</h3>
            <p className="text-sm leading-6 text-slate">
              Tell {BRAND.name} where you&apos;re coming from and what kind of spot you want — nearby or halfway between two people.
            </p>
            <SearchPanel {...searchPanelProps} />
          </div>
        ) : null}

        {botMode === "events" ? (
          <div className="grid gap-2">
            <h3 className="text-lg font-black text-ink">Find local events</h3>
            <p className="text-sm leading-6 text-slate">
              Sports, concerts, festivals, and happenings near you. Include a location in your ask, or use classic search below.
            </p>
            <SearchPanel {...searchPanelProps} />
          </div>
        ) : null}

        {botMode === "watch" && watchFlowStep === "categories" ? (
          <div className="grid gap-4">
            <div>
              <h3 className="text-lg font-black text-ink">What do you want to watch?</h3>
              <p className="mt-1 text-sm leading-6 text-slate">
                Pick a lane, then choose a genre — just like picking a restaurant type under Food.
              </p>
            </div>
            <WatchBrowseSelector
              genrePanelRef={genrePanelRef}
              activeSubcategory={watchActiveSubcategory}
              selectedGenreQuery={query}
              busy={busy}
              onSubcategorySelect={handleWatchSubcategorySelect}
              onGenreSelect={handleWatchGenreSelect}
            />
          </div>
        ) : null}

        {botMode === "watch" && watchFlowStep === "search" && watchSubcategory ? (
          <div className="grid gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-black text-ink">{getWatchSubcategoryLabel(watchSubcategory)}</h3>
                <p className="mt-1 text-sm leading-6 text-slate">{getWatchSubcategoryDescription(watchSubcategory)}</p>
              </div>
              <FlowBackButton label="Back to watch categories" onClick={backToWatchCategories} />
            </div>
            <SearchPanel
              {...searchPanelProps}
              placeholder={WATCH_PLACEHOLDER}
              examplePrompts={WATCH_PROMPTS_BY_SUBCATEGORY[watchSubcategory]}
            />
          </div>
        ) : null}
      </div>

      {botMode !== "watch" ? (
        <p className="mt-5 text-xs font-semibold leading-5 text-slate">Prefer controls? Use classic search underneath.</p>
      ) : null}
    </section>
  );
}
