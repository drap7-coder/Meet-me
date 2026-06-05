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
    <main className="min-h-screen bg-mint text-ink">
      <SiteHeader />

      <section className="px-4 pb-10 pt-[max(88px,calc(env(safe-area-inset-top)+76px))] sm:px-6 sm:pt-[max(72px,calc(env(safe-area-inset-top)+64px))] lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-7 pb-8 sm:gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:pb-16">
            <div>
              <h1 className="max-w-4xl text-[2.75rem] font-black leading-[0.98] tracking-tight text-ink sm:text-6xl sm:leading-[1.02] lg:text-7xl">
                Meet somewhere fair.
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-slate sm:mt-6 sm:text-xl sm:leading-8">
                Enter two starting points and discover great places right in the middle.
              </p>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate">
                Restaurants, coffee shops, bars, bookstores, parks, and more.
              </p>
              <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:gap-3">
                <a
                  href="#search"
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-clay px-5 text-base font-bold text-white shadow-glow transition hover:bg-[#174FE0] sm:h-12"
                >
                  Find the Middle
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-paper px-5 text-base font-bold text-ink shadow-[0_8px_22px_rgba(17,17,17,0.04)] transition hover:border-ink/30 sm:h-12"
                >
                  How It Works
                </a>
              </div>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate">
                Meet Me Halfway is currently in beta. We're improving recommendations and adding new features every week.
              </p>
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
          <div className="mt-5 rounded-lg border border-clay/25 bg-clay/10 p-4 text-sm font-semibold text-clay">
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
                  <p className="text-sm font-bold uppercase tracking-wide text-clay">{resultCountLabel}</p>
                  <h2 className="mt-1 text-3xl font-black text-ink">Places worth meeting at</h2>
                  <p className="mt-1 text-sm text-ink/60">
                    {results.originA.formattedAddress} → {results.originB.formattedAddress}
                  </p>
                </div>
                {shareMessage ? <p className="text-sm font-semibold text-clay">{shareMessage}</p> : null}
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

      <FeedbackSection />
      <Footer />
    </main>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-mint/86 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
        <a href="/" className="inline-flex min-w-0 items-center gap-2.5" aria-label="Meet Me Halfway home">
          <span className="truncate text-base font-black tracking-tight text-ink sm:text-lg">Meet Me Halfway</span>
          <span className="rounded-md border border-line bg-paper px-1.5 py-0.5 text-[0.65rem] font-black tracking-wide text-slate">
            BETA
          </span>
        </a>
        <a
          href="#search"
          className="inline-flex h-9 items-center justify-center rounded-lg bg-ink px-4 text-sm font-bold text-white shadow-[0_10px_24px_rgba(17,17,17,0.12)] transition hover:bg-ink/85"
        >
          Start
        </a>
      </div>
    </header>
  );
}

