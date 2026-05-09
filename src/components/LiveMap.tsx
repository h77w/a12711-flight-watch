import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from "react-leaflet";
import { aircraftIcon } from "@/lib/map-utils";
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
  const { flight, isActive } = useCurrentFlight();

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

  return (
    <div className="relative h-full w-full">
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
            <Marker position={position} icon={aircraftIcon(0, isActive)}>
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
