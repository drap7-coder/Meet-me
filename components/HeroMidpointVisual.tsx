"use client";

export default function HeroMidpointVisual() {
  return (
    <div className="relative w-full max-w-[680px] overflow-hidden rounded-[2rem] border border-slate-200 bg-white/85 p-5 shadow-xl backdrop-blur sm:p-6">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,37,55,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,37,55,0.055)_1px,transparent_1px)] bg-[size:44px_44px]" />

      <div className="relative min-h-[340px] sm:min-h-[370px]">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 680 370"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M145 105 C220 155, 270 185, 330 215"
            stroke="#2563eb"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray="18 14"
          />
          <path
            d="M535 108 C465 158, 415 188, 350 215"
            stroke="#0f2537"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray="18 14"
          />
        </svg>

        <div className="absolute left-3 top-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-md sm:left-5">
          <div className="text-sm font-extrabold text-[#0f2537] sm:text-base">
            Hoboken, NJ
          </div>
          <div className="mt-2 text-xl font-extrabold text-blue-600 sm:text-2xl">
            24 min
          </div>
          <div className="text-xs font-medium text-slate-500 sm:text-sm">
            10.8 miles
          </div>
        </div>

        <div className="absolute right-3 top-12 rounded-2xl border border-slate-200 bg-white p-4 shadow-md sm:right-5">
          <div className="text-sm font-extrabold text-[#0f2537] sm:text-base">
            Edison, NJ
          </div>
          <div className="mt-2 text-xl font-extrabold text-[#0f2537] sm:text-2xl">
            26 min
          </div>
          <div className="text-xs font-medium text-slate-500 sm:text-sm">
            12.4 miles
          </div>
        </div>

        <div className="absolute left-[19%] top-[42%] flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 shadow-lg ring-8 ring-blue-100 sm:h-16 sm:w-16">
          <div className="h-4 w-4 rounded-full bg-white" />
        </div>

        <div className="absolute right-[17%] top-[44%] flex h-14 w-14 items-center justify-center rounded-full bg-[#0f2537] shadow-lg ring-8 ring-slate-200 sm:h-16 sm:w-16">
          <div className="h-4 w-4 rounded-full bg-white" />
        </div>

        <div className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ef6f61] text-2xl text-white shadow-lg ring-8 ring-red-100">
            📍
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 w-[86%] -translate-x-1/2 rounded-[1.75rem] border border-slate-200 bg-white/95 p-5 text-center shadow-xl sm:bottom-6 sm:w-[78%] sm:p-6">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-[#ef6f61] sm:text-xs">
            Best Match
          </div>

          <div className="mt-2 text-xl font-extrabold text-[#0f2537] sm:text-2xl">
            Sunset Coffee Co.
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-bold text-[#0f2537] sm:text-sm">
            <span>Hoboken: 24 min</span>
            <span className="hidden h-4 w-px bg-slate-300 sm:block" />
            <span>Edison: 26 min</span>
          </div>

          <div className="mt-4 text-xs font-medium text-slate-500 sm:text-sm">
            Great coffee · Free parking · Highly rated
          </div>
        </div>
      </div>
    </div>
  );
}
