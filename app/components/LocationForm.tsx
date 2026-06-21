"use client";

import { CategorySelector } from "@/app/components/CategorySelector";
import { EventsCategorySelector } from "@/app/components/EventsCategorySelector";
import { WatchSubcategorySelector, DEFAULT_WATCH_SUBCATEGORY } from "@/app/components/WatchSubcategorySelector";
import { Logo } from "@/app/components/Logo";
import { getPrimaryCategoryId } from "@/lib/categories";
import { KOI_EXAMPLE } from "@/lib/koiExamples";
import { PREFERENCES } from "@/lib/preferences";
import type { KoiBotMode, LatLng, PlaceSuggestion, Preference, SearchHalfwayRequest, VenueCategory, WatchSubcategory } from "@/lib/types";
import { copyTextToClipboard, shareWithFallback } from "@/lib/share";
import { BRAND } from "@/src/config/branding";
import { FormEvent, useEffect, useRef, useState } from "react";

type Props = {
  form: SearchHalfwayRequest;
  loading: boolean;
  discoveryMode?: KoiBotMode;
  variant?: "full" | "location-only";
  submitLabel?: string;
  onChange: (form: SearchHalfwayRequest) => void;
  onSubmit: () => void;
};

export function LocationForm({
  form,
  loading,
  discoveryMode = "places",
  variant = "full",
  submitLabel,
  onChange,
  onSubmit
}: Props) {
  const locationOnly = variant === "location-only";
  const [inviteStatus, setInviteStatus] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [showInviteTools, setShowInviteTools] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const inviteText = "Want to meet in the middle? Add your starting point and Koi will find somewhere that works for both of us.";

  useEffect(() => {
    setInviteUrl(window.location.origin);
  }, []);

  function update<K extends keyof SearchHalfwayRequest>(key: K, value: SearchHalfwayRequest[K]) {
    onChange({ ...form, [key]: value });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  async function shareInvite() {
    const url = inviteUrl || window.location.origin;
    setInviteUrl(url);
    setShowInviteTools(true);

    const result = await shareWithFallback({ title: BRAND.name, text: inviteText, url });
    if (result === "shared") {
      setInviteStatus("");
      setShowInviteTools(false);
    }
    if (result === "copied") setInviteStatus("Invite link copied.");
    if (result === "email") setInviteStatus("Email draft opened.");
    if (result === "cancelled") setInviteStatus("Invite was cancelled.");
  }

  async function copyInviteLink() {
    const url = inviteUrl || window.location.origin;
    setInviteUrl(url);
    const copied = await copyTextToClipboard(`${inviteText}\n\n${url}`);
    setInviteStatus(copied ? "Invite link copied." : "Copy failed. You can select the link below.");
  }

  function togglePreference(preference: Preference) {
    const current = form.preferences ?? [];
    const preferences = current.includes(preference)
      ? current.filter((item) => item !== preference)
      : [...current, preference];
    onChange({ ...form, preferences });
  }

  const [watchSubcategory, setWatchSubcategory] = useState<WatchSubcategory>(
    form.watchSubcategory ?? DEFAULT_WATCH_SUBCATEGORY
  );
  const activePrimaryId = getPrimaryCategoryId(form.category);
  const isWatchMode = discoveryMode === "watch";
  const isEventsMode = discoveryMode === "events";
  const needsLocation = !isWatchMode;
  const submitCopy = isWatchMode
    ? "Find streaming picks"
    : isEventsMode
      ? "Find events"
      : getSubmitCopy(activePrimaryId);
  const searchMode = form.searchMode ?? "midpoint";

  return (
    <form onSubmit={handleSubmit} className="w-full min-w-0 overflow-hidden rounded-lg border border-line bg-paper p-5 shadow-soft sm:p-7">
      <div className="mb-6">
        <Logo size="sm" />
        <h2 className="mt-2 text-2xl font-black tracking-tight text-ink sm:text-3xl">
          {locationOnly
            ? "Where are you?"
            : isWatchMode
              ? "What do you want to watch?"
              : isEventsMode
                ? "Where should Koi look for events?"
                : "Where should Koi look?"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate">
          {locationOnly
            ? "Add one place for nearby results, or two when you want a fair midpoint. Tap Use my location if that is easier."
            : isWatchMode
              ? "No location needed — pick a watch category and describe what you want to stream or watch tonight."
              : isEventsMode
                ? "Events are location-based. One place is enough for nearby ideas. Add a second place when you want Koi to balance the trip."
                : "One place is enough for nearby ideas. Add a second place when you want Koi to balance the trip."}
        </p>
      </div>

      {needsLocation ? (
        <>
      <div className="mb-4 rounded-full border border-line bg-mint p-1">
        <div className="grid grid-cols-2 gap-1">
          {[
            { id: "single", label: "One Location" },
            { id: "midpoint", label: "Two Locations" }
          ].map((mode) => {
            const selected = searchMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                aria-pressed={selected}
                onClick={() =>
                  onChange({
                    ...form,
                    searchMode: mode.id as SearchHalfwayRequest["searchMode"],
                    ...(mode.id === "single" ? { locationB: "", locationBPlaceId: undefined, locationBCoordinates: undefined } : {})
                  })
                }
                className={`h-10 rounded-full px-3 text-sm font-black transition ${
                  selected
                    ? "bg-clay text-white shadow-[0_8px_18px_rgba(57,255,20,0.18)]"
                    : "text-ink hover:bg-white"
                }`}
              >
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className={`grid gap-4 ${searchMode === "midpoint" ? "sm:grid-cols-2" : ""}`}>
        <LocationInput
          label={searchMode === "single" ? "Search near" : "Location 1"}
          value={form.locationA}
          placeId={form.locationAPlaceId}
          placeholder={searchMode === "single" ? "Enter a city, town, address, or ZIP" : `e.g. ${KOI_EXAMPLE.locationA}, NJ`}
          error={locationError}
          isLocating={isLocating}
          onUseCurrentLocation={useCurrentLocation}
          onChange={(locationA, locationAPlaceId) => {
            setLocationError("");
            onChange({ ...form, locationA, locationAPlaceId, locationACoordinates: undefined });
          }}
          onClear={() => {
            setLocationError("");
            onChange({ ...form, locationA: "", locationAPlaceId: undefined, locationACoordinates: undefined });
          }}
        />
        {searchMode === "midpoint" ? (
          <LocationInput
            label="Location 2"
            value={form.locationB}
            placeId={form.locationBPlaceId}
            placeholder={`e.g. ${KOI_EXAMPLE.locationB}, NJ`}
            onChange={(locationB, locationBPlaceId) => onChange({ ...form, locationB, locationBPlaceId, locationBCoordinates: undefined })}
            onClear={() => onChange({ ...form, locationB: "", locationBPlaceId: undefined, locationBCoordinates: undefined })}
          />
        ) : null}
      </div>
        </>
      ) : null}

      {!locationOnly ? (
      <>
      <div className="mt-5 grid gap-3">
        <div>
          <span className="text-sm font-bold text-ink">
            {isWatchMode ? "Choose what to watch" : isEventsMode ? "Choose the kind of event" : "Choose the kind of meet-up"}
          </span>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate">
            {isWatchMode
              ? "Pick a lane, then describe what you want in your own words."
              : "Start broad, then pick the exact style you want."}
          </p>
        </div>
        {isWatchMode ? (
          <>
            <WatchSubcategorySelector
              value={watchSubcategory}
              onChange={(subcategory) => {
                setWatchSubcategory(subcategory);
                onChange({ ...form, watchSubcategory: subcategory });
              }}
            />
            <label className="grid gap-2">
              <span className="text-sm font-bold text-ink">Your watch ask</span>
              <input
                value={form.customQuery ?? ""}
                onChange={(event) => onChange({ ...form, customQuery: event.target.value })}
                placeholder="Ask Koi what you want to watch…"
                className="h-11 rounded-lg border border-line bg-mint px-4 text-base outline-none transition focus:border-clay focus:ring-4 focus:ring-clay/10 sm:h-12"
              />
            </label>
          </>
        ) : isEventsMode ? (
          <EventsCategorySelector
            value={form.customQuery ?? ""}
            onChange={(option) => onChange({ ...form, customQuery: option.query, category: "events" })}
          />
        ) : (
          <CategorySelector
            value={form.category}
            mode={form.meetupMode}
            onChange={(category: VenueCategory) => update("category", category)}
          />
        )}
      </div>

      {!isWatchMode ? (
      <div className="mt-4 grid gap-3 rounded-[18px] border border-line/80 bg-white/70 p-3 sm:p-4">
        <div>
          <span className="text-sm font-bold text-ink">Make it easier</span>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate">
            Optional — choose what matters most.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {PREFERENCES.map((preference) => {
            const selected = Boolean(form.preferences?.includes(preference.id));
            return (
              <button
                key={preference.id}
                type="button"
                title={preference.helper}
                onClick={() => togglePreference(preference.id)}
                className={`rounded-full border px-3 py-2 text-center text-sm font-bold transition ${
                  selected
                    ? "border-clay bg-clay text-white shadow-[0_8px_18px_rgba(57,255,20,0.18)]"
                    : "border-line bg-white text-ink hover:border-clay/40 hover:bg-sky"
                }`}
              >
                {preference.label}
              </button>
            );
          })}
        </div>
      </div>
      ) : null}

      {form.category === "custom" && !isWatchMode && !isEventsMode ? (
        <label className="mt-4 grid gap-2">
          <span className="text-sm font-bold text-ink">Something different</span>
          <input
            value={form.customQuery ?? ""}
            onChange={(event) => update("customQuery", event.target.value)}
            placeholder="e.g. ramen, pickleball, live jazz"
            className="h-11 rounded-lg border border-line bg-mint px-4 text-base outline-none transition focus:border-clay focus:ring-4 focus:ring-clay/10 sm:h-12"
          />
        </label>
      ) : null}
      </>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 h-11 w-full rounded-full bg-clay px-5 font-bold text-white shadow-[0_10px_24px_rgba(46,204,64,0.24)] transition hover:bg-[#24A832] focus:outline-none focus:ring-4 focus:ring-clay/25 disabled:cursor-not-allowed disabled:bg-ink/30 sm:h-12"
      >
        {loading
          ? `${(submitLabel ?? submitCopy).replace("Find", "Finding")}...`
          : submitLabel ?? submitCopy}
      </button>
      {!locationOnly ? (
      <button
        type="button"
        onClick={shareInvite}
        className="mt-3 h-10 w-full rounded-full border border-line bg-paper px-5 text-sm font-bold text-ink transition hover:border-clay hover:text-clay focus:outline-none focus:ring-4 focus:ring-ink/10"
      >
        Invite someone to plan with you
      </button>
      ) : null}
      {showInviteTools ? (
        <div className="mt-3 rounded-lg border border-line bg-mint p-3">
          <p className="text-xs font-semibold leading-5 text-slate">Send this link to invite someone to plan with you.</p>
          <input
            readOnly
            value={inviteUrl}
            onFocus={(event) => event.currentTarget.select()}
            className="mt-2 h-10 w-full rounded-lg border border-line bg-white px-3 text-sm font-semibold text-ink outline-none"
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={copyInviteLink}
              className="h-10 rounded-lg bg-ink px-3 text-sm font-bold text-white transition hover:bg-ink/85"
            >
              Copy link
            </button>
            <a
              href={`mailto:?subject=${encodeURIComponent(BRAND.name)}&body=${encodeURIComponent(`${inviteText}\n\n${inviteUrl}`)}`}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-line bg-white px-3 text-sm font-bold text-ink transition hover:border-clay hover:text-clay"
            >
              Email invite
            </a>
          </div>
        </div>
      ) : null}
      {inviteStatus ? <p className="mt-3 text-center text-xs font-semibold text-slate">{inviteStatus}</p> : null}
    </form>
  );

  async function useCurrentLocation() {
    setLocationError("");
    setIsLocating(true);
    try {
      const coordinates = await getCurrentPosition();
      const fallbackLabel = `Current location: ${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`;
      let locationA = fallbackLabel;
      let locationAPlaceId: string | undefined;
      try {
        const response = await fetch("/api/geocode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(coordinates)
        });
        const data = await response.json();
        if (response.ok) {
          locationA = data.formattedAddress || fallbackLabel;
          locationAPlaceId = data.placeId;
        }
      } catch {
        locationA = fallbackLabel;
      }
      onChange({ ...form, locationA, locationAPlaceId, locationACoordinates: coordinates });
    } catch {
      setLocationError("Couldn’t access your location. You can still type it manually.");
    } finally {
      setIsLocating(false);
    }
  }
}

async function getCurrentPosition(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    const geolocation = window.navigator?.geolocation;
    if (!geolocation) {
      reject(new Error("Geolocation is not supported"));
      return;
    }

    geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      reject,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}

function getSubmitCopy(primaryId: ReturnType<typeof getPrimaryCategoryId>) {
  switch (primaryId) {
    case "shopping":
      return "Find shops";
    case "activities":
      return "Find something to do";
    case "family":
      return "Find family spots";
    case "explore":
      return "Find places";
    case "colleges":
      return "Find campus spots";
    case "drinks":
      return "Find drinks";
    case "outdoors":
      return "Find outdoor spots";
    case "food":
    default:
      return "Find a place";
  }
}

function LocationInput({
  label,
  value,
  placeId,
  placeholder,
  error = "",
  onChange,
  onClear,
  onUseCurrentLocation,
  isLocating = false
}: {
  label: string;
  value: string;
  placeId?: string;
  placeholder: string;
  error?: string;
  onChange: (value: string, placeId?: string) => void;
  onClear?: () => void;
  onUseCurrentLocation?: () => void;
  isLocating?: boolean;
}) {
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
    <div className="relative grid gap-2">
      <div className="flex min-h-5 items-center justify-between gap-3">
        <label htmlFor={inputId(label)} className="text-sm font-bold text-ink">{label}</label>
        {onUseCurrentLocation ? (
          <button
            type="button"
            onClick={onUseCurrentLocation}
            disabled={isLocating}
            className="text-xs font-black text-ink underline-offset-4 transition hover:text-clay hover:underline disabled:cursor-wait disabled:text-slate"
          >
            {isLocating ? "Locating..." : "Use my location"}
          </button>
        ) : null}
      </div>
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId(label)}
          value={value}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onChange={(event) => {
            onChange(event.target.value, undefined);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="koi-field h-11 w-full px-4 pr-11 text-base outline-none transition sm:h-12"
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
      {placeId ? <p className="text-xs font-semibold text-clay">Location selected</p> : null}
      {isLocating ? <p className="text-xs font-semibold text-slate">Requesting your location...</p> : null}
      {error ? <p className="text-xs font-semibold text-events">{error}</p> : null}
      {status ? <p className="text-xs font-semibold text-slate">{status}</p> : null}
      {open && suggestions.length ? (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-lg border border-line bg-mint shadow-soft">
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

function inputId(label: string) {
  return `location-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}
