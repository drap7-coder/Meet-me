"use client";

import type { SearchHalfwayRequest, VenueCategory, WatchSubcategory } from "@/lib/types";
import { useState } from "react";

export type PickQueryOptions = {
  watchSubcategory?: WatchSubcategory;
  category?: VenueCategory;
};

type Props = {
  form: SearchHalfwayRequest;
  busy?: boolean;
  onPickQuery: (query: string, options?: PickQueryOptions) => void;
};

type QuickChip = {
  label: string;
  query: string;
  category?: VenueCategory;
  watchSubcategory?: WatchSubcategory;
};

const CONCIERGE_TAGLINE = "Ask about dinner, drinks, or events.";

const QUICK_CHIPS: QuickChip[] = [
  { label: "Restaurants", query: "Restaurants near me tonight", category: "restaurant" },
  { label: "Drinks", query: "Cocktail bars near me tonight", category: "cocktail_bars" },
  { label: "Coffee", query: "Coffee near me", category: "coffee" },
  { label: "Events", query: "Events near me this weekend", category: "events" },
  { label: "Near Me", query: "Best places near me", category: "restaurant" }
];

const HALFWAY_REFINEMENT: QuickChip = {
  label: "Halfway",
  query: "Best sushi halfway between Blue Bell and Manayunk",
  category: "restaurant"
};

const BASE_REFINEMENTS: QuickChip[] = [
  { label: "Upscale", query: "Find an upscale restaurant near me tonight" },
  { label: "Open Now", query: "Restaurants open now near me" },
  { label: "Tonight", query: "Dinner near me tonight" },
  { label: "Date Night", query: "Fun date night this Friday" },
  { label: "Outdoor Seating", query: "Restaurants with outdoor seating near me" },
  { label: "Italian", query: "Italian restaurant near me tonight" },
  { label: "Sushi", query: "Best sushi near me tonight" },
  { label: "Steakhouse", query: "Upscale steakhouse near me tonight" }
];

export function SearchPromptAssist({ form, busy = false, onPickQuery }: Props) {
  const [categorySelected, setCategorySelected] = useState(false);
  const refinements = contextualRefinements(form);

  function pickCategory(chip: QuickChip) {
    setCategorySelected(true);
    onPickQuery(chip.query, { category: chip.category, watchSubcategory: chip.watchSubcategory });
  }

  function pickRefinement(chip: QuickChip) {
    onPickQuery(chip.query, { category: chip.category, watchSubcategory: chip.watchSubcategory });
  }

  return (
    <section className="grid gap-3" aria-label="Search suggestions">
      <p className="px-0.5 text-sm font-semibold text-white/70">{CONCIERGE_TAGLINE}</p>

      <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Quick start categories">
        {QUICK_CHIPS.map((chip) => (
          <AssistChip key={chip.label} chip={chip} busy={busy} onPick={() => pickCategory(chip)} />
        ))}
      </div>

      {categorySelected && refinements.length ? (
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Refine search">
          {refinements.map((chip) => (
            <AssistChip key={chip.label} chip={chip} busy={busy} subtle onPick={() => pickRefinement(chip)} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function AssistChip({
  chip,
  busy,
  subtle = false,
  onPick
}: {
  chip: QuickChip;
  busy: boolean;
  subtle?: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onPick}
      className={`shrink-0 rounded-full border px-3.5 py-2 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-koi/15 disabled:cursor-not-allowed disabled:opacity-60 ${
        subtle
          ? "border-white/12 bg-white/[0.055] text-white/78 hover:border-koi/45 hover:bg-koi/10"
          : "border-white/16 bg-white/[0.08] text-white hover:border-koi/55 hover:bg-koi/14"
      }`}
    >
      {chip.label}
    </button>
  );
}

function contextualRefinements(form: SearchHalfwayRequest): QuickChip[] {
  const location = form.locationA.trim() || "me";
  const restaurantQuery = (query: string) => query.replace("near me", `near ${location}`);
  const category = form.category;

  if (category === "events") {
    return [
      { label: "Tonight", query: `Events near ${location} tonight` },
      { label: "Date Night", query: `Fun date night near ${location} this Friday` },
      { label: "Live Music", query: `Live music near ${location} tonight` },
      { label: "Outdoor", query: `Outdoor events near ${location} this weekend` },
      HALFWAY_REFINEMENT
    ];
  }

  if (category === "coffee") {
    return [
      { label: "Open Now", query: `Coffee open now near ${location}` },
      { label: "Quiet", query: `Quiet coffee shop near ${location}` },
      { label: "Outdoor Seating", query: `Coffee with outdoor seating near ${location}` },
      HALFWAY_REFINEMENT
    ];
  }

  if (category === "custom" && form.watchSubcategory) {
    return [
      { label: "Tonight", query: "What should I watch tonight?", watchSubcategory: "movies" },
      { label: "Date Night", query: "Date night movies to stream", watchSubcategory: "movies" },
      { label: "Funny", query: "Funny movies like Superbad", watchSubcategory: "movies" }
    ];
  }

  return [
    ...BASE_REFINEMENTS.map((chip) => ({
      ...chip,
      query: restaurantQuery(chip.query)
    })),
    HALFWAY_REFINEMENT
  ];
}
