import { Logo } from "@/app/components/Logo";
import { BRAND } from "@/src/config/branding";

export function MarketingHero() {
  return (
    <div className="w-full min-w-0">
      <div className="flex w-full min-w-0 items-center gap-4 sm:gap-5">
        <Logo size="hero" onDark className="shrink-0" />
        <div className="min-w-0 flex-1">
          <h1 className="font-semibold tracking-[-0.045em]">
            <span className="block text-[clamp(2.125rem,8vw,3.5rem)] leading-[0.9] text-white">
              {BRAND.heroHeadlineLead}
            </span>
            <span className="mt-1.5 block text-[clamp(2.125rem,8vw,3.5rem)] leading-[0.9]">
              <span className="text-white/90">where to </span>
              <span className="text-koi">meet.</span>
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-[0.9375rem] font-normal leading-6 tracking-[-0.01em] text-[#B8B0A3] sm:text-base sm:leading-7">
            <span className="block">{BRAND.heroSubheadline}</span>
            <span className="mt-1 block text-white/55">{BRAND.heroSubheadlineTagline}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
