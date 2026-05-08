import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from "react-leaflet";
import { greatCircle } from "@/lib/map-utils";
import { parseLatLon, type Flight } from "@/lib/flight-utils";

export function HistoryMap({ flights }: { flights: Flight[] }) {
  // Only completed flights with parseable origin + destination
  const segments = flights
    .filter((f) => f.end_time !== null)
    .map((f) => {
      const o = parseLatLon(f.origin_airport);
      const d = parseLatLon(f.destination_airport);
      if (!o || !d) return null;
      return { flight: f, origin: o, destination: d };
    })
    .filter((s): s is { flight: Flight; origin: [number, number]; destination: [number, number] } => !!s);

  // Bucket routes for heatmap (round to ~0.5 deg so similar coords merge)
  const routeCounts = new Map<string, number>();
  const round = (n: number) => Math.round(n * 2) / 2;
  for (const s of segments) {
    const key = `${round(s.origin[0])},${round(s.origin[1])}→${round(s.destination[0])},${round(s.destination[1])}`;
    routeCounts.set(key, (routeCounts.get(key) ?? 0) + 1);
  }
  const max = Math.max(...Array.from(routeCounts.values()), 1);

  // Unique airports
  const airports = new Map<string, [number, number]>();
  for (const s of segments) {
    airports.set(`${round(s.origin[0])},${round(s.origin[1])}`, s.origin);
    airports.set(`${round(s.destination[0])},${round(s.destination[1])}`, s.destination);
  }

  return (
    <MapContainer center={[25, -60]} zoom={3} className="h-full w-full" scrollWheelZoom>
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {segments.map((s, i) => {
        const key = `${round(s.origin[0])},${round(s.origin[1])}→${round(s.destination[0])},${round(s.destination[1])}`;
        const count = routeCounts.get(key) ?? 1;
        const intensity = count / max;
        const weight = 1.5 + intensity * 6;
        const opacity = 0.35 + intensity * 0.6;
        const color =
          intensity > 0.75
            ? "oklch(0.58 0.24 27)"
            : intensity > 0.4
              ? "oklch(0.7 0.18 65)"
              : "oklch(0.45 0.12 145)";
        const positions = greatCircle(s.origin, s.destination, 80);
        return (
          <Polyline key={s.flight.id + i} positions={positions} pathOptions={{ color, weight, opacity }}>
            <Tooltip sticky>
              <span className="font-mono text-xs">
                {s.flight.callsign ?? "Flight"} · {count} flight{count > 1 ? "s" : ""}
              </span>
            </Tooltip>
          </Polyline>
        );
      })}
      {Array.from(airports.values()).map(([lat, lon], i) => (
        <CircleMarker
          key={`${lat},${lon},${i}`}
          center={[lat, lon]}
          radius={4}
          pathOptions={{
            color: "oklch(0.35 0.08 145)",
            fillColor: "oklch(0.99 0 0)",
            fillOpacity: 1,
            weight: 2,
          }}
        />
      ))}
    </MapContainer>
  );
}
