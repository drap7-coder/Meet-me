import { Logo } from "@/app/components/Logo";
import { BRAND } from "@/src/config/branding";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-paper/90 pt-[env(safe-area-inset-top)] shadow-[0_1px_0_rgba(10,19,35,0.06)] backdrop-blur-sm">
      <div className="mx-auto flex h-[56px] w-full max-w-7xl items-center justify-between gap-2 px-3 sm:h-[60px] sm:gap-3 sm:px-6 lg:px-8">
        <a href="/" className="group inline-flex min-w-0 flex-1 items-center gap-2 sm:gap-3" aria-label={`${BRAND.displayName} home`}>
          <Logo variant="mark" size="sm" className="transition group-hover:opacity-90" />
        </a>
        <a
          href="#ask-koi"
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-koi px-3 text-xs font-black text-white transition hover:bg-koi-hover focus:outline-none focus:ring-4 focus:ring-koi/25 sm:h-10 sm:px-5 sm:text-sm"
        >
          {BRAND.askLabel}
        </a>
      </div>
    </header>
  );
}

export function Footer() {
  const feedbackHref = `mailto:nathandrapkin@gmail.com?subject=${encodeURIComponent(
    `${BRAND.name} feedback`
  )}&body=${encodeURIComponent("Questions, ideas, or feedback:\n")}`;

  return (
    <footer className="bg-ink px-4 py-10 text-[#B8B0A3] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 text-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Logo variant="lockup" size="sm" className="[&_.font-serif]:text-white" />
          <p className="mt-3 font-semibold text-white/90">Currently in Beta</p>
          <p className="mt-3 max-w-sm leading-6">{BRAND.footerDescription}</p>
        </div>
        <div className="sm:text-right">
          <p className="leading-6">Questions, ideas, or feedback?</p>
          <p className="leading-6">We&apos;d love to hear from you.</p>
          <a href={feedbackHref} className="mt-3 inline-flex font-bold text-koi hover:text-koi/80">
            Send Feedback -&gt;
          </a>
        </div>
      </div>
    </footer>
  );
}
