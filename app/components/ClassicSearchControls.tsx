"use client";

import { SearchPromptWhereWhen, useSearchPromptAssist } from "@/app/components/SearchPromptAssist";
import type { SearchSubmitOptions } from "@/lib/searchLocation";
import type { SearchHalfwayRequest, WatchSubcategory } from "@/lib/types";
import { DEFAULT_WATCH_SUBCATEGORY } from "@/lib/watchBrowse";
import type { SearchBuilderMode } from "@/lib/searchBuilderOptions";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type Props = {
  form: SearchHalfwayRequest;
  loading: boolean;
  savedLocationLabel?: string;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  mode: SearchBuilderMode;
  onSearchPlaces: (form: SearchHalfwayRequest, options?: SearchSubmitOptions) => void;
  onSearchWatch: (query: string, subcategory: WatchSubcategory) => void;
};

export function ClassicSearchControls({
  form,
  loading,
  savedLocationLabel = "",
  expanded: expandedProp,
  onExpandedChange,
  mode,
  onSearchPlaces,
  onSearchWatch
}: Props) {
  const [expandedInternal, setExpandedInternal] = useState(false);
  const expanded = expandedProp ?? expandedInternal;
  const setExpanded = onExpandedChange ?? setExpandedInternal;

  const { promptQuery } = useSearchPromptAssist();
  const isStreaming = form.category === "custom" && Boolean(form.watchSubcategory);
  const [destination, setDestination] = useState("");
  const [halfwayLocationA, setHalfwayLocationA] = useState("");
  const [halfwayLocationB, setHalfwayLocationB] = useState("");
  const watchSubcategory = form.watchSubcategory ?? DEFAULT_WATCH_SUBCATEGORY;
  const previousMode = useRef(mode);

  useEffect(() => {
    if (mode === "halfway" && previousMode.current !== "halfway") {
      setHalfwayLocationA("");
      setHalfwayLocationB("");
    }
    previousMode.current = mode;
  }, [mode]);

  function useSavedLocationForHalfwayA() {
    const saved = savedLocationLabel.trim() || form.locationA.trim();
    if (saved) setHalfwayLocationA(saved);
  }

  function submitBuilderSearch() {
    if (isStreaming) {
      onSearchWatch(promptQuery.trim() || "what should I watch tonight", watchSubcategory);
      return;
    }

    const query = promptQuery.trim() || "restaurants near me";
    const searchForm: SearchHalfwayRequest = {
      ...form,
      customQuery: query,
      searchMode: mode === "halfway" ? "midpoint" : "single",
      watchSubcategory: undefined
    };

    if (mode === "halfway") {
      searchForm.locationA = halfwayLocationA.trim();
      searchForm.locationB = halfwayLocationB.trim();
      searchForm.locationAPlaceId = undefined;
      searchForm.locationACoordinates = undefined;
      searchForm.locationBPlaceId = undefined;
      searchForm.locationBCoordinates = undefined;
    } else if (mode === "destination" && destination.trim()) {
      searchForm.locationA = destination.trim();
      searchForm.locationB = "";
      searchForm.locationAPlaceId = undefined;
      searchForm.locationACoordinates = undefined;
    } else {
      searchForm.locationB = "";
    }

    onSearchPlaces(searchForm, mode === "destination" ? { preserveSavedHomeLocation: true } : undefined);
  }

  if (!expanded) {
    return (
      <section id="classic-search" className="w-full">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="inline-flex items-center gap-1.5 px-0.5 text-sm font-bold text-white/55 transition hover:text-white/85"
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
        className="mb-3 inline-flex items-center gap-1.5 px-0.5 text-sm font-bold text-white/55 transition hover:text-white/85"
        aria-expanded={true}
        aria-controls="advanced-search-panel"
      >
        Advanced Search
        <span aria-hidden="true">▴</span>
      </button>

      <div
        id="advanced-search-panel"
        className="rounded-[18px] border border-white/12 bg-white/[0.06] p-3 shadow-[0_14px_36px_rgba(0,0,0,0.12)] backdrop-blur sm:p-4"
      >
        <div className="grid gap-4 rounded-[16px] border border-white/10 bg-ink/35 p-3 sm:p-4">
          {isStreaming ? (
            <p className="text-sm font-medium leading-6 text-white/60">
              Streaming picks come from your ask above. Use the chips to refine, then search.
            </p>
          ) : (
            <>
              <SearchPromptWhereWhen />

              {mode === "near_me" ? (
                <Field label="Location">
                  <div className="flex h-11 items-center rounded-lg border border-white/12 bg-white/[0.08] px-3 text-sm font-semibold text-white/85">
                    {savedLocationLabel.trim() || "Set your location above"}
                  </div>
                  <p className="text-xs font-medium text-white/45">Uses your saved location. Tap Change above to update.</p>
                </Field>
              ) : null}

              {mode === "halfway" ? (
                <div className="grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Location A">
                      <input
                        value={halfwayLocationA}
                        onChange={(event) => setHalfwayLocationA(event.target.value)}
                        placeholder="Starting address or city"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Location B">
                      <input
                        value={halfwayLocationB}
                        onChange={(event) => setHalfwayLocationB(event.target.value)}
                        placeholder="Other address or city"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  {savedLocationLabel.trim() ? (
                    <button
                      type="button"
                      onClick={useSavedLocationForHalfwayA}
                      className="justify-self-start text-xs font-bold text-white/55 underline decoration-white/25 underline-offset-2 transition hover:text-white/85"
                    >
                      Use saved location for Location A
                    </button>
                  ) : null}
                </div>
              ) : null}

              {mode === "destination" ? (
                <Field label="Near">
                  <input
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                    placeholder="Citizens Bank Park"
                    className={inputClass}
                  />
                </Field>
              ) : null}
            </>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold leading-5 text-white/55">
              Ask Koi is the magic. This builder is the seatbelt.
            </p>
            <button
              type="button"
              onClick={submitBuilderSearch}
              disabled={loading}
              className="h-11 rounded-full bg-koi px-5 text-sm font-black text-white shadow-[0_10px_24px_rgba(255,90,0,0.24)] transition hover:bg-koi-hover focus:outline-none focus:ring-4 focus:ring-koi/25 disabled:cursor-not-allowed disabled:bg-white/20"
            >
              {isStreaming ? "Find streaming picks" : mode === "halfway" ? "Find places" : "Search"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-white/55">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "h-11 w-full rounded-lg border border-white/12 bg-white px-3 text-base text-ink outline-none transition focus:border-koi focus:ring-4 focus:ring-koi/15";
