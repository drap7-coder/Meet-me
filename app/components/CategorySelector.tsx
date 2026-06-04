"use client";

import { CATEGORIES } from "@/lib/categories";
import type { VenueCategory } from "@/lib/types";

type Props = {
  value: VenueCategory;
  onChange: (category: VenueCategory) => void;
};

export function CategorySelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {CATEGORIES.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onChange(category.id)}
          className={`rounded-lg border px-3 py-3 text-left text-sm font-semibold transition ${
            value === category.id
              ? "border-moss bg-moss text-white shadow-soft"
              : "border-ink/10 bg-white/80 text-ink hover:border-moss/40"
          }`}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
