import type { GeocodedLocation, LatLng, ScoredVenue, SearchMode } from "@/lib/types";

type Props = {
  originA: GeocodedLocation;
  originB: GeocodedLocation;
  midpoint: LatLng;
  venues: ScoredVenue[];
  searchMode: SearchMode;
};

export function ResultsMap({ originA, originB, midpoint, venues, searchMode }: Props) {
  const isSingleLocation = searchMode === "single";
  const points = [
    { id: "a", label: isSingleLocation ? "" : "A", location: originA.location, kind: isSingleLocation ? "midpoint" : "originA" },
    ...(isSingleLocation
      ? []
      : [
          { id: "b", label: "B", location: originB.location, kind: "originB" },
          { id: "m", label: "", location: midpoint, kind: "midpoint" }
        ]),
    ...venues.slice(0, 5).map((venue, index) => ({
      id: venue.id,
      label: String(index + 1),
      location: venue.location,
      kind: "venue"
    }))
  ];

  const bounds = getBounds(points.map((point) => point.location));

  return (
    <section className="sticky top-4 overflow-hidden rounded-lg border border-line bg-paper shadow-soft">
      <div className="relative h-[420px] min-h-[320px] w-full">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(17,24,39,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(17,24,39,0.03)_1px,transparent_1px)] bg-[length:64px_64px]" />
        <div className="absolute inset-x-10 top-1/2 h-px -translate-y-1/2 rounded-full bg-line/60" />
        <div className="absolute inset-y-10 left-1/2 w-px -translate-x-1/2 rounded-full bg-line/60" />
        <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-clay/10 blur-2xl" />
        {points.map((point) => {
          const position = project(point.location, bounds);
          const isMidpoint = point.kind === "midpoint";
          return (
            <div
              key={point.id}
              className={`absolute -translate-x-1/2 -translate-y-1/2 ${isMidpoint ? "z-20" : "z-10"}`}
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
              title={point.label}
            >
              <MapMarker label={point.label} kind={point.kind} />
            </div>
          );
        })}
        <div className="absolute left-4 top-4 rounded-lg border border-line bg-paper/95 p-3 shadow-[0_14px_34px_rgba(17,24,39,0.08)] backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-clay">Fairness at a glance</p>
          <p className="mt-1 max-w-[240px] text-sm font-semibold leading-5 text-slate">
            {isSingleLocation ? "See the search center and the best places nearby." : "See both starting points and the best places between them."}
          </p>
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2 rounded-lg border border-line bg-paper/95 p-3 text-xs font-bold text-slate shadow-[0_14px_34px_rgba(17,24,39,0.08)] backdrop-blur">
          {isSingleLocation ? null : <LegendDot className="bg-indigo" label="Person A" />}
          {isSingleLocation ? null : <LegendDot className="bg-ink" label="Person B" />}
          <LegendDot className="bg-clay" label={isSingleLocation ? "Search center" : "Midpoint"} />
          <LegendDot className="bg-white ring-1 ring-line" label="Ranked destinations" />
        </div>
      </div>
    </section>
  );
}

function MapMarker({ label, kind }: { label: string; kind: string }) {
  if (kind === "midpoint") {
    return (
      <span className="relative grid h-16 w-16 place-items-center">
        <span className="absolute inset-0 rounded-full bg-clay/20 animate-pulse" />
        <span className="absolute h-12 w-12 rounded-full bg-clay/20" />
        <span className="relative grid h-9 w-9 place-items-center rounded-full bg-clay shadow-[0_18px_36px_rgba(57,255,20,0.28)]">
          <span className="h-3.5 w-3.5 rounded-full bg-white" />
        </span>
      </span>
    );
  }

  if (kind === "originA") {
    return (
      <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo text-sm font-black text-white shadow-[0_14px_30px_rgba(79,70,229,0.18)]">
        {label}
      </span>
    );
  }

  if (kind === "originB") {
    return (
      <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-sm font-black text-white shadow-[0_14px_30px_rgba(17,24,39,0.18)]">
        {label}
      </span>
    );
  }

  return (
    <span className="grid h-8 w-8 place-items-center rounded-full border border-line bg-white text-xs font-black text-ink shadow-[0_12px_24px_rgba(17,24,39,0.12)]">
      {label}
    </span>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${className}`} aria-hidden="true" />
      {label}
    </span>
  );
}

function getBounds(points: LatLng[]) {
  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latPadding = Math.max((maxLat - minLat) * 0.18, 0.01);
  const lngPadding = Math.max((maxLng - minLng) * 0.18, 0.01);
  return {
    minLat: minLat - latPadding,
    maxLat: maxLat + latPadding,
    minLng: minLng - lngPadding,
    maxLng: maxLng + lngPadding
  };
}

function project(point: LatLng, bounds: ReturnType<typeof getBounds>) {
  const x = ((point.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
  const y = (1 - (point.lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100;
  return {
    x: clamp(x, 8, 92),
    y: clamp(y, 8, 92)
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
