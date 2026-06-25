"use client";

import { AddressAutocompleteInput } from "@/app/components/AddressAutocompleteInput";
import { LocationPinIcon } from "@/app/components/SavedLocationBadge";
import { FormEvent, useState } from "react";

type Props = {
  locating?: boolean;
  resolvingManual?: boolean;
  manualLocationError?: string;
  onUseCurrentLocation: () => void;
  onSubmitManualLocation: (input: string, placeId?: string) => void;
};

export function LocationOnboardingCard({
  locating = false,
  resolvingManual = false,
  manualLocationError = "",
  onUseCurrentLocation,
  onSubmitManualLocation
}: Props) {
  const [step, setStep] = useState<"intro" | "manual">("intro");
  const [manualInput, setManualInput] = useState("");
  const [manualPlaceId, setManualPlaceId] = useState<string | undefined>();
  const busy = locating || resolvingManual;

  function handleManualSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmitManualLocation(manualInput, manualPlaceId);
  }

  return (
    <section
      className="mx-auto grid w-full max-w-lg gap-4 rounded-[20px] border border-white/14 bg-white/[0.07] px-4 py-4 shadow-[0_18px_56px_rgba(0,0,0,0.38),0_0_0_1px_rgba(255,90,0,0.1)] backdrop-blur-md sm:gap-4 sm:px-5 sm:py-5"
      aria-labelledby="location-onboarding-title"
    >
      <div className="grid gap-1.5 text-center">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-koi">One quick step</p>
        <h2 id="location-onboarding-title" className="text-[clamp(1.125rem,4.5vw,1.5rem)] font-bold leading-tight tracking-[-0.03em] text-white">
          Where are you?
        </h2>
        <p className="mx-auto max-w-md text-sm font-medium leading-5 text-white/65">
          Set your area once to unlock trending events, local picks, and meetup spots near you.
        </p>
      </div>

        {step === "intro" ? (
          <div className="grid gap-2.5">
            <button
              type="button"
              onClick={onUseCurrentLocation}
              disabled={busy}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-koi text-[0.9375rem] font-bold text-white shadow-[0_10px_24px_rgba(255,90,0,0.34)] transition hover:bg-koi-hover focus:outline-none focus:ring-4 focus:ring-koi/25 disabled:cursor-not-allowed disabled:bg-koi/45"
            >
              <LocationPinIcon className="h-4 w-4 shrink-0" />
              {locating ? "Finding your location…" : "Use My Current Location"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("manual");
              }}
              disabled={busy}
              className="inline-flex h-11 w-full items-center justify-center rounded-full border-2 border-white/22 bg-white/[0.06] text-[0.9375rem] font-bold text-white transition hover:border-white/35 hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Enter City or ZIP
            </button>
            {manualLocationError ? (
              <p className="text-center text-xs font-semibold leading-5 text-[#FFD4C8]" role="status">
                {manualLocationError}
              </p>
            ) : null}
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="grid gap-2.5">
            <div className="relative min-w-0">
              <LocationPinIcon className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-koi" />
              <AddressAutocompleteInput
                label=""
                value={manualInput}
                placeId={manualPlaceId}
                placeholder="City, ZIP code, or address"
                inputClassName="koi-hero-field h-11 w-full min-w-0 pl-10 pr-11 text-base outline-none transition"
                labelClassName="sr-only"
                selectedClassName="text-xs font-semibold text-white/75"
                statusClassName="text-xs font-semibold text-white/55"
                onChange={(text, placeId) => {
                  setManualInput(text);
                  setManualPlaceId(placeId);
                }}
                onClear={() => {
                  setManualInput("");
                  setManualPlaceId(undefined);
                }}
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-koi text-[0.9375rem] font-bold text-white shadow-[0_10px_24px_rgba(255,90,0,0.34)] transition hover:bg-koi-hover focus:outline-none focus:ring-4 focus:ring-koi/25 disabled:cursor-not-allowed disabled:bg-koi/45"
            >
              {resolvingManual ? "Saving location…" : "Continue"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("intro");
              }}
              disabled={busy}
              className="py-0.5 text-sm font-semibold text-white/55 transition hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Back
            </button>
            {manualLocationError ? (
              <p className="text-center text-xs font-semibold leading-5 text-[#FFD4C8]" role="status">
                {manualLocationError}
              </p>
            ) : null}
          </form>
        )}
    </section>
  );
}
