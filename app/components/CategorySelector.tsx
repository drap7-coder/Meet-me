"use client";

import { CATEGORIES } from "@/lib/categories";
import type { VenueCategory } from "@/lib/types";

type Props = {
  value: VenueCategory;
  onChange: (category: VenueCategory) => void;
};

export function CategorySelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {CATEGORIES.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onChange(category.id)}
          className={`rounded-lg border px-3 py-2.5 text-center text-sm font-bold transition ${
            value === category.id
              ? "border-clay bg-clay text-white shadow-glow"
              : "border-line bg-mint text-ink hover:border-clay/40 hover:bg-sky"
          }`}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
