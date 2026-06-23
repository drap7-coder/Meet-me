import { Logo } from "@/app/components/Logo";
import { BRAND } from "@/src/config/branding";

export function MarketingHero() {
  return (
    <div className="w-full min-w-0">
      <div className="flex w-full min-w-0 items-center gap-3 sm:gap-5">
        <Logo size="hero" onDark className="shrink-0" />
        <div className="min-w-0 flex-1">
          <h1 className="font-semibold tracking-[-0.04em]">
            <span className="block text-[clamp(2rem,9vw,3.25rem)] leading-[0.95] text-white">{BRAND.heroHeadlineLead}</span>
            <span className="mt-1 block text-[clamp(2rem,9vw,3.25rem)] leading-[0.95]">
              <span className="text-koi">{BRAND.heroHeadlineAccent}</span>
              <span className="text-white"> {BRAND.heroHeadlineTail}</span>
            </span>
          </h1>
          <p className="mt-3 max-w-md text-sm font-medium leading-6 text-white/60 sm:text-[0.9375rem] sm:leading-7">
            {BRAND.heroSubheadline}
          </p>
        </div>
      </div>
    </div>
  );
}
