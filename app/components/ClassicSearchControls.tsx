"use client";

import {
  BUILDER_CATEGORIES,
  buildStructuredQuery,
  cuisineOptionsForGroup,
  groupHasCuisineOptions,
  RADIUS_OPTIONS,
  resolveBuilderCategory,
  venueCategoryForBuilder,
  type RadiusOption,
  type ResultMode,
  type SearchBuilderMode
} from "@/lib/searchBuilderOptions";
import type { SearchHalfwayRequest, WatchSubcategory } from "@/lib/types";
import { DEFAULT_WATCH_SUBCATEGORY } from "@/lib/watchBrowse";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type Props = {
  form: SearchHalfwayRequest;
  loading: boolean;
  savedLocationLabel?: string;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  preferredMode?: SearchBuilderMode;
  onPreferredModeApplied?: () => void;
  onChange: (form: SearchHalfwayRequest) => void;
  onSearchPlaces: (form: SearchHalfwayRequest) => void;
  onSearchWatch: (query: string, subcategory: WatchSubcategory) => void;
};

const MODE_OPTIONS: Array<{ id: SearchBuilderMode; label: string; hint: string }> = [
  { id: "near_me", label: "Near Me", hint: "Search from your saved location" },
  { id: "halfway", label: "Halfway", hint: "Meet in the middle between two places" },
  { id: "destination", label: "Destination", hint: "Search near a venue or landmark" }
];

