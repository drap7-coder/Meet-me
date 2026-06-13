import { BrandPin, BrandRoad } from "@/app/components/BrandRoad";
import { BRAND } from "@/src/config/branding";

type LogoSize = "sm" | "md" | "lg";

type LogoProps = {
  showTagline?: boolean;
  size?: LogoSize;
  className?: string;
};

const SIZE_STYLES: Record<LogoSize, { wrapper: string; tagline: string }> = {
  sm: {
    wrapper: "h-9 w-[150px]",
    tagline: "text-[0.65rem]"
  },
  md: {
    wrapper: "h-11 w-[184px]",
    tagline: "text-xs"
  },
  lg: {
    wrapper: "h-12 w-[210px]",
    tagline: "text-base sm:text-lg"
  }
};

export function Logo({
  showTagline = false,
  size = "md",
  className = ""
}: LogoProps) {
  const styles = SIZE_STYLES[size];

  return (
    <div className={`inline-grid min-w-0 gap-2 ${className}`}>
      <svg
        className={styles.wrapper}
        viewBox="0 0 142 42"
        role="img"
        aria-label={`${BRAND.name} logo`}
      >
        <BrandRoad />
        <BrandPin />
        <text
          x="0"
          y="22"
          fill="#111827"
          fontFamily="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
          fontSize="18"
          fontWeight="900"
          letterSpacing="-0.7"
        >
          Halfway
        </text>
      </svg>
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
    <svg className={className} viewBox="0 0 64 64" role="img" aria-label="Halfway pin">
      <path
        d="M32 4C43.6 4 53 13.4 53 25C53 39.2 37.9 54 32 61C26.1 54 11 39.2 11 25C11 13.4 20.4 4 32 4Z"
        fill="#FF6B6B"
      />
      <circle cx="32" cy="25" r="8" fill="#FFFFFF" />
    </svg>
  );
}
