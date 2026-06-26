import { Logo } from "@/app/components/Logo";
import { FeedbackTrigger } from "@/app/components/home/FeedbackTrigger";
import { BRAND } from "@/src/config/branding";
import { PAGE_CONTAINER } from "@/lib/pageLayout";

type SiteHeaderProps = {
  variant?: "light" | "dark";
};

export function SiteHeader({ variant = "light" }: SiteHeaderProps) {
  const onDark = variant === "dark";

  return (
    <header
      className={
        onDark
          ? "sticky top-0 z-50 border-b border-white/10 bg-ink/90 pt-[env(safe-area-inset-top)] backdrop-blur-md"
          : "sticky top-0 z-50 border-b border-line/80 bg-paper/90 pt-[env(safe-area-inset-top)] shadow-[0_1px_0_rgba(10,19,35,0.06)] backdrop-blur-sm"
      }
    >
      <div className={`flex h-[52px] w-full items-center justify-between gap-2 sm:h-[56px] sm:gap-3 ${PAGE_CONTAINER}`}>
        <a
          href="/"
          className="group inline-flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5"
          aria-label={`${BRAND.displayName} home`}
        >
          {onDark ? (
            <Logo variant="lockup" size="sm" onDark />
          ) : (
            <Logo variant="mark" size="sm" className="transition group-hover:opacity-90" />
          )}
        </a>
        <a
          href="#ask-koi"
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-koi px-3.5 text-xs font-black text-white shadow-[0_8px_18px_rgba(255,90,0,0.24)] transition hover:bg-koi-hover focus:outline-none focus:ring-4 focus:ring-koi/25 sm:h-10 sm:px-5 sm:text-sm"
        >
          {BRAND.askLabel}
        </a>
      </div>
    </header>
  );
}

export function CompactHeader({ variant = "light" }: SiteHeaderProps) {
  const onDark = variant === "dark";

  return (
    <header className="sticky top-0 z-[70] bg-transparent pt-[env(safe-area-inset-top)]">
      <div className={`flex h-12 w-full items-center sm:h-14 ${PAGE_CONTAINER}`}>
        <nav className="flex w-full items-center justify-between gap-3" aria-label="Primary">
          <a
            href="/"
            className={
              onDark
                ? "group inline-flex min-w-0 items-center rounded-full bg-ink/20 px-1.5 py-1 text-white/90 backdrop-blur-md transition hover:bg-white/10"
                : "group inline-flex min-w-0 items-center rounded-full bg-paper/45 px-1.5 py-1 text-ink backdrop-blur-md transition hover:bg-paper/80"
            }
            aria-label={`${BRAND.displayName} home`}
          >
            <Logo
              variant="lockup"
              size="sm"
              onDark={onDark}
              className="gap-1.5 sm:gap-2 [&_.font-serif]:!text-sm sm:[&_.font-serif]:!text-base [&_img]:!h-6 [&_img]:!w-6 sm:[&_img]:!h-7 sm:[&_img]:!w-7"
            />
          </a>
          <a
            href="#ask-koi"
            className={
              onDark
                ? "inline-flex h-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 px-3 text-xs font-black text-white shadow-[0_8px_18px_rgba(0,0,0,0.16)] backdrop-blur-md transition hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-koi/25 sm:h-9 sm:px-4"
                : "inline-flex h-8 shrink-0 items-center justify-center rounded-full border border-ink/10 bg-paper/80 px-3 text-xs font-black text-ink shadow-[0_8px_18px_rgba(10,19,35,0.10)] backdrop-blur-md transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-koi/20 sm:h-9 sm:px-4"
            }
          >
            {BRAND.askLabel}
          </a>
        </nav>
      </div>
    </header>
  );
}

export function LogoHomeHeader({ variant = "light" }: SiteHeaderProps) {
  const onDark = variant === "dark";

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-[70] bg-transparent pt-[env(safe-area-inset-top)]">
      <div className={`flex h-12 w-full items-center sm:h-14 ${PAGE_CONTAINER}`}>
        <a
          href="/"
          className={
            onDark
              ? "pointer-events-auto group inline-flex items-center rounded-full bg-white/10 p-1.5 text-white backdrop-blur-md transition hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-koi/25"
              : "pointer-events-auto group inline-flex items-center rounded-full bg-white/80 p-1.5 text-ink shadow-[0_8px_24px_rgba(10,19,35,0.10)] backdrop-blur-md transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-koi/20"
          }
          aria-label={`${BRAND.displayName} home`}
        >
          <Logo
            variant="mark"
            size="sm"
            onDark={onDark}
            className="[&_img]:!h-7 [&_img]:!w-7 sm:[&_img]:!h-8 sm:[&_img]:!w-8"
          />
        </a>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-ink py-10 text-[#B8B0A3]">
      <div className={`flex flex-col gap-6 text-sm sm:flex-row sm:items-end sm:justify-between ${PAGE_CONTAINER}`}>
        <div>
          <Logo variant="lockup" size="sm" className="[&_.font-serif]:text-white" />
          <p className="mt-3 font-semibold text-white/90">Currently in Beta</p>
          <p className="mt-3 max-w-sm leading-6">{BRAND.footerDescription}</p>
        </div>
        <div className="sm:text-right">
          <p className="leading-6">Questions, ideas, or feedback?</p>
          <p className="leading-6">We&apos;d love to hear from you.</p>
          <FeedbackTrigger />
        </div>
      </div>
    </footer>
  );
}
