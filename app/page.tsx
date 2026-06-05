"use client";

import { EmptyState } from "@/app/components/EmptyState";
import { LocationForm } from "@/app/components/LocationForm";
import { ResultsMap } from "@/app/components/ResultsMap";
import { VenueCard } from "@/app/components/VenueCard";
import type { LatLng, ScoredVenue, SearchHalfwayRequest, SearchHalfwayResponse, VenueCategory } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

const initialForm: SearchHalfwayRequest = {
  locationA: "",
  locationB: "",
  category: "coffee",
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
    const locationAPlaceId = params.get("aPlaceId") ?? undefined;
    const locationB = params.get("b") ?? "";
    const locationBPlaceId = params.get("bPlaceId") ?? undefined;
    const category = (params.get("category") as VenueCategory | null) ?? "restaurant";
    const customQuery = params.get("q") ?? "";
    if (locationA || locationB || customQuery) {
      setForm({ locationA, locationAPlaceId, locationB, locationBPlaceId, category, customQuery });
    }
  }, []);

  const resultCountLabel = useMemo(() => {
    if (!results) return "";
    return `${results.venues.length} place${results.venues.length === 1 ? "" : "s"} that could work`;
  }, [results]);

  const resultContext = useMemo(() => {
    if (!results) return null;
    return {
      originALabel: shortLocationLabel(results.originA.formattedAddress),
      originBLabel: shortLocationLabel(results.originB.formattedAddress),
      closestVenueId: findClosestVenueId(results.venues, results.midpoint),
      shortestCombinedVenueId: findShortestCombinedVenueId(results.venues)
    };
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
    const text = `${venue.name} looks like a good halfway spot: ${formatMinutes(venue.travelFromA.durationMinutes)} for one of you, ${formatMinutes(venue.travelFromB.durationMinutes)} for the other. ${venue.googleMapsUri}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Meet Me Halfway", text, url: venue.googleMapsUri });
      } else {
        await navigator.clipboard.writeText(text);
        setShareMessage("Spot copied to clipboard.");
      }
    } catch {
      setShareMessage("Sharing was cancelled.");
    }
  }

  return (
    <main className="min-h-screen bg-white text-ink">
      <section className="px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <nav className="flex items-center justify-between py-2">
            <LogoMark />
            <a
              href="#how-it-works"
              className="hidden rounded-full border border-line px-4 py-2 text-sm font-semibold text-slate transition hover:border-ink hover:text-ink sm:inline-flex"
            >
              See How It Works
            </a>
          </nav>

          <div className="grid gap-10 pb-10 pt-14 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:pb-16 lg:pt-20">
            <div>
              <p className="mb-5 inline-flex rounded-full bg-sky px-4 py-2 text-sm font-semibold text-slate">
                Two locations. One great place to meet.
              </p>
              <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-tight text-ink sm:text-6xl lg:text-7xl">
                Find the perfect place between you.
              </h1>
              <p className="mt-6 max-w-2xl text-xl leading-8 text-slate">
                Meet Me Halfway helps two people discover great places to meet — right in the middle.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#search"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-[#0071E3] px-6 text-base font-bold text-white shadow-glow transition hover:bg-[#0066CC]"
                >
                  Find a Meeting Spot
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-sky px-6 text-base font-bold text-ink transition hover:bg-line"
                >
                  See How It Works
                </a>
              </div>
            </div>

            <HeroVisual />
          </div>

          <section id="search" className="mx-auto max-w-5xl">
            <LocationForm form={form} loading={loading} onChange={setForm} onSubmit={submitSearch} />
          </section>
        </div>
      </section>

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {error ? (
          <div className="mt-5 rounded-lg border border-[#0071E3]/25 bg-[#0071E3]/10 p-4 text-sm font-semibold text-[#0071E3]">
            {error}
          </div>
        ) : null}

        {loading ? (
          <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_420px]">
            <div className="grid gap-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-48 animate-pulse rounded-lg bg-sky shadow-soft" />
              ))}
            </div>
            <div className="h-[420px] animate-pulse rounded-lg bg-sky shadow-soft" />
          </section>
        ) : null}

        {results && !loading ? (
          <section className="mt-8 grid gap-5 pb-16 lg:grid-cols-[1fr_420px] lg:items-start">
            <div>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-[#0071E3]">{resultCountLabel}</p>
                  <h2 className="mt-1 text-3xl font-black text-ink">Places worth meeting at</h2>
                  <p className="mt-1 text-sm text-ink/60">
                    {results.originA.formattedAddress} → {results.originB.formattedAddress}
                  </p>
                </div>
                {shareMessage ? <p className="text-sm font-semibold text-[#0071E3]">{shareMessage}</p> : null}
              </div>

              {results.venues.length ? (
                <div className="grid gap-4">
                  {results.venues.map((venue, index) => (
                    <VenueCard
                      key={venue.id}
                      venue={venue}
                      rank={index + 1}
                      originALabel={resultContext?.originALabel ?? "Person A"}
                      originBLabel={resultContext?.originBLabel ?? "Person B"}
                      isClosestToHalfway={venue.id === resultContext?.closestVenueId}
                      isShortestCombined={venue.id === resultContext?.shortestCombinedVenueId}
                      onShare={shareVenue}
                    />
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
      </div>

      {!results && !loading ? (
        <>
          <HowItWorks />
          <UseCases />
          <BrandSection />
        </>
      ) : null}
    </main>
  );
}

function LogoMark() {
  return (
    <div className="inline-flex items-center gap-3">
      <div className="relative h-10 w-10 rounded-lg bg-ink shadow-soft">
        <div className="absolute left-2 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white" />
        <div className="absolute right-2 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white" />
        <div className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0071E3] ring-4 ring-white/20" />
      </div>
      <span className="text-lg font-black tracking-tight text-ink">Meet Me Halfway</span>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative min-h-[320px] overflow-hidden rounded-lg border border-line bg-[#F5F5F7] p-6 shadow-soft sm:min-h-[420px]">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,17,17,.04)_1px,transparent_1px),linear-gradient(180deg,rgba(17,17,17,.04)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="absolute left-[12%] top-[28%] h-4 w-4 rounded-full bg-ink shadow-soft" />
      <div className="absolute right-[12%] top-[30%] h-4 w-4 rounded-full bg-ink shadow-soft" />
      <div className="absolute left-[19%] right-[19%] top-[31%] h-px bg-gradient-to-r from-ink/10 via-[#0071E3] to-ink/10" />
      <div className="absolute left-1/2 top-[31%] h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0071E3] ring-8 ring-[#0071E3]/10" />

      <div className="absolute bottom-6 left-6 right-6 rounded-lg border border-line bg-white/88 p-5 shadow-soft backdrop-blur">
        <p className="text-sm font-bold text-[#0071E3]">Skip the back-and-forth.</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-ink">Find somewhere fair, fast.</h2>
        <div className="mt-5 grid gap-3 text-sm font-semibold text-slate sm:grid-cols-3">
          <div className="rounded-lg bg-sky p-3">You</div>
          <div className="rounded-lg bg-sky p-3">The spot</div>
          <div className="rounded-lg bg-sky p-3">Them</div>
        </div>
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    ["Add two locations", "Start with where each person is coming from."],
    ["Choose the vibe", "Coffee, dinner, drinks, parks, or something different."],
    ["Meet in the middle", "Pick a spot that feels easy for both of you."]
  ];

  return (
    <section id="how-it-works" className="bg-[#F5F5F7] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-wide text-[#0071E3]">How it works</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-ink sm:text-5xl">Plans without the group text.</h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map(([title, copy], index) => (
            <article key={title} className="rounded-lg border border-line bg-white p-6 shadow-soft">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-ink text-sm font-black text-white">
                {index + 1}
              </div>
              <h3 className="mt-8 text-xl font-black text-ink">{title}</h3>
              <p className="mt-3 leading-7 text-slate">{copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function UseCases() {
  const cards = [
    "Coffee catch-ups",
    "Dinner with friends",
    "First dates",
    "Family meetups",
    "Client meetings",
    "Weekend activities"
  ];

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <h2 className="max-w-2xl text-4xl font-black tracking-tight text-ink sm:text-5xl">
            Perfect for coffee, dinner, drinks, or something different.
          </h2>
          <p className="max-w-sm text-lg leading-8 text-slate">Meet more often. Plan less.</p>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <article key={card} className="rounded-lg border border-line bg-white p-6 shadow-soft">
              <p className="text-xl font-black text-ink">{card}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function BrandSection() {
  return (
    <section className="px-4 pb-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-lg bg-ink px-6 py-14 text-white shadow-soft sm:px-10 lg:px-14">
        <h2 className="max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">Halfway isn’t compromise.</h2>
        <p className="mt-5 max-w-2xl text-xl leading-8 text-white/70">
          It’s the simplest way to make plans fair, easy, and actually happen.
        </p>
      </div>
    </section>
  );
}

function updateShareUrl(form: SearchHalfwayRequest) {
  const params = new URLSearchParams();
  if (form.locationA) params.set("a", form.locationA);
  if (form.locationAPlaceId) params.set("aPlaceId", form.locationAPlaceId);
  if (form.locationB) params.set("b", form.locationB);
  if (form.locationBPlaceId) params.set("bPlaceId", form.locationBPlaceId);
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

function shortLocationLabel(address: string) {
  return address.split(",")[0]?.trim() || "Person";
}

function findClosestVenueId(venues: ScoredVenue[], midpoint: LatLng) {
  return venues.reduce<{ id: string; distance: number } | null>((closest, venue) => {
    const distance = distanceBetween(venue.location, midpoint);
    if (!closest || distance < closest.distance) return { id: venue.id, distance };
    return closest;
  }, null)?.id;
}

function findShortestCombinedVenueId(venues: ScoredVenue[]) {
  return venues.reduce<{ id: string; total: number } | null>((shortest, venue) => {
    if (typeof venue.totalTravelMinutes !== "number") return shortest;
    if (!shortest || venue.totalTravelMinutes < shortest.total) {
      return { id: venue.id, total: venue.totalTravelMinutes };
    }
    return shortest;
  }, null)?.id;
}

function distanceBetween(a: LatLng, b: LatLng) {
  const lat = a.lat - b.lat;
  const lng = a.lng - b.lng;
  return Math.sqrt(lat * lat + lng * lng);
}
