import type { StreamingServiceOption } from "@/lib/streamingServices";
import { tmdbLogoUrl } from "@/lib/tmdb";
import Image from "next/image";

type StreamingServiceChipProps = {
  service: StreamingServiceOption;
  selected: boolean;
  busy: boolean;
  onPage?: boolean;
  onPick: () => void;
};

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3 ? normalized.split("").map((c) => c + c).join("") : normalized.slice(0, 6);
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function StreamingServiceChip({
  service,
  selected,
  busy,
  onPage = false,
  onPick
}: StreamingServiceChipProps) {
  const { brandColor, brandTextColor, label, logoPath } = service;

  const style = selected
    ? {
        backgroundColor: brandColor,
        borderColor: brandColor,
        color: brandTextColor,
        boxShadow: `0 8px 18px ${withAlpha(brandColor, 0.35)}`
      }
    : onPage
      ? {
          borderColor: brandColor,
          backgroundColor: withAlpha(brandColor, 0.12),
          color: "#0A1323"
        }
      : {
          borderColor: withAlpha(brandColor, 0.85),
          backgroundColor: withAlpha(brandColor, 0.22),
          color: "#FFFFFF"
        };

  return (
    <button
      type="button"
      disabled={busy}
      onClick={onPick}
      aria-pressed={selected}
      aria-label={label}
      style={style}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 px-2.5 py-1.5 pl-2 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-koi/15 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:py-2"
    >
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-[4px] bg-white"
        style={{ boxShadow: `inset 0 0 0 1px ${withAlpha(brandColor, 0.25)}` }}
      >
        <Image
          src={tmdbLogoUrl(logoPath)}
          alt=""
          aria-hidden="true"
          width={20}
          height={20}
          unoptimized
          className="h-4 w-4 object-contain"
        />
      </span>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

type ProviderBrandBadgeProps = {
  service: StreamingServiceOption;
  label?: string;
};

export function ProviderBrandBadge({ service, label }: ProviderBrandBadgeProps) {
  const displayLabel = label ?? service.label;

  return (
    <span
      style={{
        borderColor: withAlpha(service.brandColor, 0.45),
        backgroundColor: withAlpha(service.brandColor, 0.12)
      }}
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.6875rem] font-semibold text-ink"
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-[3px] bg-white">
        <Image
          src={tmdbLogoUrl(service.logoPath)}
          alt=""
          aria-hidden="true"
          width={16}
          height={16}
          unoptimized
          className="h-3.5 w-3.5 object-contain"
        />
      </span>
      <span>{displayLabel}</span>
    </span>
  );
}
