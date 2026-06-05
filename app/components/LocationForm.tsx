"use client";

import { CategorySelector } from "@/app/components/CategorySelector";
import type { PlaceSuggestion, SearchHalfwayRequest, VenueCategory } from "@/lib/types";
import { FormEvent, useEffect, useRef, useState } from "react";

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
        <LocationInput
          label="Person A"
          value={form.locationA}
          placeId={form.locationAPlaceId}
          placeholder="e.g. Hoboken, NJ"
          onChange={(locationA, locationAPlaceId) => onChange({ ...form, locationA, locationAPlaceId })}
        />
        <LocationInput
          label="Person B"
          value={form.locationB}
          placeId={form.locationBPlaceId}
          placeholder="e.g. Edison, NJ"
          onChange={(locationB, locationBPlaceId) => onChange({ ...form, locationB, locationBPlaceId })}
        />
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

function LocationInput({
  label,
  value,
  placeId,
  placeholder,
  onChange
}: {
  label: string;
  value: string;
  placeId?: string;
  placeholder: string;
  onChange: (value: string, placeId?: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const requestId = useRef(0);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2 || placeId) {
      setSuggestions([]);
      setStatus("");
      return;
    }

    const currentRequest = ++requestId.current;
    const timeout = window.setTimeout(async () => {
      try {
        setStatus("Searching locations...");
        const response = await fetch("/api/place-autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: query })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Location search failed.");
        if (currentRequest === requestId.current) {
          setSuggestions(data.suggestions ?? []);
          setStatus("");
          setOpen(true);
        }
      } catch (error) {
        if (currentRequest === requestId.current) {
          setSuggestions([]);
          setStatus(error instanceof Error ? error.message : "Location search failed.");
        }
      }
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [placeId, value]);

  function selectSuggestion(suggestion: PlaceSuggestion) {
    onChange(suggestion.text, suggestion.placeId);
    setSuggestions([]);
    setOpen(false);
    setStatus("");
  }

  return (
    <div className="relative grid gap-2">
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-ink/75">{label}</span>
        <input
          value={value}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onChange={(event) => {
            onChange(event.target.value, undefined);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="h-12 rounded-lg border border-ink/15 bg-paper px-3 text-base outline-none transition focus:border-moss focus:ring-4 focus:ring-moss/10"
        />
      </label>
      {placeId ? <p className="text-xs font-semibold text-moss">Using selected Google location</p> : null}
      {status ? <p className="text-xs font-semibold text-ink/55">{status}</p> : null}
      {open && suggestions.length ? (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-lg border border-ink/10 bg-white shadow-soft">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.placeId}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectSuggestion(suggestion)}
              className="grid w-full gap-0.5 border-b border-ink/5 px-3 py-2 text-left last:border-b-0 hover:bg-moss/8"
            >
              <span className="text-sm font-bold text-ink">{suggestion.mainText}</span>
              {suggestion.secondaryText ? (
                <span className="text-xs font-medium text-ink/55">{suggestion.secondaryText}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
