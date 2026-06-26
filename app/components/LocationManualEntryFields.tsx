"use client";

import { AddressAutocompleteInput } from "@/app/components/AddressAutocompleteInput";
import { normalizeZipInput, type LocationManualEntry } from "@/lib/locationInput";

type Props = {
  value: LocationManualEntry;
  onChange: (value: LocationManualEntry) => void;
  surface?: "hero" | "page";
};

export function LocationManualEntryFields({ value, onChange, surface = "hero" }: Props) {
  const onHero = surface === "hero";
  const fieldClass = onHero
    ? "koi-hero-field h-11 w-full min-w-0 px-4 pr-11 text-base outline-none transition"
    : "koi-field h-11 w-full min-w-0 px-4 pr-11 text-base outline-none transition placeholder:text-slate/60";
  const labelClass = onHero ? "text-xs font-semibold text-white/75" : "text-sm font-bold text-ink";
  const selectedClass = onHero ? "text-xs font-semibold text-white/75" : "text-xs font-semibold text-clay";
  const statusClass = onHero ? "text-xs font-semibold text-white/55" : "text-xs font-semibold text-slate";
  const clearButtonClass = onHero
    ? "absolute right-3 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-sm font-black text-white/60 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/25"
    : "absolute right-3 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-sm font-black text-slate/60 transition hover:bg-black/5 hover:text-ink focus:outline-none focus:ring-2 focus:ring-koi/30";

  function update(partial: Partial<LocationManualEntry>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <AddressAutocompleteInput
        label="Address or city"
        value={value.address}
        placeId={value.addressPlaceId}
        placeholder="Street address or city"
        inputClassName={fieldClass}
        labelClassName={labelClass}
        selectedClassName={selectedClass}
        statusClassName={statusClass}
        autoComplete="street-address"
        onChange={(text, placeId) => update({ address: text, addressPlaceId: placeId })}
        onClear={() => update({ address: "", addressPlaceId: undefined })}
      />
      <div className="grid gap-1.5">
        <label className={labelClass} htmlFor="manual-location-zip">
          ZIP code
        </label>
        <div className="relative">
          <input
            id="manual-location-zip"
            value={value.zip}
            placeholder="5-digit ZIP"
            className={fieldClass}
            autoComplete="postal-code"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={5}
            onChange={(event) => update({ zip: normalizeZipInput(event.target.value), zipPlaceId: undefined })}
          />
          {value.zip ? (
            <button
              type="button"
              onClick={() => update({ zip: "", zipPlaceId: undefined })}
              className={clearButtonClass}
              aria-label="Clear ZIP code"
            >
              ×
            </button>
          ) : null}
        </div>
        <p className={statusClass}>Enter 5 digits. No address lookup needed.</p>
      </div>
    </div>
  );
}
