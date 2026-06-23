"use client";

type PersonPinProps = {
  name: string;
  initial: string;
  minutes: number;
  side: "left" | "right";
};

/** Primary fair-meetup corridor */
const MAIN_ARTERY =
  "M 44 98 C 88 72, 132 68, 180 76 C 228 84, 272 88, 316 96";

/** Secondary veins feeding the midpoint */
const ARTERIES = [
  "M 180 76 L 180 38",
  "M 180 76 L 180 118",
  "M 180 76 C 210 58, 248 52, 286 44",
  "M 180 76 C 148 94, 112 108, 72 118",
  "M 132 68 L 132 48",
  "M 228 84 L 248 108",
  "M 98 82 L 72 62",
  "M 262 86 L 298 72"
];

/** Capillary mesh — thin map-like street grid */
const CAPILLARIES = [
  "M 24 124 L 336 124",
  "M 24 108 L 120 108 L 120 88",
  "M 120 88 L 168 88",
  "M 240 88 L 336 88",
  "M 48 68 L 48 124",
  "M 96 56 L 96 108",
  "M 144 42 L 144 68",
  "M 216 42 L 216 84",
  "M 264 56 L 264 108",
  "M 312 64 L 312 124",
  "M 60 48 L 108 48 L 108 68",
  "M 252 48 L 300 48 L 300 64",
  "M 168 118 L 168 132",
  "M 192 118 L 192 132",
  "M 128 108 C 128 96, 140 90, 152 90",
  "M 208 90 C 220 90, 232 96, 232 108",
  "M 88 98 L 88 118",
  "M 272 96 L 272 118",
  "M 36 92 L 56 92",
  "M 304 92 L 324 92",
  "M 156 56 L 204 56",
  "M 72 72 L 96 82",
  "M 264 72 L 288 82"
];

function VeinLabel({
  x,
  y,
  label,
  tone = "cyan"
}: {
  x: number;
  y: number;
  label: string;
  tone?: "cyan" | "koi" | "violet";
}) {
  const color = tone === "koi" ? "#FF5A00" : tone === "violet" ? "#C4B5FD" : "#67E8F9";

  return (
    <g transform={`translate(${x} ${y})`} aria-hidden="true">
      <circle r="7" fill="rgba(5,11,20,0.85)" stroke={color} strokeWidth="0.6" opacity="0.9" />
      <text
        x="0"
        y="0.5"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontSize="5.5"
        fontWeight="600"
        letterSpacing="0.08em"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        {label}
      </text>
    </g>
  );
}

function PersonPin({ name, initial, minutes, side }: PersonPinProps) {
  const align = side === "left" ? "items-start text-left" : "items-end text-right";

  return (
    <div className={`relative z-10 flex min-w-0 flex-col ${align}`}>
      <div className="relative grid h-9 w-9 place-items-center">
        <span
          className={`absolute inset-0 rounded-full blur-[6px] ${
            side === "left" ? "bg-cyan-400/30" : "bg-violet-400/25"
          }`}
          aria-hidden="true"
        />
        <span
          className={`relative grid h-9 w-9 place-items-center rounded-full border text-xs font-bold text-white backdrop-blur-sm ${
            side === "left"
              ? "border-cyan-300/50 bg-[#0a1528]/90 text-cyan-50"
              : "border-violet-300/40 bg-[#0a1528]/90 text-violet-50"
          }`}
        >
          {initial}
        </span>
      </div>
      <p className="mt-1.5 text-[13px] font-semibold tracking-tight text-white/95">{name}</p>
      <p className="mt-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-cyan-300/80">
        {minutes} min
      </p>
    </div>
  );
}

