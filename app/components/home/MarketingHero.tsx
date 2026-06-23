import { Logo } from "@/app/components/Logo";
import { BRAND } from "@/src/config/branding";

export function MarketingHero() {
  return (
    <div className="relative w-full min-w-0">
      <div className="flex items-start justify-between gap-3 pr-1">
        <div className="min-w-0 flex-1 pt-1">
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
        <Logo size="md" onDark bare className="pointer-events-none hidden shrink-0 opacity-95 sm:block" />
      </div>
      <Logo
        size="sm"
        onDark
        bare
        className="pointer-events-none absolute -right-1 top-0 opacity-90 sm:hidden"
      />
    </div>
  );
}
