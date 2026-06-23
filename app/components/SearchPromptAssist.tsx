"use client";

import { DEFAULT_SHOPPING_SUBCATEGORY } from "@/lib/shoppingBrowse";
import type { SearchHalfwayRequest, VenueCategory, WatchSubcategory } from "@/lib/types";
import type { ReactNode } from "react";
import { useState } from "react";

export type PickQueryOptions = {
  watchSubcategory?: WatchSubcategory;
  category?: VenueCategory;
  searchMode?: SearchHalfwayRequest["searchMode"];
};

type Props = {
  form: SearchHalfwayRequest;
  busy?: boolean;
  onPickQuery: (query: string, options?: PickQueryOptions) => void;
};

type WhatId = "restaurant" | "drinks" | "coffee" | "shopping" | "streaming";
type VibeId = "upscale" | "italian" | "sushi" | "steakhouse" | "date_night" | "outdoor";
type WhenId = "open_now" | "tonight";
type WhereId = "near" | "halfway";

type WhatDef = { id: WhatId; label: string; noun: string; category: VenueCategory };

const CONCIERGE_TAGLINE = "Tap chips to build your ask, or just type it.";

const WHAT_DEFS: WhatDef[] = [
  { id: "restaurant", label: "Restaurants", noun: "restaurants", category: "restaurant" },
  { id: "drinks", label: "Drinks", noun: "cocktail bars", category: "cocktail_bars" },
  { id: "coffee", label: "Coffee", noun: "coffee shops", category: "coffee" },
  { id: "shopping", label: "Shopping", noun: "shops", category: DEFAULT_SHOPPING_SUBCATEGORY.category },
  { id: "streaming", label: "Streaming", noun: "something to watch", category: "custom" }
];

const VIBE_DEFS: Array<{ id: VibeId; label: string }> = [
  { id: "upscale", label: "Upscale" },
  { id: "italian", label: "Italian" },
  { id: "sushi", label: "Sushi" },
  { id: "steakhouse", label: "Steakhouse" },
  { id: "date_night", label: "Date Night" },
  { id: "outdoor", label: "Outdoor Seating" }
];

const CUISINES: VibeId[] = ["italian", "sushi", "steakhouse"];

type BuilderState = {
  what: WhatId | null;
  vibes: Set<VibeId>;
  when: WhenId | null;
  where: WhereId;
};

export function SearchPromptAssist({ form, busy = false, onPickQuery }: Props) {
  const [state, setState] = useState<BuilderState>(() => ({
    what: null,
    vibes: new Set<VibeId>(),
    when: null,
    where: "near"
  }));

  function commit(next: BuilderState) {
    setState(next);
    const query = buildPromptQuery(next);
    if (!query) return;
    onPickQuery(query, {
      category: categoryFor(next),
      watchSubcategory: next.what === "streaming" ? "movies" : undefined,
      searchMode: next.where === "halfway" ? "midpoint" : "single"
    });
  }

  function pickWhat(id: WhatId) {
    const next: BuilderState =
      id === "streaming"
        ? { what: "streaming", vibes: new Set<VibeId>(), when: null, where: "near" }
        : { ...state, what: id, vibes: new Set(state.vibes) };
    commit(next);
  }

  function toggleVibe(id: VibeId) {
    const vibes = new Set(state.vibes);
    if (CUISINES.includes(id)) {
      const wasOn = vibes.has(id);
      CUISINES.forEach((cuisine) => vibes.delete(cuisine));
      if (!wasOn) vibes.add(id);
    } else if (vibes.has(id)) {
      vibes.delete(id);
    } else {
      vibes.add(id);
    }
    const what = state.what && state.what !== "streaming" ? state.what : "restaurant";
    commit({ ...state, what, vibes });
  }

  function toggleWhen(id: WhenId) {
    const when = state.when === id ? null : id;
    const what = state.what && state.what !== "streaming" ? state.what : "restaurant";
    commit({ ...state, what, when });
  }

  function setWhere(id: WhereId) {
    const what = state.what && state.what !== "streaming" ? state.what : "restaurant";
    commit({ ...state, what, where: id });
  }

  const isStreaming = state.what === "streaming";

  return (
    <section className="grid gap-2.5" aria-label="Prompt builder">
      <p className="px-0.5 text-sm font-semibold text-white/70">{CONCIERGE_TAGLINE}</p>

      <ChipGroup label="What">
        {WHAT_DEFS.map((def) => (
          <AssistChip
            key={def.id}
            label={def.label}
            busy={busy}
            variant="primary"
            selected={state.what === def.id}
            onPick={() => pickWhat(def.id)}
          />
        ))}
      </ChipGroup>

      <ChipGroup label="Vibe">
        {VIBE_DEFS.map((def) => (
          <AssistChip
            key={def.id}
            label={def.label}
            busy={busy || isStreaming}
            selected={!isStreaming && state.vibes.has(def.id)}
            onPick={() => toggleVibe(def.id)}
          />
        ))}
      </ChipGroup>

      <ChipGroup label="When / where">
        <AssistChip
          label="Near Me"
          busy={busy || isStreaming}
          selected={!isStreaming && state.where === "near"}
          onPick={() => setWhere("near")}
        />
        <AssistChip
          label="Open Now"
          busy={busy || isStreaming}
          selected={!isStreaming && state.when === "open_now"}
          onPick={() => toggleWhen("open_now")}
        />
        <AssistChip
          label="Tonight"
          busy={busy || isStreaming}
          selected={!isStreaming && state.when === "tonight"}
          onPick={() => toggleWhen("tonight")}
        />
        <AssistChip
          label="Halfway"
          busy={busy || isStreaming}
          selected={!isStreaming && state.where === "halfway"}
          onPick={() => setWhere(state.where === "halfway" ? "near" : "halfway")}
        />
      </ChipGroup>
    </section>
  );
}

function ChipGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-full text-[0.625rem] font-bold uppercase tracking-[0.18em] text-white/40 sm:w-[4.5rem] sm:shrink-0">
        {label}
      </span>
      {children}
    </div>
  );
}

function AssistChip({
  label,
  busy,
  variant = "neutral",
  selected = false,
  onPick
}: {
  label: string;
  busy: boolean;
  variant?: "primary" | "neutral";
  selected?: boolean;
  onPick: () => void;
}) {
  const tone =
    selected && variant === "primary"
      ? "border-koi bg-koi text-white shadow-[0_8px_18px_rgba(255,90,0,0.24)]"
      : selected
        ? "border-white/55 bg-white/15 text-white"
        : "border-white/14 bg-white/[0.06] text-white/75 hover:border-white/30 hover:bg-white/10";

  return (
    <button
      type="button"
      disabled={busy}
      onClick={onPick}
      aria-pressed={selected}
      className={`shrink-0 rounded-full border px-3.5 py-2 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-koi/15 disabled:cursor-not-allowed disabled:opacity-40 ${tone}`}
    >
      {label}
    </button>
  );
}

function categoryFor(state: BuilderState): VenueCategory {
  if (state.what === "streaming") return "custom";
  const cuisine = CUISINES.find((id) => state.vibes.has(id));
  if (cuisine === "italian") return "italian";
  if (cuisine === "sushi") return "sushi";
  if (cuisine === "steakhouse") return "steakhouse";
  const def = WHAT_DEFS.find((item) => item.id === state.what);
  return def?.category ?? "restaurant";
}

function buildPromptQuery(state: BuilderState): string {
  if (state.what === "streaming") return "What should I watch tonight?";

  const def = WHAT_DEFS.find((item) => item.id === state.what) ?? WHAT_DEFS[0];
  let noun = def.noun;
  const cuisine = CUISINES.find((id) => state.vibes.has(id));

  const prefixes: string[] = [];
  if (state.vibes.has("upscale")) prefixes.push("upscale");
  if (cuisine === "italian") prefixes.push("Italian");
  if (cuisine === "sushi") noun = "sushi restaurants";
  if (cuisine === "steakhouse") noun = "steakhouses";
  if (state.vibes.has("date_night")) prefixes.push("date night");

  const suffixes: string[] = [];
  if (state.vibes.has("outdoor")) suffixes.push("with outdoor seating");
  suffixes.push(state.where === "halfway" ? "halfway between us" : "near me");

  if (state.when === "open_now") suffixes.push("open now");
  else if (state.when === "tonight") suffixes.push("tonight");
  else if (!state.vibes.has("date_night") && (def.id === "restaurant" || def.id === "drinks")) {
    suffixes.push("tonight");
  }

  const phrase = [...prefixes, noun, ...suffixes].join(" ");
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}
