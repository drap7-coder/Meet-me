import type { GeocodedLocation, LatLng, ScoredVenue } from "@/lib/types";

type Props = {
  originA: GeocodedLocation;
  originB: GeocodedLocation;
  midpoint: LatLng;
  venues: ScoredVenue[];
};

export function ResultsMap({ originA, originB, midpoint, venues }: Props) {
  const points = [
    { id: "a", label: "A", location: originA.location, className: "bg-ink text-white" },
    { id: "b", label: "B", location: originB.location, className: "bg-ink text-white" },
    { id: "m", label: "•", location: midpoint, className: "bg-clay text-white" },
    ...venues.slice(0, 8).map((venue, index) => ({
      id: venue.id,
      label: String(index + 1),
      location: venue.location,
      className: "bg-ink text-white"
    }))
  ];

  const bounds = getBounds(points.map((point) => point.location));

  return (
    <section className="sticky top-4 overflow-hidden rounded-lg border border-line bg-sky shadow-soft">
      <div className="relative h-[420px] min-h-[320px] w-full bg-[linear-gradient(135deg,rgba(255,255,255,.72)_25%,transparent_25%),linear-gradient(225deg,rgba(255,255,255,.72)_25%,transparent_25%),linear-gradient(45deg,rgba(255,255,255,.72)_25%,transparent_25%),linear-gradient(315deg,rgba(255,255,255,.72)_25%,#f2eee7_25%)] bg-[length:38px_38px] bg-[position:19px_0,19px_0,0_0,0_0]">
        <div className="absolute inset-x-6 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/60" />
        <div className="absolute inset-y-8 left-1/2 w-1 -translate-x-1/2 rounded-full bg-white/60" />
        {points.map((point) => {
          const position = project(point.location, bounds);
          return (
            <div
              key={point.id}
              className={`absolute grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-sm font-black shadow-soft ${point.className}`}
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
              title={point.label}
            >
              {point.label}
            </div>
          );
        })}
        <div className="absolute bottom-3 left-3 right-3 rounded-lg border border-line bg-paper/90 p-3 text-xs font-semibold text-slate backdrop-blur">
          A simple view of where both of you are starting and the best spots between you.
        </div>
      </div>
    </section>
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
