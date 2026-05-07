import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from "react-leaflet";
import { greatCircle } from "@/lib/map-utils";
import type { Tables } from "@/integrations/supabase/types";

type Flight = Tables<"flight_history">;

export function HistoryMap({ flights }: { flights: Flight[] }) {
  // Aggregate routes by origin->destination
  const routeCounts = new Map<string, { count: number; flight: Flight }>();
  for (const f of flights) {
    const key = `${f.origin}->${f.destination}`;
    const existing = routeCounts.get(key);
    if (existing) existing.count++;
    else routeCounts.set(key, { count: 1, flight: f });
  }

  const max = Math.max(...Array.from(routeCounts.values()).map((r) => r.count), 1);

  // Unique airport markers
  const airports = new Map<string, { code: string; lat: number; lon: number }>();
  for (const f of flights) {
    airports.set(f.origin, { code: f.origin, lat: f.origin_lat, lon: f.origin_lon });
    airports.set(f.destination, { code: f.destination, lat: f.destination_lat, lon: f.destination_lon });
  }

  return (
    <MapContainer center={[25, -60]} zoom={3} className="h-full w-full" scrollWheelZoom>
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {Array.from(routeCounts.entries()).map(([key, { count, flight }]) => {
        const intensity = count / max; // 0..1
        const weight = 1.5 + intensity * 6;
        const opacity = 0.35 + intensity * 0.6;
        // Heatmap color: cool tactical green -> hot amber/red as count grows
        const color =
          intensity > 0.75
            ? "oklch(0.58 0.24 27)"
            : intensity > 0.4
              ? "oklch(0.7 0.18 65)"
              : "oklch(0.45 0.12 145)";
        const positions = greatCircle(
          [flight.origin_lat, flight.origin_lon],
          [flight.destination_lat, flight.destination_lon],
          80
        );
        return (
          <Polyline
            key={key}
            positions={positions}
            pathOptions={{ color, weight, opacity }}
          >
            <Tooltip sticky>
              <span className="font-mono text-xs">
                {flight.origin} → {flight.destination} · {count} flight{count > 1 ? "s" : ""}
              </span>
            </Tooltip>
          </Polyline>
        );
      })}
      {Array.from(airports.values()).map((a) => (
        <CircleMarker
          key={a.code}
          center={[a.lat, a.lon]}
          radius={4}
          pathOptions={{
            color: "oklch(0.35 0.08 145)",
            fillColor: "oklch(0.99 0 0)",
            fillOpacity: 1,
            weight: 2,
          }}
        >
          <Tooltip permanent direction="top" offset={[0, -6]} className="!bg-card !border !border-border !text-foreground !font-mono !text-[10px]">
            {a.code}
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
