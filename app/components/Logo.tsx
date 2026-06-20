import { BRAND } from "@/src/config/branding";

type LogoSize = "sm" | "md" | "lg" | "xl";
type LogoVariant = "mark" | "lockup";

type LogoProps = {
  variant?: LogoVariant;
  showTagline?: boolean;
  showEyebrow?: boolean;
  bare?: boolean;
  size?: LogoSize;
  className?: string;
};

const MARK_SIZE: Record<LogoSize, { image: string; tagline: string }> = {
  sm: {
    image: "h-12 w-12 sm:h-14 sm:w-14",
    tagline: "text-[0.65rem]"
  },
  md: {
    image: "h-14 w-14 sm:h-16 sm:w-16",
    tagline: "text-xs"
  },
  lg: {
    image: "h-20 w-20 sm:h-24 sm:w-24",
    tagline: "text-base sm:text-lg"
  },
  xl: {
    image: "h-40 w-40 sm:h-48 sm:w-48",
    tagline: "text-lg sm:text-xl"
  }
};

const LOCKUP_MARK_FRAME: Record<LogoSize, string> = {
  sm: "h-10 w-10 sm:h-11 sm:w-11",
  md: "h-10 w-10 sm:h-11 sm:w-11",
  lg: "h-14 w-14 sm:h-16 sm:w-16",
  xl: "h-14 w-14 sm:h-16 sm:w-16"
};

const LOCKUP_TITLE: Record<LogoSize, string> = {
  sm: "text-lg sm:text-xl",
  md: "text-xl sm:text-2xl",
  lg: "text-2xl sm:text-3xl",
  xl: "text-2xl sm:text-3xl"
};

export function Logo({
  variant = "mark",
  showTagline = false,
  showEyebrow = false,
  bare = false,
  size = "md",
  className = ""
}: LogoProps) {
  if (variant === "lockup") {
    return (
      <div className={`inline-flex min-w-0 items-center gap-2 sm:gap-3 ${className}`}>
        <span
          className={`grid shrink-0 place-items-center overflow-hidden rounded-2xl border border-line bg-white shadow-[0_10px_24px_rgba(10,19,35,0.08)] ring-1 ring-clay/10 ${LOCKUP_MARK_FRAME[size]}`}
        >
          <img
            src="/branding/koi-mark.png"
            alt=""
            aria-hidden="true"
            className="h-full w-full object-contain"
          />
        </span>
        <span className="grid min-w-0 leading-none">
          <span className={`truncate font-serif font-semibold tracking-wide text-ink ${LOCKUP_TITLE[size]}`}>
            {BRAND.displayName}
          </span>
          {showEyebrow ? (
            <span className="mt-1 hidden text-[0.62rem] font-black uppercase tracking-[0.26em] text-clay sm:block">
              {BRAND.headerEyebrow}
            </span>
          ) : null}
          {showTagline ? (
            <span className={`mt-1 font-bold leading-tight text-slate ${MARK_SIZE[size].tagline}`}>
              {BRAND.tagline}
            </span>
          ) : null}
        </span>
      </div>
    );
  }

  const styles = MARK_SIZE[size];
  const imageClassName = bare
    ? `${styles.image} object-contain`
    : `${styles.image} rounded-2xl object-cover shadow-[0_12px_28px_rgba(10,19,35,0.12)]`;

  return (
    <div className={`inline-grid min-w-0 gap-2 ${className}`}>
      <img
        src="/branding/koi-mark.png"
        alt={`${BRAND.displayName} mark`}
        className={imageClassName}
      />
      {showTagline ? (
        <span className={`font-bold leading-tight text-slate ${styles.tagline}`}>
          {BRAND.tagline}
        </span>
      ) : null}
    </div>
  );
}

export function PinIcon({ className = "" }: { className?: string }) {
  return (
    <img src="/branding/koi-mark.png" alt={`${BRAND.displayName} mark`} className={className} />
  );
}
