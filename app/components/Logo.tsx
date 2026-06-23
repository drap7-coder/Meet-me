import { BRAND } from "@/src/config/branding";
import Image from "next/image";

const MARK_SRC = "/branding/koi-mark-transparent.png";

type LogoSize = "sm" | "md" | "lg" | "xl" | "hero";
type LogoVariant = "mark" | "lockup";

type LogoProps = {
  variant?: LogoVariant;
  showTagline?: boolean;
  showEyebrow?: boolean;
  bare?: boolean;
  size?: LogoSize;
  onDark?: boolean;
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
    image: "h-60 w-60 sm:h-72 sm:w-72",
    tagline: "text-lg sm:text-xl"
  },
  hero: {
    image: "h-36 w-36 sm:h-60 sm:w-60",
    tagline: "text-base sm:text-lg"
  }
};

const LOCKUP_MARK_SIZE: Record<LogoSize, string> = {
  sm: "h-10 w-10 sm:h-11 sm:w-11",
  md: "h-10 w-10 sm:h-11 sm:w-11",
  lg: "h-14 w-14 sm:h-16 sm:w-16",
  xl: "h-14 w-14 sm:h-16 sm:w-16",
  hero: "h-14 w-14 sm:h-16 sm:w-16"
};

const LOCKUP_TITLE: Record<LogoSize, string> = {
  sm: "text-lg sm:text-xl",
  md: "text-xl sm:text-2xl",
  lg: "text-2xl sm:text-3xl",
  xl: "text-2xl sm:text-3xl",
  hero: "text-2xl sm:text-3xl"
};

function getMarkImageSizes(size: LogoSize) {
  if (size === "hero") return "(min-width: 640px) 480px, 288px";
  if (size === "xl") return "(min-width: 640px) 288px, 240px";
  if (size === "lg") return "(min-width: 640px) 192px, 160px";
  return "96px";
}

export function Logo({
  variant = "mark",
  showTagline = false,
  showEyebrow = false,
  bare = true,
  size = "md",
  onDark = false,
  className = ""
}: LogoProps) {
  if (variant === "lockup") {
    return (
      <div className={`inline-flex min-w-0 items-center gap-2 sm:gap-3 ${className}`}>
        <Image
          src={MARK_SRC}
          alt=""
          aria-hidden="true"
          width={1024}
          height={1024}
          sizes="64px"
          className={`${LOCKUP_MARK_SIZE[size]} shrink-0 object-contain`}
        />
        <span className="grid min-w-0 leading-none">
          <span className={`truncate font-serif font-semibold tracking-wide ${LOCKUP_TITLE[size]} ${onDark ? "text-white" : "text-ink"}`}>
            {onDark ? BRAND.askLabel : BRAND.displayName}
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
  const imageClassName = [
    styles.image,
    "object-contain",
    !bare && "drop-shadow-[0_10px_24px_rgba(10,19,35,0.12)]",
    onDark &&
      "drop-shadow-[0_0_24px_rgba(255,90,0,0.30)] drop-shadow-[0_10px_28px_rgba(0,0,0,0.38)]"
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`inline-grid min-w-0 gap-2 ${className}`}>
      <Image
        src={MARK_SRC}
        alt={`${BRAND.displayName} mark`}
        width={1024}
        height={1024}
        sizes={getMarkImageSizes(size)}
        priority={size === "hero" || size === "xl"}
        quality={size === "hero" ? 100 : 90}
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
    <Image
      src={MARK_SRC}
      alt={`${BRAND.displayName} mark`}
      width={1024}
      height={1024}
      sizes="48px"
      className={className}
    />
  );
}
