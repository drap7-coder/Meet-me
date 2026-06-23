"use client";

/**
 * Stylized map of the Blue Bell ↔ Manayunk corridor (Philadelphia metro).
 * Calm, Apple Maps–inspired cartography: hierarchy, restraint, no motion.
 */

type MapPinProps = {
  name: string;
  initial: string;
  minutes: number;
  x: number;
  y: number;
  align: "start" | "end";
};

function MapPin({ name, initial, minutes, x, y, align }: MapPinProps) {
  const labelAnchor = align === "start" ? "start" : "end";
  const labelX = align === "start" ? x + 14 : x - 14;

  return (
    <g aria-hidden="true">
      <circle cx={x} cy={y} r="11" fill="rgba(0,0,0,0.35)" />
      <circle cx={x} cy={y} r="8" fill="#FFFFFF" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" />
      <text
        x={x}
        y={y + 0.5}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#1C1C1E"
        fontSize="8"
        fontWeight="700"
        fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
      >
        {initial}
      </text>
      <text
        x={labelX}
        y={y - 16}
        textAnchor={labelAnchor}
        fill="rgba(255,255,255,0.95)"
        fontSize="11"
        fontWeight="600"
        fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
      >
        {name}
      </text>
      <text
        x={labelX}
        y={y - 4}
        textAnchor={labelAnchor}
        fill="rgba(255,255,255,0.55)"
        fontSize="9"
        fontWeight="500"
        fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
      >
        {minutes} min
      </text>
    </g>
  );
}

export function FairMeetupMap() {
  return (
    <div className="fair-map-shell relative mt-5 overflow-hidden rounded-[16px] border border-white/[0.1] bg-[#1C1C1E] shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_16px_40px_rgba(0,0,0,0.35)]">
      <svg
        viewBox="0 0 360 176"
        className="block h-[176px] w-full sm:h-[188px]"
        role="img"
        aria-label="Map showing a fair meetup route between Beatrix near Blue Bell and Charlotte in Manayunk, with an equal-travel midpoint."
      >
        <defs>
          <linearGradient id="fair-map-land" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3A3A3C" />
            <stop offset="100%" stopColor="#2C2C2E" />
          </linearGradient>
          <filter id="fair-route-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.35" />
          </filter>
        </defs>

        <rect width="360" height="176" fill="url(#fair-map-land)" />

        {/* Wissahickon / park */}
        <path
          d="M 48 28 C 72 22, 96 34, 108 52 C 88 58, 62 62, 44 48 Z"
          fill="#2F4F3E"
          opacity="0.55"
        />

        {/* Schuylkill River */}
        <path
          d="M 318 8 C 290 36, 268 68, 248 98 C 228 118, 208 132, 188 148 C 176 158, 168 168, 160 176"
          fill="none"
          stroke="#3D5A80"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path
          d="M 318 8 C 290 36, 268 68, 248 98 C 228 118, 208 132, 188 148 C 176 158, 168 168, 160 176"
          fill="none"
          stroke="#4A6FA5"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.4"
        />

        {/* Local street grid — Manayunk / Roxborough */}
        <g className="fair-map-local-streets" stroke="rgba(255,255,255,0.11)" strokeWidth="0.6" fill="none">
          <path d="M 220 88 L 340 88" />
          <path d="M 240 72 L 240 108" />
          <path d="M 260 68 L 260 112" />
          <path d="M 280 76 L 280 104" />
          <path d="M 300 80 L 300 100" />
          <path d="M 228 96 L 348 96" />
          <path d="M 248 104 L 328 104" />
        </g>

        {/* Local grid — Plymouth / Blue Bell */}
        <g className="fair-map-local-streets" stroke="rgba(255,255,255,0.11)" strokeWidth="0.6" fill="none">
          <path d="M 24 72 L 120 72" />
          <path d="M 24 88 L 112 88" />
          <path d="M 40 56 L 40 104" />
          <path d="M 56 60 L 56 108" />
          <path d="M 72 64 L 72 100" />
          <path d="M 88 68 L 88 96" />
        </g>

        {/* Arterials — Germantown Pike, Ridge Ave hints */}
        <g stroke="rgba(255,255,255,0.26)" strokeWidth="1.1" fill="none" strokeLinecap="round">
          <path d="M 32 80 C 88 76, 132 78, 168 82 C 204 86, 236 90, 272 92" />
          <path d="M 168 82 L 168 118" />
          <path d="M 132 78 L 128 108" />
        </g>

        {/* I-76 / Schuylkill Expressway */}
        <path
          d="M 300 24 C 276 48, 252 72, 228 92 C 210 106, 194 118, 178 128"
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M 300 24 C 276 48, 252 72, 228 92 C 210 106, 194 118, 178 128"
          fill="none"
          stroke="rgba(255,255,255,0.42)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Route 422 hint — northwest corridor */}
        <path
          d="M 8 92 C 48 88, 96 84, 148 82"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        {/* Fair meetup route — equal travel to midpoint */}
        <path
          d="M 72 78 C 108 74, 142 76, 168 80 C 194 84, 218 88, 252 92"
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M 72 78 C 108 74, 142 76, 168 80 C 194 84, 218 88, 252 92"
          fill="none"
          stroke="#FF5A00"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#fair-route-shadow)"
        />

        {/* Midpoint */}
        <circle cx="168" cy="80" r="9" fill="rgba(255,90,0,0.18)" />
        <circle cx="168" cy="80" r="5.5" fill="#FF5A00" stroke="#FFFFFF" strokeWidth="1.5" />
        <text
          x="168"
          y="98"
          textAnchor="middle"
          fill="rgba(255,255,255,0.65)"
          fontSize="8"
          fontWeight="600"
          letterSpacing="0.06em"
          fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
        >
          FAIR MIDPOINT
        </text>

        {/* Highway shields — minimal */}
        <g fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif" fontSize="7" fontWeight="700">
          <rect x="286" y="34" width="16" height="11" rx="2" fill="#3A3A3C" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6" />
          <text x="294" y="42" textAnchor="middle" fill="rgba(255,255,255,0.75)">
            76
          </text>
          <rect x="118" y="66" width="16" height="11" rx="2" fill="#3A3A3C" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6" />
          <text x="126" y="74" textAnchor="middle" fill="rgba(255,255,255,0.75)">
            422
          </text>
        </g>

        <MapPin name="Beatrix" initial="B" minutes={18} x={72} y={78} align="start" />
        <MapPin name="Charlotte" initial="C" minutes={19} x={252} y={92} align="end" />
      </svg>
    </div>
  );
}
