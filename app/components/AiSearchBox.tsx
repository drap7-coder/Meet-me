"use client";

import type { KoiBotMode, SearchHalfwayRequest } from "@/lib/types";
import { WATCH_EVENTS_DESCRIPTION, WATCH_EVENTS_TITLE } from "@/lib/watchEvents";
import { FormEvent, useState } from "react";

type Props = {
  loading: boolean;
  onParsed: (form: SearchHalfwayRequest) => void;
  onWatchEvents: (query: string) => void;
};

type ParseSearchResult = {
  botMode?: KoiBotMode;
  form?: SearchHalfwayRequest;
  error?: string;
};

const BOT_MODES = [
  {
    id: "places" as const,
    title: "Find places",
    description: "Restaurants, coffee, parks, and halfway meetup spots."
  },
  {
    id: "watch_events" as const,
    title: WATCH_EVENTS_TITLE,
    description: WATCH_EVENTS_DESCRIPTION
  }
];

const EXAMPLE_QUERY = "Ask Koi what you're looking for…";
const PLACE_PROMPTS = [
  "Find coffee near Hoboken with easy parking.",
  "Find a coffee shop between Hoboken and Edison with easy parking.",
  "Where should we meet between NYC and Princeton?"
];
const WATCH_EVENTS_PROMPTS = [
  "What should I watch tonight?",
  "Where can I stream Interstellar?",
  "Any comedy shows near Philly this weekend?"
];

export function AiSearchBox({ loading, onParsed, onWatchEvents }: Props) {
  const [query, setQuery] = useState("");
  const [botMode, setBotMode] = useState<KoiBotMode>("places");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setError(
        botMode === "watch_events"
          ? "Try a sentence like: What should I watch tonight?"
          : "Try a sentence like: Find coffee near Hoboken with easy parking."
      );
      return;
    }

    setParsing(true);
    setError("");
    try {
      const response = await fetch("/api/parse-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, botMode })
      });
      const data = (await response.json()) as ParseSearchResult;
      if (!response.ok) throw new Error(data.error ?? "I could not understand that search.");

      if (data.botMode === "watch_events") {
        onWatchEvents(trimmed);
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

  const busy = loading || parsing;
  const examplePrompts = botMode === "watch_events" ? WATCH_EVENTS_PROMPTS : PLACE_PROMPTS;

  return (
    <section id="ask-koi" className="w-full min-w-0 scroll-mt-24 overflow-hidden rounded-lg border border-line bg-paper p-5 shadow-soft sm:p-7" aria-labelledby="ai-search-title">
      <div className="mb-4">
        <p className="text-sm font-black uppercase tracking-[0.14em] text-clay">Ask Koi</p>
        <h2 id="ai-search-title" className="mt-2 text-2xl font-black tracking-tight text-ink sm:text-3xl">
          Tell Koi what you want to find.
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate">
          Koi can help with places to meet or entertainment to watch and do. Pick a mode, then describe what you need in plain language.
        </p>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        {BOT_MODES.map((mode) => {
          const selected = botMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => {
                setBotMode(mode.id);
                if (error) setError("");
              }}
              className={`rounded-lg border px-4 py-3 text-left transition focus:outline-none focus:ring-4 focus:ring-clay/10 ${
                selected
                  ? "border-clay bg-[#FFF4EC] shadow-[inset_0_0_0_1px_rgba(214,90,46,0.12)]"
                  : "border-line bg-white hover:border-clay/40"
              }`}
              aria-pressed={selected}
            >
              <p className="text-sm font-black text-ink">{mode.title}</p>
              <p className="mt-1 text-xs leading-5 text-slate">{mode.description}</p>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3">
        <label className="grid gap-2">
          <span className="sr-only">Natural language search</span>
          <textarea
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (error) setError("");
            }}
            placeholder={EXAMPLE_QUERY}
            rows={3}
            className="min-h-24 resize-none rounded-lg border border-line bg-mint px-4 py-3 text-base text-ink outline-none transition placeholder:text-slate/70 focus:border-clay focus:ring-4 focus:ring-clay/10"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="h-11 rounded-full bg-ink px-5 font-bold text-white shadow-[0_10px_24px_rgba(17,24,39,0.14)] transition hover:bg-ink/85 focus:outline-none focus:ring-4 focus:ring-ink/15 disabled:cursor-not-allowed disabled:bg-ink/30 sm:h-12"
        >
          {parsing ? "Understanding..." : loading ? "Finding places..." : "Ask Koi"}
        </button>
      </form>

      {error ? (
        <p className="mt-3 rounded-lg border border-clay/30 bg-[#FFF4EC] px-3 py-2 text-sm font-semibold text-ink">
          {error}
        </p>
      ) : null}

      <div className="mt-4 grid gap-2">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate">Example prompts</p>
        <div className="flex flex-wrap gap-2">
          {examplePrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => {
                setQuery(prompt);
                if (error) setError("");
              }}
              className="rounded-full border border-line bg-white px-3 py-1.5 text-left text-xs font-semibold text-slate transition hover:border-clay hover:text-clay"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs font-semibold leading-5 text-slate">Prefer controls? Use classic search underneath.</p>
    </section>
  );
}
