"use client";

import { EmptyState } from "@/app/components/EmptyState";
import { LocationForm } from "@/app/components/LocationForm";
import { ResultsMap } from "@/app/components/ResultsMap";
import { VenueCard } from "@/app/components/VenueCard";
import { WeatherCard } from "@/app/components/WeatherCard";
import {
  clearRecentMeetups,
  createRecentMeetup,
  formatRecentMeetupDate,
  getRecentMeetupCategoryLabel,
  getRecentMeetups,
  recentMeetupToForm,
  saveRecentMeetup,
  type RecentMeetup
} from "@/lib/recentMeetups";
import { getPreferenceLabel, parsePreferences } from "@/lib/preferences";
import { shareWithFallback } from "@/lib/share";
import { trackEvent } from "@/lib/analytics";
import type { LatLng, ScoredVenue, SearchHalfwayRequest, SearchHalfwayResponse, VenueCategory } from "@/lib/types";
import { BRAND } from "@/src/config/branding";
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
  const [currentShareUrl, setCurrentShareUrl] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [recentMeetups, setRecentMeetups] = useState<RecentMeetup[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const locationA = params.get("a") ?? "";
    const locationAPlaceId = params.get("aPlaceId") ?? undefined;
    const locationB = params.get("b") ?? "";
    const locationBPlaceId = params.get("bPlaceId") ?? undefined;
    const category = (params.get("category") as VenueCategory | null) ?? "restaurant";
    const customQuery = params.get("q") ?? "";
    const preferences = parsePreferences(params.get("preferences"));
    const shareId = params.get("shareId");
    const shouldAutoSearch = params.get("auto") === "1";
    if (locationA || locationB || customQuery) {
      const nextForm = { locationA, locationAPlaceId, locationB, locationBPlaceId, category, customQuery, preferences };
      setForm(nextForm);
      if (shareId) {
        const shareUrl = `${window.location.origin}/s/${shareId}`;
        setCurrentShareUrl(shareUrl);
        trackEvent("share_link_opened", {
          category,
          hasPreferences: preferences.length > 0
        });
      }
      if (shouldAutoSearch && locationA && locationB) {
        submitSearch(nextForm, shareId ? `${window.location.origin}/s/${shareId}` : undefined);
      }
    }
  }, []);

  useEffect(() => {
    setRecentMeetups(getRecentMeetups());
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

  async function submitSearch(searchForm: SearchHalfwayRequest = form, existingShareUrl?: string) {
    setHasSearched(true);
    setLoading(true);
    setError("");
    setShareMessage("");
    trackEvent("search_started", {
      category: searchForm.category,
      hasPreferences: Boolean(searchForm.preferences?.length)
    });
    try {
      const response = await fetch("/api/search-halfway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchForm)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Search failed.");
      setResults(data);
      const shareUrl = updateShareUrl(searchForm);
      setCurrentShareUrl(existingShareUrl ?? shareUrl);
      setRecentMeetups(saveRecentMeetup(createRecentMeetup(searchForm, data, shareUrl)));
      trackEvent("search_completed", {
        category: data.category,
        resultCount: data.venues.length,
        hasWeather: true,
        hasPreferences: data.preferences.length > 0
      });
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
    setCurrentShareUrl("");
    setHasSearched(false);
    window.history.replaceState(null, "", "/");
    window.requestAnimationFrame(() => document.getElementById("search")?.scrollIntoView({ behavior: "smooth" }));
  }

  function rerunRecentMeetup(meetup: RecentMeetup) {
    const nextForm = recentMeetupToForm(meetup);
    setForm(nextForm);
    submitSearch(nextForm);
  }

  function clearRecent() {
    clearRecentMeetups();
    setRecentMeetups([]);
  }

  async function shareVenue(venue: ScoredVenue) {
    const text = `${venue.name} looks like a good halfway spot: ${formatMinutes(venue.travelFromA.durationMinutes)} for one of you, ${formatMinutes(venue.travelFromB.durationMinutes)} for the other. ${venue.googleMapsUri}`;
    const result = await shareWithFallback({ title: BRAND.name, text, url: venue.googleMapsUri });
    if (result === "shared") setShareMessage("");
    if (result === "copied") setShareMessage("Spot copied to clipboard.");
    if (result === "email") setShareMessage("Email draft opened.");
    if (result === "cancelled") setShareMessage("Sharing was cancelled.");
  }

  async function shareMeetup() {
    if (!results) return;
    setShareMessage("Creating meetup link...");
    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form,
          results,
          selectedResultIds: results.venues.slice(0, 5).map((venue) => venue.id)
        })
      });
      const data = (await response.json()) as { shareUrl?: string; error?: string };
      if (!response.ok || !data.shareUrl) throw new Error(data.error ?? "Share link creation failed.");

      setCurrentShareUrl(data.shareUrl);
      const text = `Here are places that could work between ${shortLocationLabel(results.originA.formattedAddress)} and ${shortLocationLabel(results.originB.formattedAddress)}.`;
      const result = await shareWithFallback({ title: `${BRAND.name} meetup`, text, url: data.shareUrl });
      if (result === "shared" || result === "copied") setShareMessage("Meetup link copied.");
      if (result === "email") setShareMessage("Email draft opened.");
      if (result === "cancelled") setShareMessage("Sharing was cancelled.");
      trackEvent("share_link_created", {
        category: results.category,
        resultCount: results.venues.length,
        hasPreferences: results.preferences.length > 0
      });
    } catch (error) {
      console.warn("[share] Falling back to URL search sharing.", error);
      const fallbackUrl = currentShareUrl || window.location.href;
      const result = await shareWithFallback({
        title: `${BRAND.name} meetup`,
        text: "Here is the Halfway search.",
        url: fallbackUrl
      });
      if (result === "shared" || result === "copied") setShareMessage("Search link copied.");
      if (result === "email") setShareMessage("Email draft opened.");
      if (result === "cancelled") setShareMessage("Sharing was cancelled.");
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
            <div className="mx-auto grid max-w-5xl gap-5">
              <LocationForm form={form} loading={loading} onChange={setForm} onSubmit={submitSearch} />
              <RecentMeetupsSection meetups={recentMeetups} onSelect={rerunRecentMeetup} onClear={clearRecent} />
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
              canShareOptions={Boolean(results?.venues.length)}
              onShareOptions={shareMeetup}
              onNewSearch={startNewSearch}
            />
          ) : null}

          {error ? (
            <div className="mt-5 rounded-lg border border-[#C9D7FF] bg-[#EEF3FF] p-4 text-sm font-semibold text-clay">
              {error}
            </div>
          ) : null}

          {error && !loading && !results ? (
            <section id="search" className="mt-5 grid max-w-5xl gap-5">
              <LocationForm form={form} loading={loading} onChange={setForm} onSubmit={submitSearch} />
              <RecentMeetupsSection meetups={recentMeetups} onSelect={rerunRecentMeetup} onClear={clearRecent} />
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
            {results.venues.length ? (
              <div className="order-1 lg:order-2">
                <ResultsMap
                  originA={results.originA}
                  originB={results.originB}
                  midpoint={results.midpoint}
                  venues={results.venues}
                />
              </div>
            ) : null}

            <div className="order-2 grid gap-5 lg:order-1">
              {shareMessage ? <p className="mb-4 text-sm font-semibold text-clay">{shareMessage}</p> : null}

              <WeatherCard midpoint={results.midpoint} />

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
                      shareUrl={currentShareUrl}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </div>
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
    <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
      <div className="order-1">
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-clay">Two people. One destination. Equal effort.</p>
        <h1 className="max-w-2xl text-[3.1rem] font-black leading-[0.94] tracking-tight text-ink sm:text-6xl sm:leading-[0.98] lg:text-7xl">
          Meet in the middle.
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-7 text-slate sm:mt-6 sm:text-xl sm:leading-8">
          {BRAND.heroSubheadline}
        </p>
        <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:gap-3">
          <a
            href="#search"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-clay px-5 text-base font-bold text-white shadow-glow transition hover:bg-[#174FE0] sm:h-12"
          >
            Find a Halfway Spot
          </a>
          <a
            href="#how-it-works"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-paper px-5 text-base font-bold text-ink shadow-[0_8px_22px_rgba(17,17,17,0.04)] transition hover:border-ink/30 sm:h-12"
          >
            See How It Works
          </a>
        </div>
      </div>

      <ProductDemoVisual />
    </section>
  );
}

function ProductDemoVisual() {
  return (
    <div className="order-3 lg:order-2">
      <div className="relative min-h-[330px] overflow-hidden rounded-[28px] border border-line bg-[#FAFBFD] shadow-soft sm:min-h-[500px]">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            backgroundImage:
              "linear-gradient(rgba(17,17,17,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(17,17,17,0.045) 1px, transparent 1px), radial-gradient(circle at 50% 55%, rgba(31,94,255,0.16), transparent 22%)",
            backgroundSize: "54px 54px, 54px 54px, auto"
          }}
        />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 760 520" aria-hidden="true">
          <path d="M120 140 C210 180 245 250 335 285 C390 306 420 340 465 385" fill="none" stroke="#1F5EFF" strokeWidth="12" strokeLinecap="round" />
          <path d="M640 170 C560 210 550 282 474 348 C454 365 444 377 430 392" fill="none" stroke="#7C3AED" strokeWidth="12" strokeLinecap="round" />
          <path d="M120 140 C210 180 245 250 335 285 C390 306 420 340 465 385" fill="none" stroke="rgba(255,255,255,0.76)" strokeWidth="3" strokeDasharray="16 16" strokeLinecap="round" />
          <path d="M640 170 C560 210 550 282 474 348 C454 365 444 377 430 392" fill="none" stroke="rgba(255,255,255,0.76)" strokeWidth="3" strokeDasharray="16 16" strokeLinecap="round" />
        </svg>

        <div className="absolute left-4 top-5 rounded-2xl border border-line bg-white/95 p-3 shadow-[0_16px_38px_rgba(17,17,17,0.1)] backdrop-blur sm:left-8 sm:top-10 sm:p-4">
          <p className="text-sm font-black text-ink sm:text-base">Hoboken, NJ</p>
          <p className="mt-1 text-lg font-black text-clay">24 min</p>
          <p className="mt-1 text-xs font-semibold text-slate">10.8 miles</p>
        </div>

        <div className="absolute right-4 top-10 rounded-2xl border border-line bg-white/95 p-3 shadow-[0_16px_38px_rgba(17,17,17,0.1)] backdrop-blur sm:right-8 sm:top-16 sm:p-4">
          <p className="text-sm font-black text-ink sm:text-base">Edison, NJ</p>
          <p className="mt-1 text-lg font-black text-[#6D28D9]">26 min</p>
          <p className="mt-1 text-xs font-semibold text-slate">12.4 miles</p>
        </div>

        <div className="absolute left-[17%] top-[36%] grid h-12 w-12 place-items-center rounded-full bg-clay text-white shadow-glow sm:h-14 sm:w-14">
          <span className="h-5 w-5 rounded-full border-[5px] border-white" />
        </div>
        <div className="absolute right-[10%] top-[42%] grid h-12 w-12 place-items-center rounded-full bg-[#6D28D9] text-white shadow-[0_16px_34px_rgba(109,40,217,0.24)] sm:h-14 sm:w-14">
          <span className="h-5 w-5 rounded-full border-[5px] border-white" />
        </div>

        <div className="absolute bottom-4 left-1/2 w-[min(90%,340px)] -translate-x-1/2 rounded-[24px] border border-black/[0.06] bg-white p-4 text-center shadow-[0_24px_70px_rgba(17,17,17,0.16)] sm:bottom-8 sm:p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-clay">Best Match</p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-ink sm:mt-2 sm:text-2xl">Sunset Coffee Co.</h2>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-bold text-ink">
            <span className="rounded-lg bg-sky px-3 py-2">Hoboken: 24 min</span>
            <span className="rounded-lg bg-sky px-3 py-2">Edison: 26 min</span>
          </div>
          <p className="mt-3 text-sm font-semibold text-slate">Great coffee - Free parking - Highly rated</p>
        </div>
      </div>
    </div>
  );
}

