import L from "leaflet";

export const aircraftIcon = (heading = 0, emergency = false) =>
  L.divIcon({
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html: `
      <div class="${emergency ? "pulse-emergency" : ""}" style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
        <svg viewBox="0 0 24 24" width="32" height="32" style="transform: rotate(${heading}deg); color: ${emergency ? "oklch(0.58 0.24 27)" : "oklch(0.35 0.08 145)"};" fill="currentColor">
          <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z"/>
        </svg>
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
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lon = Math.atan2(y, x);
    points.push([toDeg(lat), toDeg(lon)]);
  }
  return points;
}
