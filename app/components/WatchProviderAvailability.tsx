import { ProviderBrandBadge } from "@/app/components/StreamingServiceChip";
import type { NormalizedWatchProviders } from "@/lib/types";
import { groupProvidersForDisplay, hasGroupedWatchProviders } from "@/lib/tmdbWatchProviders";
import { streamingServiceById, streamingServiceByProviderName, recommendationMatchesStreamingServices } from "@/lib/streamingServices";

type Props = {
  providers?: NormalizedWatchProviders;
  preferredServiceIds?: string[];
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

function PreferredServicesRow({ serviceIds }: { serviceIds: string[] }) {
  const services = serviceIds
    .map((id) => streamingServiceById(id))
    .filter((service): service is NonNullable<typeof service> => Boolean(service));

  if (!services.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="shrink-0 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-slate/70">Your search</span>
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        {services.map((service) => (
          <ProviderBrandBadge key={service.id} service={service} label={service.label} />
        ))}
      </div>
    </div>
  );
}

function orderProvidersForPreferred(providers: string[], preferredServiceIds: string[]) {
  if (!preferredServiceIds.length) return providers;

  const preferredNames = new Set<string>();
  for (const id of preferredServiceIds) {
    const service = streamingServiceById(id);
    if (!service) continue;
    for (const name of service.tmdbNames) {
      preferredNames.add(name.trim().toLowerCase());
    }
  }

  const score = (name: string) => {
    const matched = streamingServiceByProviderName(name);
    if (matched && preferredServiceIds.includes(matched.id)) return 0;
    const normalized = name.trim().toLowerCase();
    if ([...preferredNames].some((preferred) => normalized.includes(preferred) || preferred.includes(normalized))) {
      return 1;
    }
    return 2;
  };

  return [...providers].sort((left, right) => score(left) - score(right));
}

export function WatchProviderAvailability({ providers, preferredServiceIds = [] }: Props) {
  const grouped = providers ? groupProvidersForDisplay(providers) : { availableOn: [], rentOrBuy: [] };
  const hasProviders = hasGroupedWatchProviders(grouped);
  const availableOn = orderProvidersForPreferred(grouped.availableOn, preferredServiceIds);
  const rentOrBuy = orderProvidersForPreferred(grouped.rentOrBuy, preferredServiceIds);

  if (!hasProviders && !preferredServiceIds.length) {
    return null;
  }

  if (!hasProviders && preferredServiceIds.length) {
    return (
      <div className="mt-3 grid gap-2">
        <PreferredServicesRow serviceIds={preferredServiceIds} />
        <p className="text-xs font-semibold text-slate/80">Streaming availability not found for this title yet.</p>
      </div>
    );
  }

  const showPreferredRow =
    preferredServiceIds.length > 0 && !recommendationMatchesStreamingServices(providers, preferredServiceIds);

  return (
    <div className="mt-3 grid gap-2">
      {showPreferredRow ? <PreferredServicesRow serviceIds={preferredServiceIds} /> : null}
      <ProviderRow label="Available On" providers={availableOn} />
      <ProviderRow label="Rent or Buy" providers={rentOrBuy} />
    </div>
  );
}
