"use client";

import {
  KOI_ROTATING_EXAMPLES,
  type KoiCapabilityExample
} from "@/lib/koiCapabilityExamples";
import type { SearchHalfwayRequest, VenueCategory, WatchSubcategory } from "@/lib/types";
import { useEffect, useState } from "react";

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

const QUICK_CHIPS: QuickChip[] = [
  { label: "Restaurants", query: "Restaurants near me tonight", category: "restaurant" },
  { label: "Drinks", query: "Cocktail bars near me tonight", category: "cocktail_bars" },
  { label: "Coffee", query: "Coffee near me", category: "coffee" },
  { label: "Events", query: "Events near me this weekend", category: "events" },
  {
    label: "Watch",
    query: "What should I watch tonight?",
    category: "custom",
    watchSubcategory: "movies"
  },
  { label: "Near Me", query: "Best places near me", category: "restaurant" },
  { label: "Halfway", query: "Best sushi halfway between Blue Bell and Manayunk", category: "restaurant" }
];

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
  const [activeIndex, setActiveIndex] = useState(0);
  const activeExample = KOI_ROTATING_EXAMPLES[activeIndex] ?? KOI_ROTATING_EXAMPLES[0];
  const refinements = contextualRefinements(form);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % KOI_ROTATING_EXAMPLES.length);
    }, 4300);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="grid gap-3" aria-label="Search suggestions">
      <button
        type="button"
        disabled={busy}
        onClick={() => onPickExample(activeExample, onPickQuery)}
        className="group flex min-w-0 items-center gap-3 rounded-[16px] border border-koi/30 bg-koi/12 px-3.5 py-3 text-left text-white shadow-[0_10px_28px_rgba(255,90,0,0.12)] transition hover:border-koi/55 hover:bg-koi/18 focus:outline-none focus:ring-4 focus:ring-koi/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-lg" aria-hidden="true">
          {activeExample.icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-black uppercase tracking-[0.15em] text-koi">Try this</span>
          <span className="mt-0.5 block truncate text-sm font-bold sm:text-base">{activeExample.label}</span>
        </span>
      </button>

      <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Quick start categories">
        {QUICK_CHIPS.map((chip) => (
          <AssistChip key={chip.label} chip={chip} busy={busy} onPickQuery={onPickQuery} />
        ))}
      </div>

      {refinements.length ? (
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Refine search">
          {refinements.map((chip) => (
            <AssistChip key={chip.label} chip={chip} busy={busy} subtle onPickQuery={onPickQuery} />
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
  onPickQuery
}: {
  chip: QuickChip;
  busy: boolean;
  subtle?: boolean;
  onPickQuery: (query: string, options?: PickQueryOptions) => void;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() =>
        onPickQuery(chip.query, {
          category: chip.category,
          watchSubcategory: chip.watchSubcategory
        })
      }
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

function onPickExample(
  example: KoiCapabilityExample,
  onPickQuery: (query: string, options?: PickQueryOptions) => void
) {
  onPickQuery(example.query, {
    category: categoryForExample(example),
    watchSubcategory: example.watchSubcategory
  });
}

function categoryForExample(example: KoiCapabilityExample): VenueCategory {
  if (example.accent === "events") return "events";
  if (example.accent === "watch") return "custom";
  return "restaurant";
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
      { label: "Outdoor", query: `Outdoor events near ${location} this weekend` }
    ];
  }

  if (category === "coffee") {
    return [
      { label: "Open Now", query: `Coffee open now near ${location}` },
      { label: "Quiet", query: `Quiet coffee shop near ${location}` },
      { label: "Outdoor Seating", query: `Coffee with outdoor seating near ${location}` }
    ];
  }

  if (category === "custom" && form.watchSubcategory) {
    return [
      { label: "Tonight", query: "What should I watch tonight?", watchSubcategory: "movies" },
      { label: "Date Night", query: "Date night movies to stream", watchSubcategory: "movies" },
      { label: "Funny", query: "Funny movies like Superbad", watchSubcategory: "movies" }
    ];
  }

  return BASE_REFINEMENTS.map((chip) => ({
    ...chip,
    query: restaurantQuery(chip.query)
  }));
}