export function ClassicSearchControls({
  form,
  loading,
  savedLocationLabel = "",
  expanded: expandedProp,
  onExpandedChange,
  preferredMode,
  onPreferredModeApplied,
  onChange,
  onSearchPlaces,
  onSearchWatch
}: Props) {
  const [expandedInternal, setExpandedInternal] = useState(false);
  const expanded = expandedProp ?? expandedInternal;
  const setExpanded = onExpandedChange ?? setExpandedInternal;

  const isStreaming = form.category === "custom" && Boolean(form.watchSubcategory);
  const initialCategory = resolveBuilderCategory(form.category);
  const [mode, setMode] = useState<SearchBuilderMode>(() =>
    form.searchMode === "midpoint" ? "halfway" : "near_me"
  );
  const [categoryGroup, setCategoryGroup] = useState(initialCategory.group);
  const [cuisineId, setCuisineId] = useState<string>("any");
  const [radius, setRadius] = useState<RadiusOption>("20 min");
  const [resultMode, setResultMode] = useState<ResultMode>("best");
  const [destination, setDestination] = useState("");
  const watchSubcategory = form.watchSubcategory ?? DEFAULT_WATCH_SUBCATEGORY;

  useEffect(() => {
    if (form.searchMode === "midpoint") {
      setMode("halfway");
    }
  }, [form.searchMode]);

  useEffect(() => {
    if (!preferredMode) return;
    setMode(preferredMode);
    if (preferredMode === "halfway") {
      onChange({ ...form, searchMode: "midpoint" });
    } else {
      onChange({ ...form, searchMode: "single", locationB: "" });
    }
    onPreferredModeApplied?.();
  }, [preferredMode]); // eslint-disable-line react-hooks/exhaustive-deps -- apply once when parent requests a mode

  const categoryDef = BUILDER_CATEGORIES.find((item) => item.group === categoryGroup) ?? BUILDER_CATEGORIES[0];
  const cuisineOptions = cuisineOptionsForGroup(categoryGroup);
  const showCuisine = groupHasCuisineOptions(categoryGroup);

  function updateForm(patch: Partial<SearchHalfwayRequest>) {
    onChange({ ...form, ...patch });
  }

  function selectMode(nextMode: SearchBuilderMode) {
    setMode(nextMode);
    updateForm({
      searchMode: nextMode === "halfway" ? "midpoint" : "single",
      locationB: nextMode === "halfway" ? form.locationB : ""
    });
  }

  function selectCategory(group: typeof categoryGroup) {
    setCategoryGroup(group);
    setCuisineId("any");
    const next = BUILDER_CATEGORIES.find((item) => item.group === group);
    if (next) updateForm({ category: next.id, watchSubcategory: undefined });
  }

  function selectCuisine(id: string) {
    setCuisineId(id);
    const venueCategory = venueCategoryForBuilder(categoryDef.id, id);
    updateForm({ category: venueCategory, watchSubcategory: undefined });
  }

  function submitBuilderSearch() {
    if (isStreaming) {
      onSearchWatch(form.customQuery?.trim() || "what should I watch tonight", watchSubcategory);
      return;
    }

    const venueCategory = venueCategoryForBuilder(categoryDef.id, cuisineId);
    const query = buildStructuredQuery({
      mode,
      category: venueCategory,
      cuisineId,
      radius,
      locationA: mode === "destination" ? destination : form.locationA,
      locationB: form.locationB
    });

    const searchForm: SearchHalfwayRequest = {
      ...form,
      category: venueCategory,
      customQuery: query,
      searchMode: mode === "halfway" ? "midpoint" : "single",
      locationB: mode === "halfway" ? form.locationB : "",
      watchSubcategory: undefined
    };

    if (mode === "destination" && destination.trim()) {
      searchForm.locationA = destination.trim();
      searchForm.locationAPlaceId = undefined;
      searchForm.locationACoordinates = undefined;
    }

    onSearchPlaces(searchForm);
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
              <fieldset className="grid gap-2">
                <legend className="text-xs font-black uppercase tracking-[0.14em] text-white/55">Search mode</legend>
                <div className="flex flex-wrap gap-2">
                  {MODE_OPTIONS.map((option) => (
                    <ModeChip
                      key={option.id}
                      label={option.label}
                      hint={option.hint}
                      selected={mode === option.id}
                      onClick={() => selectMode(option.id)}
                    />
                  ))}
                </div>
              </fieldset>

              {mode === "near_me" ? (
                <Field label="Location">
                  <div className="flex h-11 items-center rounded-lg border border-white/12 bg-white/[0.08] px-3 text-sm font-semibold text-white/85">
                    {savedLocationLabel.trim() || form.locationA.trim() || "Set your location above"}
                  </div>
                  <p className="text-xs font-medium text-white/45">Uses your saved location. Tap Change above to update.</p>
                </Field>
              ) : null}

              {mode === "halfway" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Location A">
                    <input
                      value={form.locationA}
                      onChange={(event) =>
                        updateForm({
                          locationA: event.target.value,
                          locationAPlaceId: undefined,
                          locationACoordinates: undefined
                        })
                      }
                      placeholder="Blue Bell, PA"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Location B">
                    <input
                      value={form.locationB}
                      onChange={(event) =>
                        updateForm({
                          locationB: event.target.value,
                          locationBPlaceId: undefined,
                          locationBCoordinates: undefined
                        })
                      }
                      placeholder="Manayunk, PA"
                      className={inputClass}
                    />
                  </Field>
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

              <ControlGroup title="Category">
                {BUILDER_CATEGORIES.map((option) => (
                  <Chip
                    key={option.group}
                    selected={categoryGroup === option.group}
                    onClick={() => selectCategory(option.group)}
                  >
                    {option.label}
                  </Chip>
                ))}
              </ControlGroup>

              {showCuisine ? (
                <ControlGroup title={categoryGroup === "drinks" ? "Bar type" : "Cuisine"}>
                  {cuisineOptions.map((option) => (
                    <Chip
                      key={option.id}
                      selected={cuisineId === option.id}
                      onClick={() => selectCuisine(option.id)}
                    >
                      {option.label}
                    </Chip>
                  ))}
                </ControlGroup>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <ControlGroup title="Radius">
                  {RADIUS_OPTIONS.map((option) => (
                    <Chip key={option} selected={radius === option} onClick={() => setRadius(option)}>
                      {option}
                    </Chip>
                  ))}
                </ControlGroup>

                {mode === "halfway" ? (
                  <ControlGroup title="Result mode">
                    <Chip selected={resultMode === "best"} onClick={() => setResultMode("best")}>
                      Best pick
                    </Chip>
                    <Chip selected={resultMode === "more"} onClick={() => setResultMode("more")}>
                      More options
                    </Chip>
                  </ControlGroup>
                ) : null}
              </div>
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

function ModeChip({
  label,
  hint,
  selected,
  onClick
}: {
  label: string;
  hint: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      title={hint}
      className={`rounded-full border px-3.5 py-2 text-sm font-bold transition ${
        selected
          ? "border-koi bg-koi text-white shadow-[0_8px_18px_rgba(255,90,0,0.24)]"
          : "border-white/14 bg-white/[0.06] text-white/85 hover:border-white/30 hover:bg-white/10"
      }`}
    >
      {label}
    </button>
  );
}

function ControlGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid gap-2 rounded-[14px] border border-white/10 bg-white/[0.05] p-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-white/55">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full border px-3 py-2 text-sm font-bold transition ${
        selected
          ? "border-koi/70 bg-koi/15 text-white"
          : "border-white/14 bg-white/[0.06] text-white/85 hover:border-white/30 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

const inputClass =
  "h-11 rounded-lg border border-white/12 bg-white px-3 text-base text-ink outline-none transition focus:border-koi focus:ring-4 focus:ring-koi/15";
