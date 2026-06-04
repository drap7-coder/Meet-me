"use client";

import { EmptyState } from "@/app/components/EmptyState";
import { LocationForm } from "@/app/components/LocationForm";
import { ResultsMap } from "@/app/components/ResultsMap";
import { VenueCard } from "@/app/components/VenueCard";
import type { ScoredVenue, SearchHalfwayRequest, SearchHalfwayResponse, VenueCategory } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

const initialForm: SearchHalfwayRequest = {
  locationA: "",
  locationB: "",
  category: "restaurant",
  customQuery: ""
};

export default function HomePage() {
  const [form, setForm] = useState<SearchHalfwayRequest>(initialForm);
  const [results, setResults] = useState<SearchHalfwayResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shareMessage, setShareMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const locationA = params.get("a") ?? "";
    const locationB = params.get("b") ?? "";
    const category = (params.get("category") as VenueCategory | null) ?? "restaurant";
    const customQuery = params.get("q") ?? "";
    if (locationA || locationB || customQuery) {
      setForm({ locationA, locationB, category, customQuery });
    }
  }, []);

  const resultCountLabel = useMemo(() => {
    if (!results) return "";
    return `${results.venues.length} option${results.venues.length === 1 ? "" : "s"} near the midpoint`;
  }, [results]);

  async function submitSearch() {
    setLoading(true);
    setError("");
    setShareMessage("");
    try {
      const response = await fetch("/api/search-halfway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Search failed.");
      setResults(data);
      updateShareUrl(form);
    } catch (searchError) {
      setResults(null);
      setError(searchError instanceof Error ? searchError.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  async function shareVenue(venue: ScoredVenue) {
    const text = `${venue.name} looks fair: ${formatMinutes(venue.travelFromA.durationMinutes)} from A, ${formatMinutes(venue.travelFromB.durationMinutes)} from B. ${venue.googleMapsUri}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Meet Me Half Way", text, url: venue.googleMapsUri });
      } else {
        await navigator.clipboard.writeText(text);
        setShareMessage("Option copied to clipboard.");
      }
    } catch {
      setShareMessage("Sharing was cancelled.");
    }
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="grid gap-6 py-6 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-moss/20 bg-white/70 px-3 py-1 text-sm font-bold text-moss">
              Meet Me Half Way
            </div>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Find the fairest place to meet.
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-ink/68">
              Put in two starting points, pick the vibe, and get venues ranked by travel-time fairness,
              quality, reviews, and whether the place is actually open.
            </p>
          </div>
          <div className="rounded-xl border border-ink/10 bg-white/75 p-4 text-sm leading-6 text-ink/70 shadow-soft">
            <strong className="text-ink">Fair does not mean exactly centered.</strong> It means both people get
            a sane route to a decent spot. The math handles the awkward geography.
          </div>
        </header>

        <LocationForm form={form} loading={loading} onChange={setForm} onSubmit={submitSearch} />

        {error ? (
          <div className="mt-5 rounded-xl border border-clay/25 bg-clay/10 p-4 text-sm font-semibold text-clay">
            {error}
          </div>
        ) : null}

        {loading ? (
          <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_420px]">
            <div className="grid gap-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-48 animate-pulse rounded-xl bg-white/70 shadow-soft" />
              ))}
            </div>
            <div className="h-[420px] animate-pulse rounded-xl bg-white/70 shadow-soft" />
          </section>
        ) : null}

        {results && !loading ? (
          <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_420px] lg:items-start">
            <div>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-moss">{resultCountLabel}</p>
                  <h2 className="mt-1 text-2xl font-black text-ink">Best matches</h2>
                  <p className="mt-1 text-sm text-ink/60">
                    {results.originA.formattedAddress} → {results.originB.formattedAddress}
                  </p>
                </div>
                {shareMessage ? <p className="text-sm font-semibold text-moss">{shareMessage}</p> : null}
              </div>

              {results.venues.length ? (
                <div className="grid gap-4">
                  {results.venues.map((venue, index) => (
                    <VenueCard key={venue.id} venue={venue} rank={index + 1} onShare={shareVenue} />
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </div>

            {results.venues.length ? (
              <ResultsMap
                originA={results.originA}
                originB={results.originB}
                midpoint={results.midpoint}
                venues={results.venues}
              />
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}

function updateShareUrl(form: SearchHalfwayRequest) {
  const params = new URLSearchParams();
  if (form.locationA) params.set("a", form.locationA);
  if (form.locationB) params.set("b", form.locationB);
  params.set("category", form.category);
  if (form.customQuery) params.set("q", form.customQuery);
  window.history.replaceState(null, "", `/?${params.toString()}`);
}

function formatMinutes(value: number | null) {
  if (typeof value !== "number") return "N/A";
  if (value < 60) return `${value} min`;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}
