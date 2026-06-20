import { BRAND } from "@/src/config/branding";

type LogoSize = "sm" | "md" | "lg";
type LogoVariant = "mark" | "horizontal";

type LogoProps = {
  variant?: LogoVariant;
  showTagline?: boolean;
  size?: LogoSize;
  className?: string;
};

const MARK_SIZE: Record<LogoSize, { image: string; tagline: string }> = {
  sm: {
    image: "h-14 w-14",
    tagline: "text-[0.65rem]"
  },
  md: {
    image: "h-16 w-16",
    tagline: "text-xs"
  },
  lg: {
    image: "h-20 w-20",
    tagline: "text-base sm:text-lg"
  }
};

const HORIZONTAL_SIZE: Record<LogoSize, string> = {
  sm: "h-9 w-auto sm:h-10",
  md: "h-10 w-auto sm:h-11",
  lg: "h-12 w-auto sm:h-14"
};

export function Logo({
  variant = "mark",
  showTagline = false,
  size = "md",
  className = ""
}: LogoProps) {
  if (variant === "horizontal") {
    return (
      <div className={`inline-flex min-w-0 flex-col gap-1 ${className}`}>
        <img
          src="/branding/koi-logo-horizontal.png"
          alt={BRAND.displayName}
          className={`${HORIZONTAL_SIZE[size]} max-w-full object-contain object-left`}
        />
        {showTagline ? (
          <span className={`font-bold leading-tight text-slate ${MARK_SIZE[size].tagline}`}>
            {BRAND.tagline}
          </span>
        ) : null}
      </div>
    );
  }

  const styles = MARK_SIZE[size];

  return (
    <div className={`inline-grid min-w-0 gap-2 ${className}`}>
      <img
        src="/branding/koi-mark.png"
        alt={`${BRAND.displayName} mark`}
        className={`${styles.image} rounded-2xl object-cover shadow-[0_12px_28px_rgba(10,19,35,0.12)]`}
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
