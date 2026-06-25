"use client";

import type { PlaceSuggestion } from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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

type MenuRect = {
  top: number;
  left: number;
  width: number;
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
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [menuRect, setMenuRect] = useState<MenuRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateMenuRect = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    const rect = input.getBoundingClientRect();
    setMenuRect({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width
    });
  }, []);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2 || placeId) {
      setSuggestions([]);
      setStatus("");
      setLoading(false);
      return;
    }

    const currentRequest = ++requestId.current;
    setLoading(true);
    setStatus("");
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/place-autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: query })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Location search failed.");
        if (currentRequest === requestId.current) {
          setSuggestions(data.suggestions ?? []);
          setLoading(false);
          setStatus(data.suggestions?.length ? "" : "No matches — keep typing or try a city or ZIP.");
          setOpen(true);
        }
      } catch (fetchError) {
        if (currentRequest === requestId.current) {
          setSuggestions([]);
          setLoading(false);
          setStatus(fetchError instanceof Error ? fetchError.message : "Location search failed.");
          setOpen(true);
        }
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [placeId, value]);

  useEffect(() => {
    if (!open || (!suggestions.length && !loading && !status)) {
      setMenuRect(null);
      return;
    }

    updateMenuRect();
    const handleLayout = () => updateMenuRect();
    window.addEventListener("scroll", handleLayout, true);
    window.addEventListener("resize", handleLayout);
    return () => {
      window.removeEventListener("scroll", handleLayout, true);
      window.removeEventListener("resize", handleLayout);
    };
  }, [loading, open, status, suggestions.length, updateMenuRect]);

  function selectSuggestion(suggestion: PlaceSuggestion) {
    onChange(suggestion.text, suggestion.placeId);
    setSuggestions([]);
    setOpen(false);
    setStatus("");
    setLoading(false);
    setMenuRect(null);
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
    setLoading(false);
    setMenuRect(null);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  const showMenu = open && mounted && menuRect && (loading || suggestions.length > 0 || Boolean(status));

  return (
    <div className="grid gap-1.5">
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
          role="combobox"
          aria-expanded={Boolean(showMenu)}
          aria-autocomplete="list"
          aria-controls={showMenu ? inputId(label, placeholder) + "-listbox" : undefined}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onChange={(event) => {
            onChange(event.target.value, undefined);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            updateMenuRect();
          }}
          placeholder={placeholder}
          className={inputClassName}
          autoComplete="off"
        />
        {value ? (
          <button
            type="button"
            aria-label="Clear location"
            onClick={clearLocation}
            className="absolute right-2 top-1/2 z-10 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full border border-line bg-white text-base font-black leading-none text-slate transition hover:border-clay hover:text-clay focus:outline-none focus:ring-4 focus:ring-clay/10"
          >
            ×
          </button>
        ) : null}
      </div>
      {placeId ? <p className={selectedClassName}>Address selected</p> : null}
      {error ? <p className="text-xs font-semibold text-events">{error}</p> : null}
      {!showMenu && status && !placeId ? <p className={statusClassName}>{status}</p> : null}
      {showMenu
        ? createPortal(
            <div
              id={inputId(label, placeholder) + "-listbox"}
              role="listbox"
              className="overflow-hidden rounded-lg border border-line bg-white shadow-[0_16px_40px_rgba(10,19,35,0.18)]"
              style={{
                position: "fixed",
                top: menuRect.top,
                left: menuRect.left,
                width: menuRect.width,
                zIndex: 9999
              }}
            >
              {loading ? (
                <p className="px-3 py-2.5 text-sm font-semibold text-slate">Searching locations…</p>
              ) : null}
              {!loading && suggestions.length
                ? suggestions.map((suggestion) => (
                    <button
                      key={suggestion.placeId}
                      type="button"
                      role="option"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectSuggestion(suggestion)}
                      className="grid w-full gap-0.5 border-b border-line px-3 py-2.5 text-left last:border-b-0 hover:bg-sky"
                    >
                      <span className="text-sm font-bold text-ink">{suggestion.mainText}</span>
                      {suggestion.secondaryText ? (
                        <span className="text-xs font-medium text-slate">{suggestion.secondaryText}</span>
                      ) : null}
                    </button>
                  ))
                : null}
              {!loading && !suggestions.length && status ? (
                <p className="px-3 py-2.5 text-sm font-semibold text-slate">{status}</p>
              ) : null}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

function inputId(label: string, placeholder: string) {
  const seed = label.trim() || placeholder.trim() || "address";
  return `address-${seed.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}
