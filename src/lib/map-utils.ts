import L from "leaflet";
import aircraftPng from "@/assets/aircraft.png";

const AIRCRAFT_W = 72;
const AIRCRAFT_H = Math.round(72 * (1536 / 1549)); // preserve original aspect ratio

export const aircraftIcon = (heading = 0, active = false) =>
  L.divIcon({
    className: "",
    iconSize: [AIRCRAFT_W, AIRCRAFT_H],
    iconAnchor: [AIRCRAFT_W / 2, AIRCRAFT_H / 2],
    html: `
      <div class="${active ? "pulse-active" : ""}" style="width:${AIRCRAFT_W}px;height:${AIRCRAFT_H}px;display:flex;align-items:center;justify-content:center;">
        <img src="${aircraftPng}" style="width:100%;height:100%;object-fit:contain;transform:rotate(${heading}deg);" />
      </div>
    `,
  });

// Great-circle interpolation between two lat/lon points
export function greatCircle(
  start: [number, number],
  end: [number, number],
  segments = 64
): [number, number][] {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const [lat1, lon1] = [toRad(start[0]), toRad(start[1])];
  const [lat2, lon2] = [toRad(end[0]), toRad(end[1])];

  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((lat2 - lat1) / 2) ** 2 +
          Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2
      )
    );

  if (d === 0) return [start, end];

  const points: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const f = i / segments;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lon = Math.atan2(y, x);
    points.push([toDeg(lat), toDeg(lon)]);
  }
  return points;
}
