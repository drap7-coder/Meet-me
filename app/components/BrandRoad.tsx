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
    <div className={`road-divider ${className}`} aria-hidden="true">
      <svg className="h-12 w-full" viewBox="0 0 1000 42" preserveAspectRatio="none" focusable="false">
        <path
          className="road-divider-track"
          d="M18 32H982"
          fill="none"
          stroke="#111827"
          strokeLinecap="round"
          strokeWidth="5"
        />
        <path
          className="road-divider-dashes"
          d="M44 32H104M148 32H208M252 32H312M356 32H416M460 32H520M564 32H624M668 32H728M772 32H832M876 32H936"
          fill="none"
          stroke="#FFFFFF"
          strokeLinecap="round"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}
