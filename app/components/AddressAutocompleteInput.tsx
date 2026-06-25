"use client";

import type { PlaceSuggestion } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

type Props = {
  label: string;
  value: string;
  placeId?: string;
  placeholder: string;
  error?: string;
  inputClassName?: string;
  labelClassName?: string;
  selectedClassName?: string;
  statusClassName?: string;
  onChange: (value: string, placeId?: string) => void;
  onClear?: () => void;
};

const defaultInputClass =
  "koi-field h-11 w-full px-4 pr-11 text-base outline-none transition sm:h-12";

export function AddressAutocompleteInput({
  label,
  value,
  placeId,
  placeholder,
  error = "",
  inputClassName = defaultInputClass,
  labelClassName = "text-sm font-bold text-ink",
  selectedClassName = "text-xs font-semibold text-clay",
  statusClassName = "text-xs font-semibold text-slate",
  onChange,
  onClear
}: Props) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
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
      } catch (fetchError) {
        if (currentRequest === requestId.current) {
          setSuggestions([]);
          setStatus(fetchError instanceof Error ? fetchError.message : "Location search failed.");
        }
      }
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [placeId, value]);

  function selectSuggestion(suggestion: PlaceSuggestion) {
    onChange(suggestion.text, suggestion.placeId);
    setSuggestions([]);
    setOpen(false);
    setStatus("");
  }

  function clearLocation() {
    if (onClear) {
      onClear();
    } else {
      onChange("", undefined);
    }
    setSuggestions([]);
    setOpen(false);
    setStatus("");
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <div className="relative grid gap-1.5">
      {label ? (
        <label htmlFor={inputId(label, placeholder)} className={labelClassName}>
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId(label, placeholder)}
          value={value}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onChange={(event) => {
            onChange(event.target.value, undefined);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={inputClassName}
          autoComplete="off"
        />
        {value ? (
          <button
            type="button"
            aria-label="Clear location"
            onClick={clearLocation}
            className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full border border-line bg-white text-base font-black leading-none text-slate transition hover:border-clay hover:text-clay focus:outline-none focus:ring-4 focus:ring-clay/10"
          >
            ×
          </button>
        ) : null}
      </div>
      {placeId ? <p className={selectedClassName}>Address selected</p> : null}
      {error ? <p className="text-xs font-semibold text-events">{error}</p> : null}
      {status ? <p className={statusClassName}>{status}</p> : null}
      {open && suggestions.length ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-line bg-white shadow-soft">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.placeId}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectSuggestion(suggestion)}
              className="grid w-full gap-0.5 border-b border-line px-3 py-2.5 text-left last:border-b-0 hover:bg-sky"
            >
              <span className="text-sm font-bold text-ink">{suggestion.mainText}</span>
              {suggestion.secondaryText ? (
                <span className="text-xs font-medium text-slate">{suggestion.secondaryText}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function inputId(label: string, placeholder: string) {
  const seed = label.trim() || placeholder.trim() || "address";
  return `address-${seed.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}
