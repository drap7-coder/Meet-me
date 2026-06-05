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
  const [hasSearched, setHasSearched] = useState(false);

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
    setHasSearched(true);
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

  function startNewSearch() {
    setResults(null);
    setError("");
    setShareMessage("");
    setHasSearched(false);
    window.history.replaceState(null, "", "/");
    window.requestAnimationFrame(() => document.getElementById("search")?.scrollIntoView({ behavior: "smooth" }));
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

      {!hasSearched && !results && !loading ? (
        <>
          <section className="relative isolate overflow-hidden bg-mint px-4 pb-8 pt-[max(72px,calc(env(safe-area-inset-top)+64px))] sm:px-6 sm:pb-10 lg:px-8">
            <div className="relative z-10 mx-auto max-w-7xl">
              <MarketingHero />
            </div>
          </section>
          <section id="search" className="bg-mint px-4 pb-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
              <LocationForm form={form} loading={loading} onChange={setForm} onSubmit={submitSearch} />
            </div>
          </section>
        </>
      ) : null}

      <div className="bg-mint px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {hasSearched || results || loading ? (
            <CompactResultsHeader
              loading={loading}
              resultCountLabel={resultCountLabel}
              originSummary={results ? `${results.originA.formattedAddress} → ${results.originB.formattedAddress}` : ""}
              onNewSearch={startNewSearch}
            />
          ) : null}

          {error ? (
            <div className="mt-5 rounded-lg border border-[#C9D7FF] bg-[#EEF3FF] p-4 text-sm font-semibold text-clay">
              {error}
            </div>
          ) : null}

          {error && !loading && !results ? (
            <section id="search" className="mt-5 max-w-5xl">
              <LocationForm form={form} loading={loading} onChange={setForm} onSubmit={submitSearch} />
            </section>
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
          <section className="mt-5 grid gap-5 pb-16 lg:grid-cols-[1fr_420px] lg:items-start">
            <div>
              {shareMessage ? <p className="mb-4 text-sm font-semibold text-clay">{shareMessage}</p> : null}

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

      {!hasSearched && !results && !loading ? (
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

function MarketingHero() {
  return (
    <section className="grid gap-7 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
      <div className="order-1">
        <h1 className="max-w-2xl text-[2.75rem] font-black leading-[0.98] tracking-tight text-ink sm:text-6xl sm:leading-[1.02] lg:text-7xl">
          Where should we meet?
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-7 text-slate sm:mt-6 sm:text-xl sm:leading-8">
          Meet Me Halfway finds the perfect place between two people, so nobody gets stuck with the long drive.
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
      </div>

      <div className="order-3 overflow-hidden rounded-[24px] border border-black/[0.06] bg-paper shadow-soft lg:order-2">
        <img
          src="/homepage-hero.png"
          alt="Meet Me Halfway hero illustration"
          className="block aspect-[3/2] h-auto w-full object-cover object-center lg:aspect-[1.42/1]"
        />
      </div>
    </section>
  );
}

function CompactResultsHeader({
  loading,
  resultCountLabel,
  originSummary,
  onNewSearch
}: {
  loading: boolean;
  resultCountLabel: string;
  originSummary: string;
  onNewSearch: () => void;
}) {
  return (
    <section className="pt-[max(72px,calc(env(safe-area-inset-top)+64px))]">
      <div className="rounded-lg border border-line bg-paper p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-clay">
              {loading ? "Finding places" : resultCountLabel || "Recommended places"}
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-ink sm:text-4xl">Recommended places</h1>
            {originSummary ? <p className="mt-2 text-sm leading-6 text-slate">{originSummary}</p> : null}
          </div>
          <button
            type="button"
            onClick={onNewSearch}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-line bg-paper px-4 text-sm font-bold text-ink transition hover:border-clay hover:text-clay"
          >
            New search
          </button>
        </div>
      </div>
    </section>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-mint pt-[env(safe-area-inset-top)]">
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
          <h2 className="mt-3 text-4xl font-black tracking-tight text-ink sm:text-5xl">Put in two places. Pick somewhere good.</h2>
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
            className="inline-flex h-11 items-center justify-center rounded-lg bg-clay px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(17,17,17,0.12)] transition hover:bg-[#174FE0]"
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
