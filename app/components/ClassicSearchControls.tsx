"use client";

import { AddressAutocompleteInput } from "@/app/components/AddressAutocompleteInput";
import { SearchPromptWhereWhen, useSearchPromptAssist } from "@/app/components/SearchPromptAssist";
import type { SearchSubmitOptions } from "@/lib/searchLocation";
import { builderModeForWhere } from "@/lib/searchBuilderOptions";
import type { SearchHalfwayRequest, WatchSubcategory } from "@/lib/types";
import { DEFAULT_WATCH_SUBCATEGORY } from "@/lib/watchBrowse";
import type { SearchBuilderMode } from "@/lib/searchBuilderOptions";
import type { ReactNode } from "react";
import { useState } from "react";

type Props = {
  form: SearchHalfwayRequest;
  loading: boolean;
  savedLocationLabel?: string;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  mode: SearchBuilderMode;
  surface?: "hero" | "page";
  onSearchPlaces: (form: SearchHalfwayRequest, options?: SearchSubmitOptions) => void;
  onSearchWatch: (query: string, subcategory: WatchSubcategory) => void;
};

type LocationDraft = {
  text: string;
  placeId?: string;
};

export function ClassicSearchControls({
  form,
  loading,
  savedLocationLabel = "",
  expanded: expandedProp,
  onExpandedChange,
  mode,
  surface = "hero",
  onSearchPlaces,
  onSearchWatch
}: Props) {
  const [expandedInternal, setExpandedInternal] = useState(false);
  const expanded = expandedProp ?? expandedInternal;
  const setExpanded = onExpandedChange ?? setExpandedInternal;

  const { filterPreview, isStreaming, state, setWhere } = useSearchPromptAssist();
  const isStreamingSearch = isStreaming;
  // Where chips in advanced search are the source of truth for location mode.
  const effectiveMode = builderModeForWhere(state.where);
  const onPage = surface === "page";
  const toggleClass = onPage
    ? "inline-flex items-center gap-1.5 px-0.5 text-sm font-bold text-slate/70 transition hover:text-ink"
    : "inline-flex items-center gap-1.5 px-0.5 text-sm font-bold text-white/55 transition hover:text-white/85";
  const panelClass = onPage
    ? "rounded-[18px] border border-line/80 bg-paper p-3 shadow-soft sm:p-4"
    : "rounded-[18px] border border-white/12 bg-white/[0.06] p-3 shadow-[0_14px_36px_rgba(0,0,0,0.12)] backdrop-blur sm:p-4";
  const innerPanelClass = onPage
    ? "grid gap-4 rounded-[16px] border border-line/70 bg-mint/40 p-3 sm:p-4"
    : "grid gap-4 rounded-[16px] border border-white/10 bg-ink/35 p-3 sm:p-4";
  const helperTextClass = onPage ? "text-sm font-medium leading-6 text-slate/75" : "text-sm font-medium leading-6 text-white/60";
  const footerTextClass = onPage ? "text-xs font-semibold leading-5 text-slate/70" : "text-xs font-semibold leading-5 text-white/55";
  const labelClassName = onPage
    ? "text-xs font-black uppercase tracking-[0.14em] text-slate/70"
    : "text-xs font-black uppercase tracking-[0.14em] text-white/55";
  const selectedClassName = onPage ? "text-xs font-semibold text-koi" : "text-xs font-semibold text-koi";
  const statusClassName = onPage ? "text-xs font-semibold text-slate/70" : "text-xs font-semibold text-white/50";
  const addressInputClass = onPage ? pageAddressInputClass : heroAddressInputClass;
  const [destination, setDestination] = useState<LocationDraft>({ text: "" });
  const [halfwayLocationA, setHalfwayLocationA] = useState<LocationDraft>({ text: "" });
  const [halfwayLocationB, setHalfwayLocationB] = useState<LocationDraft>({ text: "" });
  const watchSubcategory = form.watchSubcategory ?? DEFAULT_WATCH_SUBCATEGORY;

  function openAdvancedSearch() {
    setWhere("halfway");
    setExpanded(true);
  }

  function useSavedLocationForHalfwayA() {
    const saved = savedLocationLabel.trim() || form.locationA.trim();
    if (!saved) return;
    setHalfwayLocationA({
      text: saved,
      placeId: form.locationAPlaceId
    });
  }

  function submitBuilderSearch() {
    if (isStreamingSearch) {
      onSearchWatch(filterPreview?.query.trim() || "what should I watch", watchSubcategory);
      return;
    }

    const query = filterPreview?.query.trim() || "restaurants near me";
    const searchForm: SearchHalfwayRequest = {
      ...form,
      customQuery: query,
      searchMode: effectiveMode === "halfway" ? "midpoint" : "single",
      watchSubcategory: undefined
    };

    if (effectiveMode === "halfway") {
      searchForm.locationA = halfwayLocationA.text.trim();
      searchForm.locationB = halfwayLocationB.text.trim();
      searchForm.locationAPlaceId = halfwayLocationA.placeId;
      searchForm.locationBPlaceId = halfwayLocationB.placeId;
      searchForm.locationACoordinates = undefined;
      searchForm.locationBCoordinates = undefined;
    } else if (effectiveMode === "destination" && destination.text.trim()) {
      searchForm.locationA = destination.text.trim();
      searchForm.locationB = "";
      searchForm.locationAPlaceId = destination.placeId;
      searchForm.locationACoordinates = undefined;
    } else {
      searchForm.locationB = "";
    }

    onSearchPlaces(searchForm, effectiveMode === "destination" ? { preserveSavedHomeLocation: true } : undefined);
  }

  if (!expanded) {
    return (
      <section id="classic-search" className="w-full">
        <button
          type="button"
          onClick={openAdvancedSearch}
          className={toggleClass}
          aria-expanded={false}
          aria-controls="advanced-search-panel"
        >
          Advanced Search
          <span aria-hidden="true">▾</span>
        </button>
      </section>
    );
  }

  return (
    <section id="classic-search" className="w-full">
      <button
        type="button"
        onClick={() => setExpanded(false)}
        className={`mb-3 ${toggleClass}`}
        aria-expanded={true}
        aria-controls="advanced-search-panel"
      >
        Advanced Search
        <span aria-hidden="true">▴</span>
      </button>

      <div id="advanced-search-panel" className={`${panelClass} overflow-visible`}>
        <div className={`${innerPanelClass} overflow-visible`}>
          {isStreaming ? (
            <p className={helperTextClass}>
              Streaming picks come from your selected filters. Refine below, then tap Search.
            </p>
          ) : (
            <>
              <SearchPromptWhereWhen />

              {effectiveMode === "near_me" ? (
                <Field label="Location" labelClassName={labelClassName}>
                  <div
                    className={`flex h-11 items-center rounded-lg border px-3 text-sm ${
                      savedLocationLabel.trim()
                        ? onPage
                          ? "border-koi/40 bg-koi/10 font-black text-koi"
                          : "border-koi/40 bg-koi/10 font-black text-koi drop-shadow-[0_0_10px_rgba(255,90,0,0.35)]"
                        : onPage
                          ? "border-line bg-white font-semibold text-ink"
                          : "border-white/12 bg-white/[0.08] font-semibold text-white/85"
                    }`}
                  >
                    {savedLocationLabel.trim() || "Set your location above"}
                  </div>
                  <p className={statusClassName}>Uses your saved location. Tap Change above to update.</p>
                </Field>
              ) : null}

              {effectiveMode === "halfway" ? (
                <div className="grid gap-3">
                  <p className={statusClassName}>Type an address or city — suggestions appear as you type.</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <AddressAutocompleteInput
                      label="Location A"
                      value={halfwayLocationA.text}
                      placeId={halfwayLocationA.placeId}
                      placeholder="Starting address or city"
                      inputClassName={addressInputClass(halfwayLocationA.text, halfwayLocationA.placeId)}
                      labelClassName={labelClassName}
                      selectedClassName={selectedClassName}
                      statusClassName={statusClassName}
                      onChange={(text, placeId) => setHalfwayLocationA({ text, placeId })}
                      onClear={() => setHalfwayLocationA({ text: "" })}
                    />
                    <AddressAutocompleteInput
                      label="Location B"
                      value={halfwayLocationB.text}
                      placeId={halfwayLocationB.placeId}
                      placeholder="Other address or city"
                      inputClassName={addressInputClass(halfwayLocationB.text, halfwayLocationB.placeId)}
                      labelClassName={labelClassName}
                      selectedClassName={selectedClassName}
                      statusClassName={statusClassName}
                      onChange={(text, placeId) => setHalfwayLocationB({ text, placeId })}
                      onClear={() => setHalfwayLocationB({ text: "" })}
                    />
                  </div>
                  {savedLocationLabel.trim() ? (
                    <button
                      type="button"
                      onClick={useSavedLocationForHalfwayA}
                      className={
                        onPage
                          ? "justify-self-start text-xs font-bold text-slate/70 underline decoration-line underline-offset-2 transition hover:text-ink"
                          : "justify-self-start text-xs font-bold text-white/55 underline decoration-white/25 underline-offset-2 transition hover:text-white/85"
                      }
                    >
                      Use saved location for Location A
                    </button>
                  ) : null}
                </div>
              ) : null}

              {effectiveMode === "destination" ? (
                <div className="overflow-visible">
                  <AddressAutocompleteInput
                  label="Near"
                  value={destination.text}
                  placeId={destination.placeId}
                  placeholder="City, address, or landmark"
                  inputClassName={addressInputClass(destination.text, destination.placeId)}
                  labelClassName={labelClassName}
                  selectedClassName={selectedClassName}
                  statusClassName={statusClassName}
                  onChange={(text, placeId) => setDestination({ text, placeId })}
                  onClear={() => setDestination({ text: "" })}
                />
                </div>
              ) : null}
            </>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className={footerTextClass}>
              Ask Koi is the magic. This builder is the seatbelt.
            </p>
            <button
              type="button"
              onClick={submitBuilderSearch}
              disabled={loading}
              className="h-11 rounded-full bg-koi px-5 text-sm font-black text-white shadow-[0_10px_24px_rgba(255,90,0,0.24)] transition hover:bg-koi-hover focus:outline-none focus:ring-4 focus:ring-koi/25 disabled:cursor-not-allowed disabled:bg-white/20"
            >
              {isStreaming ? "Find streaming picks" : effectiveMode === "halfway" ? "Find places" : "Search"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  labelClassName,
  children
}: {
  label: string;
  labelClassName: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className={labelClassName}>{label}</span>
      {children}
    </label>
  );
}

const heroAddressInputBase =
  "h-11 w-full rounded-lg border bg-white px-3 pr-11 text-base text-ink outline-none transition focus:border-koi focus:ring-4 focus:ring-koi/15";

const pageAddressInputBase =
  "h-11 w-full rounded-lg border border-line bg-white px-3 pr-11 text-base text-ink outline-none transition focus:border-koi focus:ring-4 focus:ring-koi/15";

function heroAddressInputClass(value: string, placeId?: string) {
  if (!value.trim()) return `${heroAddressInputBase} border-white/12`;
  if (placeId) return `${heroAddressInputBase} border-koi/40 font-black text-koi shadow-[0_0_12px_rgba(255,90,0,0.22)]`;
  return `${heroAddressInputBase} border-white/12`;
}

function pageAddressInputClass(value: string, placeId?: string) {
  if (!value.trim()) return pageAddressInputBase;
  if (placeId) return `${pageAddressInputBase} border-koi/40 font-black text-koi`;
  return pageAddressInputBase;
}
