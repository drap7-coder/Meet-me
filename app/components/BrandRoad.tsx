type BrandSvgProps = {
  className?: string;
};

export function BrandRoad() {
  return (
    <>
      <path
        d="M6 32H104"
        fill="none"
        stroke="#111827"
        strokeLinecap="round"
        strokeWidth="5"
      />
      <path
        d="M14 32H22M32 32H40M50 32H58M68 32H76M86 32H94"
        fill="none"
        stroke="#FFFFFF"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </>
  );
}

export function BrandPin() {
  return (
    <>
      <path
        d="M116 4C122.6 4 128 9.4 128 16C128 24.1 119.4 32.6 116 36.5C112.6 32.6 104 24.1 104 16C104 9.4 109.4 4 116 4Z"
        fill="#FF6B6B"
      />
      <circle cx="116" cy="16" r="4.5" fill="#FFFFFF" />
    </>
  );
}

export function RoadDivider({ className = "" }: BrandSvgProps) {
  return (
    <div className={`road-divider flex items-center gap-4 ${className}`} aria-hidden="true">
      <span className="h-px flex-1 bg-line" />
      <svg className="h-10 w-[150px] shrink-0" viewBox="0 0 142 42" focusable="false">
        <BrandRoad />
        <BrandPin />
      </svg>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
