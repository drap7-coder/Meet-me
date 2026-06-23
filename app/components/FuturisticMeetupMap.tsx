"use client";

type PersonPinProps = {
  name: string;
  initial: string;
  minutes: number;
  side: "left" | "right";
};

const MAIN_ROUTE =
  "M 52 92 C 98 58, 142 58, 180 74 C 218 90, 262 90, 308 92";
const NORTH_ROUTE = "M 180 74 L 180 34";
const SOUTH_ROUTE = "M 118 98 L 118 128";
const EAST_ROUTE = "M 248 82 L 292 48";

function RoadSign({ x, y, label, accent = "cyan" }: { x: number; y: number; label: string; accent?: "cyan" | "koi" | "violet" }) {
  const stroke =
    accent === "koi" ? "#FF5A00" : accent === "violet" ? "#A78BFA" : "#22D3EE";
  const fill =
    accent === "koi" ? "rgba(255,90,0,0.18)" : accent === "violet" ? "rgba(167,139,250,0.16)" : "rgba(34,211,238,0.14)";

  return (
    <g transform={`translate(${x} ${y})`} aria-hidden="true">
      <rect x="-14" y="-10" width="28" height="20" rx="3" fill={fill} stroke={stroke} strokeWidth="1.2" />
      <path d="M -10 10 L 0 16 L 10 10" fill="none" stroke={stroke} strokeWidth="1" opacity="0.85" />
      <text
        x="0"
        y="2"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={stroke}
        fontSize="8"
        fontWeight="700"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
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
      <div
        className={`grid h-10 w-10 place-items-center rounded-full text-sm font-black text-white shadow-[0_0_18px_rgba(34,211,238,0.35)] ring-2 ${
          side === "left"
            ? "bg-indigo ring-cyan-400/45"
            : "bg-ink ring-violet-400/40"
        }`}
      >
        {initial}
      </div>
      <p className="mt-2 text-sm font-bold text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.65)]">{name}</p>
      <p className="mt-0.5 text-xs font-semibold text-cyan-300">→ {minutes} min</p>
    </div>
  );
}

export function FuturisticMeetupMap() {
  return (
    <div className="futurist-map-shell relative mt-5 overflow-hidden rounded-[14px] border border-cyan-400/25 bg-[#050b14] shadow-[inset_0_0_40px_rgba(34,211,238,0.06),0_12px_32px_rgba(0,0,0,0.35)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,rgba(255,90,0,0.08),transparent_55%),radial-gradient(circle_at_18%_22%,rgba(34,211,238,0.12),transparent_38%),radial-gradient(circle_at_82%_28%,rgba(167,139,250,0.1),transparent_36%)]" />

      <svg
        viewBox="0 0 360 150"
        className="relative block h-[150px] w-full sm:h-[168px]"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="futurist-road-glow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.35" />
            <stop offset="45%" stopColor="#FF5A00" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id="futurist-flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="50%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#FF5A00" />
          </linearGradient>
          <filter id="futurist-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern id="futurist-grid" width="18" height="18" patternUnits="userSpaceOnUse">
            <path d="M 18 0 L 0 0 0 18" fill="none" stroke="rgba(34,211,238,0.07)" strokeWidth="0.6" />
          </pattern>
        </defs>

        <rect width="360" height="150" fill="url(#futurist-grid)" />
        <rect width="360" height="150" fill="rgba(5,11,20,0.55)" />

        {/* Base roads */}
        <path d={SOUTH_ROUTE} className="futurist-road-base" />
        <path d={NORTH_ROUTE} className="futurist-road-base" />
        <path d={EAST_ROUTE} className="futurist-road-base" />
        <path d={MAIN_ROUTE} className="futurist-road-base futurist-road-main" stroke="url(#futurist-road-glow)" filter="url(#futurist-glow)" />

        {/* Intro data streams */}
        <path d={MAIN_ROUTE} className="futurist-road-stream futurist-road-stream-main" pathLength="100" stroke="url(#futurist-flow-gradient)" />
        <path d={NORTH_ROUTE} className="futurist-road-stream" pathLength="100" stroke="url(#futurist-flow-gradient)" style={{ animationDelay: "0.35s" }} />
        <path d={SOUTH_ROUTE} className="futurist-road-stream" pathLength="100" stroke="url(#futurist-flow-gradient)" style={{ animationDelay: "0.55s" }} />
        <path d={EAST_ROUTE} className="futurist-road-stream" pathLength="100" stroke="url(#futurist-flow-gradient)" style={{ animationDelay: "0.75s" }} />

        {/* Running data packets — play a few times on load */}
        <circle r="2.5" className="futurist-data-node futurist-data-node-a" fill="#22D3EE">
          <animateMotion dur="2.4s" repeatCount={3} path={MAIN_ROUTE} />
        </circle>
        <circle r="2" className="futurist-data-node futurist-data-node-b" fill="#FF5A00">
          <animateMotion dur="2.1s" begin="0.4s" repeatCount={3} path={MAIN_ROUTE} />
        </circle>
        <circle r="1.8" className="futurist-data-node futurist-data-node-c" fill="#FFFFFF">
          <animateMotion dur="1.8s" begin="0.8s" repeatCount={3} path={NORTH_ROUTE} />
        </circle>

        <RoadSign x={180} y={24} label="MID" accent="koi" />
        <RoadSign x={108} y={118} label="30" accent="cyan" />
        <RoadSign x={298} y={42} label="76" accent="violet" />
        <RoadSign x={52} y={72} label="FAIR" accent="koi" />

        {/* Midpoint beacon */}
        <g transform="translate(180 74)">
          <circle r="16" fill="rgba(255,90,0,0.12)" className="futurist-mid-pulse" />
          <circle r="10" fill="rgba(255,90,0,0.22)" stroke="#FF5A00" strokeWidth="1.2" filter="url(#futurist-glow)" />
          <text x="0" y="1" textAnchor="middle" dominantBaseline="middle" fontSize="12" aria-hidden="true">
            ⚖
          </text>
        </g>
      </svg>

      <div className="pointer-events-none absolute inset-0 flex items-end justify-between px-4 pb-3 sm:px-5 sm:pb-4">
        <PersonPin name="Beatrix" initial="B" minutes={18} side="left" />
        <div className="w-14 shrink-0" aria-hidden="true" />
        <PersonPin name="Charlotte" initial="C" minutes={19} side="right" />
      </div>
    </div>
  );
}