function CompactResultsHeader({
  loading,
  resultCountLabel,
  originSummary,
  canShareOptions,
  onShareOptions,
  onNewSearch
}: {
  loading: boolean;
  resultCountLabel: string;
  originSummary: string;
  canShareOptions: boolean;
  onShareOptions: () => void;
  onNewSearch: () => void;
}) {
  return (
    <section className="pt-[max(72px,calc(env(safe-area-inset-top)+64px))]">
      <div className="rounded-lg border border-line bg-paper p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-clay">{BRAND.name}</p>
            <p className="mt-2 text-sm font-bold uppercase tracking-wide text-clay">
              {loading ? "Finding places" : resultCountLabel || "Recommended places"}
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-ink sm:text-4xl">Recommended places</h1>
            {originSummary ? <p className="mt-2 text-sm leading-6 text-slate">{originSummary}</p> : null}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {canShareOptions ? (
              <button
                type="button"
                onClick={onShareOptions}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-clay px-4 text-sm font-bold text-white transition hover:bg-[#174FE0]"
              >
                Share this meetup
              </button>
            ) : null}
            <button
              type="button"
              onClick={onNewSearch}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-line bg-paper px-4 text-sm font-bold text-ink transition hover:border-clay hover:text-clay"
            >
              New search
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-mint pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
        <a href="/" className="inline-flex min-w-0 items-center gap-2.5" aria-label={`${BRAND.name} home`}>
          <span className="truncate text-base font-black tracking-tight text-ink sm:text-lg">{BRAND.name}</span>
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
    ["Fair for Both People", "Nearly equal travel times so nobody gets stuck with the long drive."],
    ["Best Local Places", "Restaurants, coffee shops, bars, bookstores, golf courses, and more."],
    ["Save Time", "Stop comparing locations manually."],
    ["Just Meet", "Pick a place and go."]
  ];

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-wide text-clay">Why it works</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-ink sm:text-5xl">
            Equal effort, better plans.
          </h2>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([title, copy]) => (
            <article key={title} className="rounded-[22px] border border-line bg-paper p-6 shadow-[0_12px_30px_rgba(17,17,17,0.05)]">
              <p className="text-xl font-black text-ink">{title}</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate">{copy}</p>
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
          It’s the simplest way to make plans easier, faster, and actually happen.
        </p>
      </div>
    </section>
  );
}

function FeedbackSection() {
  const feedbackHref = `mailto:nathandrapkin@gmail.com?subject=${encodeURIComponent(
    `${BRAND.name} feedback`
  )}&body=${encodeURIComponent("What worked:\n\nWhat felt confusing:\n\nWhat I'd like you to add:\n")}`;

  return (
    <section className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-lg border border-line bg-paper p-6 shadow-soft sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-clay">Beta feedback</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-ink sm:text-4xl">
              Help shape {BRAND.name}.
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
  const feedbackHref = `mailto:nathandrapkin@gmail.com?subject=${encodeURIComponent(
    `${BRAND.name} feedback`
  )}&body=${encodeURIComponent("Questions, ideas, or feedback:\n")}`;

  return (
    <footer className="border-t border-line px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 text-sm text-slate sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-base font-black text-ink">{BRAND.name}</p>
          <p className="mt-1 font-semibold">Currently in Beta</p>
          <p className="mt-3 max-w-sm leading-6">{BRAND.footerDescription}</p>
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

function RecentMeetupsSection({
  meetups,
  onSelect,
  onClear
}: {
  meetups: RecentMeetup[];
  onSelect: (meetup: RecentMeetup) => void;
  onClear: () => void;
}) {
  if (!meetups.length) return null;

  return (
    <section className="rounded-lg border border-line bg-paper p-5 shadow-soft sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-clay">Recent Meetups</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-ink">Pick up where you left off.</h2>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg border border-line bg-mint px-3 py-2 text-sm font-bold text-slate transition hover:border-clay hover:text-clay"
        >
          Clear
        </button>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {meetups.slice(0, 5).map((meetup) => (
          <button
            key={meetup.id}
            type="button"
            onClick={() => onSelect(meetup)}
            className="rounded-lg border border-line bg-mint p-4 text-left shadow-[0_8px_22px_rgba(17,17,17,0.04)] transition hover:-translate-y-0.5 hover:border-clay hover:bg-white hover:shadow-soft"
          >
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sky text-lg" aria-hidden="true">
                {categoryIcon(meetup.category)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-black text-ink">
                  {shortLocationLabel(meetup.originA)} ↔ {shortLocationLabel(meetup.originB)}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate">
                  {getRecentMeetupCategoryLabel(meetup)} · {formatRecentMeetupDate(meetup.timestamp)}
                </p>
                {meetup.preferences?.length ? (
                  <p className="mt-1 truncate text-xs font-semibold text-clay">
                    {meetup.preferences.map(getPreferenceLabel).join(" + ")}
                  </p>
                ) : null}
                <p className="mt-2 text-xs font-semibold text-slate">Tap to meet here again</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function categoryIcon(category: VenueCategory) {
  const icons: Record<VenueCategory, string> = {
    coffee: "☕",
    restaurant: "🍽",
    bar: "◐",
    bookstore: "▰",
    driving_range: "◉",
    park: "⌁",
    dessert: "✦",
    custom: "•"
  };
  return icons[category];
}

function updateShareUrl(form: SearchHalfwayRequest) {
  const params = new URLSearchParams();
  if (form.locationA) params.set("a", form.locationA);
  if (form.locationAPlaceId) params.set("aPlaceId", form.locationAPlaceId);
  if (form.locationB) params.set("b", form.locationB);
  if (form.locationBPlaceId) params.set("bPlaceId", form.locationBPlaceId);
  params.set("category", form.category);
  if (form.customQuery) params.set("q", form.customQuery);
  if (form.preferences?.length) params.set("preferences", form.preferences.join(","));
  const path = `/?${params.toString()}`;
  window.history.replaceState(null, "", path);
  return `${window.location.origin}${path}`;
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
