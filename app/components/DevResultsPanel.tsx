"use client";

import type { WatchEventsResult } from "@/lib/types";

type Props = {
  result: WatchEventsResult;
  onClose?: () => void;
};

export function DevResultsPanel({ result, onClose }: Props) {
  const providers = [...new Set(result.recommendations.map((item) => item.provider))];

  return (
    <div className="mt-4 rounded-lg border border-dashed border-slate/30 bg-slate/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate">Developer view</p>
          <p className="mt-1 text-xs leading-5 text-slate">Provider, API, and debug details — not shown to end users.</p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-line px-2.5 py-1 text-xs font-bold text-slate transition hover:border-slate hover:text-ink"
          >
            Hide
          </button>
        ) : null}
      </div>

      <dl className="mt-4 grid gap-2 text-xs">
        <DevRow label="Mode" value={`${result.botMode} · ${result.intent}`} />
        <DevRow label="Preview" value={result.preview ? "Yes" : "No (live picks)"} />
        <DevRow label="Result count" value={String(result.resultCount)} />
        <DevRow label="System message" value={result.message} />
        {result.futureProviders.length ? (
          <DevRow label="Planned providers" value={result.futureProviders.join(", ")} />
        ) : null}
        {providers.length ? <DevRow label="Active sources" value={providers.join(", ")} /> : null}
      </dl>

      {result.recommendations.length ? (
        <div className="mt-4 grid gap-2">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate">Card debug</p>
          {result.recommendations.map((item) => (
            <div key={item.id} className="rounded-lg border border-line bg-white px-3 py-2 text-xs text-slate">
              <span className="font-bold text-ink">{item.title}</span>
              <span className="mx-1">·</span>
              <span>{item.provider}</span>
              <span className="mx-1">·</span>
              <span>{item.preview ? "preview" : "live"}</span>
              <span className="mx-1">·</span>
              <span>{item.kind}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DevRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-0.5">
      <dt className="font-black uppercase tracking-[0.12em] text-slate">{label}</dt>
      <dd className="font-medium leading-5 text-ink">{value}</dd>
    </div>
  );
}
