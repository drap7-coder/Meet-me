import { Logo } from "@/app/components/Logo";
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

export function Footer() {
  const feedbackHref = `mailto:nathandrapkin@gmail.com?subject=${encodeURIComponent(
    `${BRAND.name} feedback`
  )}&body=${encodeURIComponent("Questions, ideas, or feedback:\n")}`;

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
          <a href={feedbackHref} className="mt-3 inline-flex font-bold text-koi hover:text-koi/80">
            Send Feedback -&gt;
          </a>
        </div>
      </div>
    </footer>
  );
}