function HeroVisual() {
  return (
    <div className="relative min-h-[300px] overflow-hidden rounded-[24px] border border-black/[0.06] bg-[#F7F8FB] p-5 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.03),0_16px_42px_rgba(17,17,17,0.08)] sm:min-h-[420px] sm:p-6">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.052)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.052)_1px,transparent_1px)] bg-[size:76px_76px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(31,94,255,0.24),transparent_13%)]" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 390 300" aria-hidden="true" preserveAspectRatio="none">
        <path
          d="M18 214 C88 174 116 198 184 150 S292 102 372 130"
          fill="none"
          stroke="rgba(17,17,17,0.15)"
          strokeLinecap="round"
          strokeWidth="3"
        />
        <path
          d="M28 108 C104 88 150 112 194 146 S288 214 362 176"
          fill="none"
          stroke="rgba(31,94,255,0.26)"
          strokeLinecap="round"
          strokeWidth="2"
        />
      </svg>
      <div className="absolute left-[13%] top-[28%] h-3.5 w-3.5 rounded-full bg-ink shadow-[0_0_0_7px_rgba(17,17,17,0.06)]" />
      <div className="absolute right-[13%] top-[31%] h-3.5 w-3.5 rounded-full bg-ink shadow-[0_0_0_7px_rgba(17,17,17,0.06)]" />
      <div className="absolute left-1/2 top-[45%] h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-clay shadow-[0_0_0_12px_rgba(31,94,255,0.14),0_18px_42px_rgba(31,94,255,0.26)]" />
      <div className="absolute left-[30%] top-[56%] h-2 w-2 rounded-full bg-ink/30" />
      <div className="absolute right-[27%] top-[54%] h-2 w-2 rounded-full bg-ink/30" />

      <div className="absolute left-5 right-5 top-12 rounded-[24px] border border-black/[0.06] bg-white/95 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.16),0_2px_8px_rgba(15,23,42,0.08)] backdrop-blur-md sm:bottom-6 sm:left-6 sm:right-6 sm:top-auto sm:p-6">
        <p className="text-sm font-bold text-clay">Skip the back-and-forth.</p>
        <h2 className="mt-2 text-xl font-black tracking-tight text-ink sm:text-2xl">Meet somewhere fair, fast.</h2>
        <p className="mt-3 text-sm leading-6 text-slate">
          Enter two starting points and we’ll find places that keep the trip balanced for everyone.
        </p>
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
    <section id="how-it-works" className="bg-sky px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-wide text-clay">How it works</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-ink sm:text-5xl">Plans without the group text.</h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map(([title, copy], index) => (
            <article key={title} className="rounded-lg border border-line bg-paper p-6 shadow-soft">
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
            <article key={card} className="rounded-lg border border-line bg-paper p-6 shadow-soft">
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
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-lg bg-ink px-6 py-14 text-white shadow-soft sm:px-10 lg:px-14">
        <h2 className="max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">Halfway isn’t compromise.</h2>
        <p className="mt-5 max-w-2xl text-xl leading-8 text-white/70">
          It’s the simplest way to make plans fair, easy, and actually happen.
        </p>
      </div>
    </section>
  );
}

function FeedbackSection() {
  const feedbackHref =
    "mailto:nathandrapkin@gmail.com?subject=Meet%20Me%20Halfway%20feedback&body=What%20worked%3A%0A%0AWhat%20felt%20confusing%3A%0A%0AWhat%20I%27d%20like%20you%20to%20add%3A%0A";

  return (
    <section className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-lg border border-line bg-paper p-6 shadow-soft sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-clay">Beta feedback</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-ink sm:text-4xl">
              Help shape Meet Me Halfway.
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate">
              We're actively building this product and would love your feedback.
            </p>
            <div className="mt-5 grid gap-2 text-sm font-semibold text-slate sm:grid-cols-3">
              <span className="rounded-lg border border-line bg-sky px-3 py-2">What worked</span>
              <span className="rounded-lg border border-line bg-sky px-3 py-2">What felt confusing</span>
              <span className="rounded-lg border border-line bg-sky px-3 py-2">What you'd like us to add</span>
            </div>
          </div>
          <a
            href={feedbackHref}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-clay px-5 text-sm font-bold text-white shadow-glow transition hover:bg-[#174FE0]"
          >
            Send Feedback
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const feedbackHref =
    "mailto:nathandrapkin@gmail.com?subject=Meet%20Me%20Halfway%20feedback&body=Questions%2C%20ideas%2C%20or%20feedback%3A%0A";

  return (
    <footer className="border-t border-line px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 text-sm text-slate sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-base font-black text-ink">Meet Me Halfway</p>
          <p className="mt-1 font-semibold">Currently in Beta</p>
          <p className="mt-3 max-w-sm leading-6">Made to make meeting up easier.</p>
        </div>
        <div className="sm:text-right">
          <p className="leading-6">Questions, ideas, or feedback?</p>
          <p className="leading-6">We'd love to hear from you.</p>
          <a href={feedbackHref} className="mt-3 inline-flex font-bold text-clay hover:text-[#174FE0]">
            Send Feedback -&gt;
          </a>
        </div>
      </div>
    </footer>
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
