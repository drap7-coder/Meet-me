"use client";

import { CategorySelector } from "@/app/components/CategorySelector";
import type { PlaceSuggestion, SearchHalfwayRequest, VenueCategory } from "@/lib/types";
import { copyTextToClipboard, shareWithFallback } from "@/lib/share";
import { BRAND } from "@/src/config/branding";
import { FormEvent, useEffect, useRef, useState } from "react";

type Props = {
  form: SearchHalfwayRequest;
  loading: boolean;
  onChange: (form: SearchHalfwayRequest) => void;
  onSubmit: () => void;
};

export function LocationForm({ form, loading, onChange, onSubmit }: Props) {
  const [inviteStatus, setInviteStatus] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [showInviteTools, setShowInviteTools] = useState(false);
  const inviteText = "Want to meet halfway? Add your starting point and we’ll find somewhere that works for both of us.";

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

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-line bg-paper p-5 shadow-soft sm:p-7">
      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-wide text-clay">{BRAND.name}</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-ink sm:text-3xl">
          Where should you meet?
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate">
          Enter two locations and we’ll find great places between them.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <LocationInput
          label="Where are you starting from?"
          value={form.locationA}
          placeId={form.locationAPlaceId}
          placeholder="e.g. Hoboken, NJ"
          onChange={(locationA, locationAPlaceId) => onChange({ ...form, locationA, locationAPlaceId })}
        />
        <LocationInput
          label="Where are they starting from?"
          value={form.locationB}
          placeId={form.locationBPlaceId}
          placeholder="e.g. Edison, NJ"
          onChange={(locationB, locationBPlaceId) => onChange({ ...form, locationB, locationBPlaceId })}
        />
      </div>

      <div className="mt-5 grid gap-3">
        <span className="text-sm font-bold text-ink">Choose the vibe</span>
        <CategorySelector value={form.category} onChange={(category: VenueCategory) => update("category", category)} />
      </div>

      {form.category === "custom" ? (
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

      <button
        type="submit"
        disabled={loading}
        className="mt-6 h-11 w-full rounded-lg bg-clay px-5 font-bold text-white shadow-[0_10px_24px_rgba(17,17,17,0.12)] transition hover:bg-[#174FE0] disabled:cursor-not-allowed disabled:bg-ink/30 sm:h-12"
      >
        {loading ? "Finding a place..." : "Find a Place"}
      </button>
      <button
        type="button"
        onClick={shareInvite}
        className="mt-3 h-10 w-full rounded-lg border border-line bg-mint px-5 text-sm font-bold text-ink transition hover:border-clay hover:text-clay"
      >
        Invite someone to plan with you
      </button>
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
        <span className="text-sm font-bold text-ink">{label}</span>
        <input
          value={value}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onChange={(event) => {
            onChange(event.target.value, undefined);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="h-11 rounded-lg border border-line bg-mint px-4 text-base outline-none transition focus:border-clay focus:ring-4 focus:ring-clay/10 sm:h-12"
        />
      </label>
      {placeId ? <p className="text-xs font-semibold text-clay">Location selected</p> : null}
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
