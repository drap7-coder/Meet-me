"use client";

import { HeroSectionLabel } from "@/app/components/home/HeroSectionLabel";

type PreviewCardProps = {
  emoji: string;
  title: string;
  subtitle: string;
  tone: "explore" | "streaming";
  samples: string[];
};

function PreviewCard({ emoji, title, subtitle, tone, samples }: PreviewCardProps) {
  return (
    <div
      className={`koi-mode-chip koi-mode-chip--${tone} pointer-events-none flex w-full min-w-0 flex-col gap-3 rounded-[1.35rem] px-3 py-4 opacity-90 min-h-[7.5rem] sm:min-h-[8rem]`}
      aria-hidden="true"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`koi-mode-chip__emoji koi-mode-chip__emoji--${tone} flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] text-[2rem] leading-none sm:h-[3.25rem] sm:w-[3.25rem] sm:text-[2.25rem]`}
        >
          {emoji}
        </span>
        <div className="grid min-w-0 gap-0.5 text-left">
          <span className="text-sm font-bold leading-tight text-white">{title}</span>
          <span className="text-[0.6875rem] font-medium leading-snug text-white/80">{subtitle}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {samples.map((sample) => (
          <span
            key={sample}
            className="rounded-full border border-white/12 bg-white/[0.06] px-2.5 py-1 text-[0.6875rem] font-semibold leading-none text-white/62"
          >
            {sample}
          </span>
        ))}
      </div>
    </div>
  );
}

export function OnboardingCapabilityPreview() {
  return (
    <section className="mx-auto grid w-full max-w-lg gap-2.5" aria-labelledby="onboarding-capability-title">
      <HeroSectionLabel subtle>What you&apos;ll unlock</HeroSectionLabel>
      <p id="onboarding-capability-title" className="sr-only">
        Preview of Explore and Streaming capabilities available after you set your location.
      </p>
      <div className="-mx-0.5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-0.5 pb-0.5 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible [&::-webkit-scrollbar]:hidden">
        <PreviewCard
          emoji="🧭"
          title="Explore"
          subtitle="Food, events & things to do"
          tone="explore"
          samples={["Italian near me", "Live music tonight"]}
        />
        <PreviewCard
          emoji="🍿"
          title="Streaming"
          subtitle="Movies & TV picks"
          tone="streaming"
          samples={["Funny on Netflix", "New sci-fi series"]}
        />
      </div>
      <p className="px-0.5 text-center text-[0.6875rem] font-medium leading-5 text-white/40">
        Set your location above to personalize these picks.
      </p>
    </section>
  );
}
