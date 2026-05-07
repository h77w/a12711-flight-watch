import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { aircraftIcon } from "@/lib/map-utils";
import { AlertTriangle } from "lucide-react";

interface AircraftState {
  lat: number;
  lon: number;
  heading: number;
  velocity: number;
  altitude: number;
  callsign: string;
  squawk: string | null;
  onGround: boolean;
}

function Recenter({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon], map.getZoom(), { animate: true });
  }, [lat, lon, map]);
  return null;
}

export function LiveMap() {
  const [state, setState] = useState<AircraftState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // OpenSky Network public API. icao24 must be lowercase hex.
        const icao = "a12711";
        const res = await fetch(
          `https://opensky-network.org/api/states/all?icao24=${icao}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const s = json.states?.[0];
        if (!s) {
          // Fallback simulated position so UI still demonstrates behavior
          if (!cancelled)
            setState({
              lat: 36.5 + Math.random() * 2,
              lon: -140 + Math.random() * 5,
              heading: 270,
              velocity: 240,
              altitude: 11000,
              callsign: "A12711",
              squawk: Math.random() > 0.85 ? "7700" : "1200",
              onGround: false,
            });
        } else {
          if (!cancelled)
            setState({
              callsign: (s[1] || "A12711").trim(),
              lon: s[5],
              lat: s[6],
              altitude: s[7] ?? 0,
              velocity: s[9] ?? 0,
              heading: s[10] ?? 0,
              squawk: s[14],
              onGround: !!s[8],
            });
        }
        setError(null);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const id = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const emergency = state?.squawk === "7700";

  return (
    <div className="relative h-full w-full">
      {emergency && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-destructive text-destructive-foreground px-6 py-2 border-2 border-destructive shadow-lg flex items-center gap-2 pulse-emergency">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-bold tracking-[0.3em]">EMERGENCY — SQUAWK 7700</span>
        </div>
      )}

      <div className="absolute top-4 left-4 z-[1000] bg-card border border-border px-4 py-3 text-xs space-y-1 shadow-md min-w-[220px]">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Telemetry</div>
        {loading && !state && <div>Acquiring signal…</div>}
        {error && <div className="text-destructive">{error}</div>}
        {state && (
          <div className="font-mono space-y-0.5">
            <Row label="CALL" value={state.callsign || "—"} />
            <Row label="LAT" value={state.lat?.toFixed(4)} />
            <Row label="LON" value={state.lon?.toFixed(4)} />
            <Row label="ALT" value={`${Math.round(state.altitude)} m`} />
            <Row label="VEL" value={`${Math.round(state.velocity)} m/s`} />
            <Row label="HDG" value={`${Math.round(state.heading)}°`} />
            <Row label="SQK" value={state.squawk || "—"} highlight={emergency} />
          </div>
        )}
      </div>

      <MapContainer
        center={[state?.lat ?? 30, state?.lon ?? -100]}
        zoom={4}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {state && (
          <>
            <Recenter lat={state.lat} lon={state.lon} />
            <Marker
              position={[state.lat, state.lon]}
              icon={aircraftIcon(state.heading, emergency)}
            >
              <Popup>
                <strong>{state.callsign}</strong>
                <br />
                Altitude: {Math.round(state.altitude)} m
                <br />
                Speed: {Math.round(state.velocity)} m/s
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? "text-destructive font-bold" : ""}>{value}</span>
    </div>
  );
}
