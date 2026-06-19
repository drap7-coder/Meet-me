import { BRAND } from "@/src/config/branding";

type LogoSize = "sm" | "md" | "lg";

type LogoProps = {
  showTagline?: boolean;
  size?: LogoSize;
  className?: string;
};

const SIZE_STYLES: Record<LogoSize, { image: string; tagline: string }> = {
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

export function Logo({
  showTagline = false,
  size = "md",
  className = ""
}: LogoProps) {
  const styles = SIZE_STYLES[size];

  return (
    <div className={`inline-grid min-w-0 gap-2 ${className}`}>
      <img
        src="/branding/koi-mark.png"
        alt={`${BRAND.name} mark`}
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
  return <img src="/branding/koi-mark.png" alt="Koi mark" className={className} />;
}
