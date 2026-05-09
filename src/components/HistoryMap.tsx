import { MapContainer, TileLayer, Polyline, Tooltip } from "react-leaflet";
import { greatCircle } from "@/lib/map-utils";
import { parseLatLon, type Flight } from "@/lib/flight-utils";

export function HistoryMap({ flights }: { flights: Flight[] }) {
  const segments = flights
    .filter((f) => f.end_time !== null)
    .map((f) => {
      const o = parseLatLon(f.origin_airport);
      const d = parseLatLon(f.destination_airport);
      if (!o || !d) return null;
      return { flight: f, origin: o, destination: d };
    })
    .filter((s): s is { flight: Flight; origin: [number, number]; destination: [number, number] } => !!s);

  const airports = new Map<string, [number, number]>();
  for (const s of segments) {
    airports.set(`${s.origin[0]},${s.origin[1]}`, s.origin);
    airports.set(`${s.destination[0]},${s.destination[1]}`, s.destination);
  }

  return (
    <MapContainer center={[25, -60]} zoom={3} className="h-full w-full" scrollWheelZoom>
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {segments.map((s, i) => {
        const positions = greatCircle(s.origin, s.destination, 80);
        return (
          <Polyline
            key={s.flight.id + i}
            positions={positions}
            pathOptions={{ color: "oklch(0.45 0.12 145)", weight: 2.5, opacity: 0.8 }}
          >
            <Tooltip sticky>
              <span className="font-mono text-xs">{s.flight.callsign ?? "Flight"}</span>
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
