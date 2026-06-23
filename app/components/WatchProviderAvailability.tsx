import { ProviderBrandBadge } from "@/app/components/StreamingServiceChip";
import type { NormalizedWatchProviders } from "@/lib/types";
import { groupProvidersForDisplay, hasGroupedWatchProviders } from "@/lib/tmdbWatchProviders";
import { streamingServiceByProviderName } from "@/lib/streamingServices";

type Props = {
  providers?: NormalizedWatchProviders;
};

function ProviderChip({ name }: { name: string }) {
  const service = streamingServiceByProviderName(name);

  if (service) {
    return <ProviderBrandBadge service={service} label={name} />;
  }

  return (
    <span className="rounded-full border border-line bg-white px-2 py-0.5 text-[0.6875rem] font-semibold text-ink">
      {name}
    </span>
  );
}

function ProviderRow({ label, providers }: { label: string; providers: string[] }) {
  if (!providers.length) return null;

  const visible = providers.slice(0, 4);
  const remaining = providers.length - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="shrink-0 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-slate/70">{label}</span>
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        {visible.map((name) => (
          <ProviderChip key={`${label}-${name}`} name={name} />
        ))}
        {remaining > 0 ? (
          <span className="text-[0.6875rem] font-semibold text-slate">+{remaining} more</span>
        ) : null}
      </div>
    </div>
  );
}

export function WatchProviderAvailability({ providers }: Props) {
  if (!providers) return null;

  const grouped = groupProvidersForDisplay(providers);

  if (!hasGroupedWatchProviders(grouped)) {
    return <p className="mt-2 text-xs font-semibold text-slate/80">Streaming availability not found</p>;
  }

  return (
    <div className="mt-3 grid gap-2">
      <ProviderRow label="Available On" providers={grouped.availableOn} />
      <ProviderRow label="Rent or Buy" providers={grouped.rentOrBuy} />
    </div>
  );
}
