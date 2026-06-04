"use client";

import { CategorySelector } from "@/app/components/CategorySelector";
import type { SearchHalfwayRequest, VenueCategory } from "@/lib/types";
import { FormEvent } from "react";

type Props = {
  form: SearchHalfwayRequest;
  loading: boolean;
  onChange: (form: SearchHalfwayRequest) => void;
  onSubmit: () => void;
};

export function LocationForm({ form, loading, onChange, onSubmit }: Props) {
  function update<K extends keyof SearchHalfwayRequest>(key: K, value: SearchHalfwayRequest[K]) {
    onChange({ ...form, [key]: value });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-ink/10 bg-white/90 p-4 shadow-soft sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-ink/75">Person A</span>
          <input
            value={form.locationA}
            onChange={(event) => update("locationA", event.target.value)}
            placeholder="e.g. Hoboken, NJ"
            className="h-12 rounded-lg border border-ink/15 bg-paper px-3 text-base outline-none transition focus:border-moss focus:ring-4 focus:ring-moss/10"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-ink/75">Person B</span>
          <input
            value={form.locationB}
            onChange={(event) => update("locationB", event.target.value)}
            placeholder="e.g. Princeton, NJ"
            className="h-12 rounded-lg border border-ink/15 bg-paper px-3 text-base outline-none transition focus:border-moss focus:ring-4 focus:ring-moss/10"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-2">
        <span className="text-sm font-semibold text-ink/75">What are you meeting for?</span>
        <CategorySelector value={form.category} onChange={(category: VenueCategory) => update("category", category)} />
      </div>

      {form.category === "custom" ? (
        <label className="mt-4 grid gap-2">
          <span className="text-sm font-semibold text-ink/75">Custom search</span>
          <input
            value={form.customQuery ?? ""}
            onChange={(event) => update("customQuery", event.target.value)}
            placeholder="e.g. ramen, pickleball, live jazz"
            className="h-12 rounded-lg border border-ink/15 bg-paper px-3 text-base outline-none transition focus:border-moss focus:ring-4 focus:ring-moss/10"
          />
        </label>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-5 h-12 w-full rounded-lg bg-clay px-4 font-bold text-white shadow-soft transition hover:bg-clay/90 disabled:cursor-not-allowed disabled:bg-ink/30"
      >
        {loading ? "Finding fair options..." : "Find the fairest spots"}
      </button>
    </form>
  );
}
