import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from "react-leaflet";
import { aircraftIcon } from "@/lib/map-utils";
import { AlertTriangle } from "lucide-react";
import { useCurrentFlight } from "@/hooks/useFlightHistory";
import { parseLatLon } from "@/lib/flight-utils";

function Recenter({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon], map.getZoom(), { animate: true });
  }, [lat, lon, map]);
  return null;
}

export function LiveMap() {
  const { flight, isActive, loading, error } = useCurrentFlight();

  // Determine displayed position: active → last_lat/lon; inactive → destination of most recent completed
  let position: [number, number] | null = null;
  if (flight) {
    if (isActive && flight.last_lat != null && flight.last_lon != null) {
      position = [flight.last_lat, flight.last_lon];
    } else if (!isActive) {
      position =
        parseLatLon(flight.destination_airport) ??
        (flight.last_lat != null && flight.last_lon != null
          ? [flight.last_lat, flight.last_lon]
          : null);
    }
  }

  const emergency = !!flight?.is_emergency;

  return (
    <div className="relative h-full w-full">
      {emergency && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-destructive text-destructive-foreground px-6 py-2 border-2 border-destructive shadow-lg flex items-center gap-2 pulse-emergency">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-bold tracking-[0.3em]">EMERGENCY</span>
        </div>
      )}

      <div className="absolute top-4 left-4 z-[1000] bg-card border border-border px-4 py-3 text-xs space-y-1 shadow-md min-w-[240px]">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Telemetry</div>
        {loading && <div>Loading…</div>}
        {error && <div className="text-destructive">{error}</div>}
        {!loading && !error && (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  isActive ? "bg-primary animate-pulse" : "bg-muted-foreground"
                }`}
              />
              <span className="uppercase tracking-widest text-[10px]">
                {isActive
                  ? `Flying as ${flight?.callsign ?? "—"}`
                  : "On the ground"}
              </span>
            </div>
            {flight && !isActive && (
              <div className="text-muted-foreground text-[10px] uppercase tracking-widest">
                Last flight · {flight.callsign ?? "—"}
              </div>
            )}
            {position && (
              <div className="font-mono text-[11px]">
                {position[0].toFixed(3)}, {position[1].toFixed(3)}
              </div>
            )}
            {!flight && (
              <div className="text-muted-foreground">No flight data yet.</div>
            )}
          </div>
        )}
      </div>

      <MapContainer
        center={position ?? [30, -100]}
        zoom={position ? 5 : 4}
        className="h-full w-full"
        scrollWheelZoom
        zoomControl={false}
      >
        <ZoomControl position="bottomleft" />
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {position && (
          <>
            <Recenter lat={position[0]} lon={position[1]} />
            <Marker position={position} icon={aircraftIcon(0, emergency)}>
              <Popup>
                <strong>{flight?.callsign ?? "A12711"}</strong>
                <br />
                {isActive ? "In flight" : "On the ground"}
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>
    </div>
  );
}
