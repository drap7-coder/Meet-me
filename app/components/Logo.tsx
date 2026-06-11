import { BRAND } from "@/src/config/branding";

type LogoSize = "sm" | "md" | "lg";
type LogoLayout = "horizontal" | "stacked";

type LogoProps = {
  layout?: LogoLayout;
  showTagline?: boolean;
  size?: LogoSize;
  className?: string;
};

const SIZE_STYLES: Record<LogoSize, { wordmark: string; tagline: string; gap: string }> = {
  sm: {
    wordmark: "text-lg",
    tagline: "text-[0.65rem]",
    gap: "gap-2"
  },
  md: {
    wordmark: "text-2xl",
    tagline: "text-xs",
    gap: "gap-3"
  },
  lg: {
    wordmark: "text-6xl sm:text-7xl",
    tagline: "text-base sm:text-lg",
    gap: "gap-3"
  }
};

export function Logo({
  layout = "horizontal",
  showTagline = false,
  size = "md",
  className = ""
}: LogoProps) {
  const styles = SIZE_STYLES[size];
  const stacked = layout === "stacked";

  return (
    <div
      className={`inline-flex min-w-0 ${
        stacked ? `flex-col items-start ${styles.gap}` : `items-center ${styles.gap}`
      } ${className}`}
    >
      <span className="grid min-w-0">
        <span className={`truncate font-black leading-none tracking-tight text-ink ${styles.wordmark}`}>
          {BRAND.name}
        </span>
        {showTagline ? (
          <span className={`mt-2 font-bold leading-tight text-slate ${styles.tagline}`}>
            {BRAND.tagline}
          </span>
        ) : null}
      </span>
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
