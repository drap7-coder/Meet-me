"use client";

import type { PickQueryOptions } from "@/app/components/SearchPromptAssist";
import { useSearchPromptAssist } from "@/app/components/SearchPromptAssist";

type CategoryCard = {
  id: string;
  icon: string;
  title: string;
  description: string;
  tint: string;
  query: string;
  options?: PickQueryOptions;
  mode?: "streaming" | "local";
  localWhat?: "food" | "activities";
  where?: "halfway" | "near";
};

const HERO_BROWSE_CATEGORIES: CategoryCard[] = [
  {
    id: "halfway",
    icon: "📍",
    title: "Meet Halfway",
    description: "Find the fairest location for everyone.",
    tint: "from-koi/20 via-orange-500/10 to-transparent border-koi/30",
    query: "Dinner halfway between us",
    mode: "local",
    where: "halfway",
    options: { builderMode: "halfway", searchMode: "midpoint" }
  },
  {
    id: "restaurants",
    icon: "🍽️",
    title: "Restaurants",
    description: "Great places to eat near you.",
    tint: "from-emerald-500/15 via-teal-500/5 to-transparent border-emerald-400/25",
    query: "Restaurants near me",
    mode: "local",
    localWhat: "food",
    options: { category: "restaurant", builderMode: "near_me" }
  },
  {
    id: "watch",
    icon: "🎬",
    title: "What Should We Watch?",
    description: "See where movies and shows are streaming.",
    tint: "from-violet-500/20 via-indigo-500/10 to-transparent border-violet-400/30",
    query: "What should we watch tonight?",
    mode: "streaming",
    options: { category: "custom", watchSubcategory: "movies" }
  },
  {
    id: "things-to-do",
    icon: "🎟️",
    title: "Things to Do",
    description: "Events, festivals, markets, and more.",
    tint: "from-sky-500/20 via-blue-500/10 to-transparent border-sky-400/30",
    query: "Things to do near me this weekend",
    mode: "local",
    localWhat: "activities",
    options: { category: "activities", builderMode: "near_me" }
  }
];

type Props = {
  busy?: boolean;
  onSelect: (query: string, options?: PickQueryOptions) => void;
};

export function HeroBrowseCategories({ busy = false, onSelect }: Props) {
  const { pickMode, pickLocalWhat, setWhere } = useSearchPromptAssist();

  function handleSelect(card: CategoryCard) {
    if (card.mode === "streaming") {
      pickMode("streaming");
    } else {
      pickMode("local");
      if (card.where) setWhere(card.where);
      if (card.localWhat) pickLocalWhat(card.localWhat);
    }
    onSelect(card.query, card.options);
  }

  return (
    <section className="grid gap-2.5" aria-label="Browse by category">
      <p className="px-0.5 text-[0.625rem] font-bold uppercase tracking-[0.18em] text-white/45">Browse by category</p>
      <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
        {HERO_BROWSE_CATEGORIES.map((card) => (
          <button
            key={card.id}
            type="button"
            disabled={busy}
            onClick={() => handleSelect(card)}
            className={`snap-start shrink-0 w-[9.25rem] rounded-[18px] border bg-gradient-to-br p-3.5 text-left transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-koi/15 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto ${card.tint}`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white/10 text-xl leading-none ring-1 ring-white/10">
              {card.icon}
            </span>
            <span className="mt-3 block text-sm font-bold leading-snug text-white">{card.title}</span>
            <span className="mt-1 block text-xs font-medium leading-5 text-white/60">{card.description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
