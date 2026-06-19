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
        fill="#D65A2E"
      />
      <circle cx="116" cy="16" r="4.5" fill="#FFFFFF" />
    </>
  );
}

export function RoadDivider({ className = "" }: BrandSvgProps) {
  return (
    <div className={`road-divider ${className}`} aria-hidden="true">
      <svg className="h-14 w-full" viewBox="0 0 1000 72" preserveAspectRatio="none" focusable="false">
        <path
          className="road-divider-depth"
          d="M24 43C76 27 128 27 180 43C232 59 284 59 336 43C388 27 440 27 492 43C544 59 596 59 648 43C700 27 752 27 804 43C856 59 908 59 976 43"
          fill="none"
          stroke="#7A8CA3"
          strokeLinecap="round"
          strokeWidth="2.5"
        />
        <path
          className="road-divider-track"
          d="M24 34C76 18 128 18 180 34C232 50 284 50 336 34C388 18 440 18 492 34C544 50 596 50 648 34C700 18 752 18 804 34C856 50 908 50 976 34"
          fill="none"
          stroke="#0A1323"
          strokeLinecap="round"
          strokeWidth="3.5"
        />
      </svg>
    </div>
  );
}
