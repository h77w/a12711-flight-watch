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
    </MapContainer>
  );
}
