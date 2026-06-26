"use client";

import { THINKING_PROGRESS_LABELS } from "@/lib/koiCapabilityExamples";
import { getSearchAccent } from "@/lib/searchAccent";
import Image from "next/image";
import { useEffect } from "react";

type Props = {
  searchKind?: "places" | "watch" | "events" | null;
  phase?: number;
};

export function KoiThinkingLoader({ searchKind = "places", phase = 0 }: Props) {
  const accent = getSearchAccent(searchKind);
  const labels = THINKING_PROGRESS_LABELS[searchKind ?? "places"];
  const label = labels[phase % labels.length] ?? labels[0];

  useEffect(() => {
    playKoiThinkingCue();
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#0A1323] p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-6"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,90,0,0.18),transparent_32%),radial-gradient(circle_at_18%_76%,rgba(10,132,255,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:radial-gradient(rgba(255,255,255,0.4)_0.5px,transparent_0.5px)] [background-size:4px_4px]" />

      <div className="relative z-10 mx-auto grid max-w-2xl gap-5">
        <div className="meet-middle-motion relative h-32 overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] sm:h-36">
          <div className="absolute left-6 right-6 top-1/2 h-px bg-white/12" aria-hidden="true" />
          <div className={`koi-thinking-route ${accent.bg}`} aria-hidden="true" />
          <span className="meet-middle-dot-left absolute top-1/2 h-4 w-4 rounded-full bg-white shadow-[0_0_24px_rgba(255,255,255,0.55)]" aria-hidden="true" />
          <span className={`meet-middle-dot-right absolute top-1/2 h-4 w-4 rounded-full ${accent.bg} shadow-[0_0_26px_rgba(255,90,0,0.55)]`} aria-hidden="true" />
          <span className="meet-middle-pin absolute left-1/2 top-1/2 grid h-16 w-16 place-items-center rounded-full bg-white/10 shadow-[0_0_34px_rgba(255,90,0,0.22)] backdrop-blur" aria-hidden="true">
            <span className="koi-thinking-ripple absolute inset-0 rounded-full border border-koi/30" />
            <Image
              src="/branding/koi-mark.png"
              alt=""
              width={1024}
              height={1024}
              sizes="64px"
              className="relative h-11 w-11 object-contain"
            />
          </span>
        </div>

        <div className="grid gap-2 text-center">
          <p className={`text-sm font-black uppercase tracking-[0.16em] ${accent.text}`}>Koi is calculating</p>
          <p className="text-lg font-black leading-tight text-white sm:text-xl">{label}</p>
          <p className="mx-auto max-w-md text-xs font-semibold leading-5 text-white/55">
            Reading the ask, checking the map, and pulling the strongest answer forward.
          </p>
        </div>
      </div>
    </div>
  );
}

function playKoiThinkingCue() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  try {
    const activation = navigator.userActivation;
    if (activation && !activation.hasBeenActive) return;

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;

    const context = new AudioContextCtor();
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.018, context.currentTime + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.34);
    gain.connect(context.destination);

    [392, 523.25].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, context.currentTime + index * 0.065);
      oscillator.connect(gain);
      oscillator.start(context.currentTime + index * 0.065);
      oscillator.stop(context.currentTime + 0.34 + index * 0.04);
    });

    window.setTimeout(() => {
      void context.close().catch(() => {});
    }, 500);
  } catch {
    // Browsers may block audio unless the loader starts from a direct user gesture.
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
