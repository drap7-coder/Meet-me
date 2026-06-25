"use client";

import { AddressAutocompleteInput } from "@/app/components/AddressAutocompleteInput";
import type { LocationManualEntry } from "@/lib/locationInput";

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
      <AddressAutocompleteInput
        label="ZIP code"
        value={value.zip}
        placeId={value.zipPlaceId}
        placeholder="ZIP code"
        inputClassName={fieldClass}
        labelClassName={labelClass}
        selectedClassName={selectedClass}
        statusClassName={statusClass}
        autoComplete="postal-code"
        inputMode="numeric"
        onChange={(text, placeId) => update({ zip: text, zipPlaceId: placeId })}
        onClear={() => update({ zip: "", zipPlaceId: undefined })}
      />
    </div>
  );
}