export function FuturisticMeetupMap() {
  return (
    <div className="futurist-map-shell relative mt-5 overflow-hidden rounded-[16px] border border-white/[0.08] bg-[#03070f] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_20px_50px_rgba(0,0,0,0.45)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_80%_at_50%_0%,rgba(34,211,238,0.07),transparent_50%),radial-gradient(circle_at_50%_55%,rgba(255,90,0,0.06),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.35] mix-blend-overlay futurist-map-noise" />

      <svg
        viewBox="0 0 360 150"
        className="relative block h-[158px] w-full sm:h-[172px]"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="vein-artery-gradient" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.55" />
            <stop offset="48%" stopColor="#FF5A00" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="vein-flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0" />
            <stop offset="40%" stopColor="#E0F2FE" stopOpacity="1" />
            <stop offset="100%" stopColor="#FF5A00" stopOpacity="0" />
          </linearGradient>
          <filter id="vein-soft-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern id="vein-micro-grid" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="6" cy="6" r="0.35" fill="rgba(103,232,249,0.12)" />
          </pattern>
          <pattern id="vein-fine-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(103,232,249,0.04)" strokeWidth="0.35" />
          </pattern>
        </defs>

        <rect width="360" height="150" fill="#03070f" />
        <rect width="360" height="150" fill="url(#vein-fine-grid)" />
        <rect width="360" height="150" fill="url(#vein-micro-grid)" opacity="0.65" />

        {/* City block hints */}
        <g className="futurist-block-ghost" opacity="0.45">
          <rect x="52" y="52" width="36" height="28" rx="2" />
          <rect x="108" y="44" width="40" height="32" rx="2" />
          <rect x="212" y="48" width="44" height="30" rx="2" />
          <rect x="268" y="58" width="38" height="34" rx="2" />
          <rect x="148" y="96" width="64" height="24" rx="2" />
        </g>

        {/* Capillary mesh */}
        {CAPILLARIES.map((path, index) => (
          <path key={`cap-${index}`} d={path} className="futurist-vein-capillary" />
        ))}

        {/* Secondary veins */}
        {ARTERIES.map((path, index) => (
          <path key={`art-${index}`} d={path} className="futurist-vein-secondary" />
        ))}

        {/* Main artery — thin premium line with soft glow duplicate */}
        <path d={MAIN_ARTERY} className="futurist-vein-glow" />
        <path d={MAIN_ARTERY} className="futurist-vein-artery" stroke="url(#vein-artery-gradient)" filter="url(#vein-soft-glow)" />

        {/* Intro pulse along veins */}
        <path d={MAIN_ARTERY} className="futurist-vein-pulse futurist-vein-pulse-main" pathLength="100" stroke="url(#vein-flow-gradient)" />
        {ARTERIES.slice(0, 4).map((path, index) => (
          <path
            key={`pulse-${index}`}
            d={path}
            className="futurist-vein-pulse"
            pathLength="100"
            stroke="url(#vein-flow-gradient)"
            style={{ animationDelay: `${0.25 + index * 0.18}s` }}
          />
        ))}

        <circle r="1.2" className="futurist-data-node" fill="#E0F2FE">
          <animateMotion dur="2.8s" repeatCount={3} path={MAIN_ARTERY} />
        </circle>
        <circle r="0.9" className="futurist-data-node futurist-data-node-b" fill="#FF5A00">
          <animateMotion dur="2.4s" begin="0.5s" repeatCount={3} path={MAIN_ARTERY} />
        </circle>

        <VeinLabel x={180} y={30} label="MID" tone="koi" />
        <VeinLabel x={108} y={122} label="30" tone="cyan" />
        <VeinLabel x={298} y={46} label="76" tone="violet" />
        <VeinLabel x={48} y={68} label="FAIR" tone="koi" />

        {/* Midpoint node */}
        <g transform="translate(180 76)">
          <circle r="12" className="futurist-mid-pulse" fill="rgba(255,90,0,0.08)" stroke="rgba(255,90,0,0.25)" strokeWidth="0.5" />
          <circle r="6.5" fill="rgba(5,11,20,0.92)" stroke="#FF5A00" strokeWidth="0.75" filter="url(#vein-soft-glow)" />
          <circle r="2" fill="#FF5A00" opacity="0.9" />
        </g>
      </svg>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between px-4 pb-3 sm:px-5 sm:pb-3.5">
        <PersonPin name="Beatrix" initial="B" minutes={18} side="left" />
        <PersonPin name="Charlotte" initial="C" minutes={19} side="right" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent" />
    </div>
  );
}
