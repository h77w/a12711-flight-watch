import type { Tables } from "@/integrations/supabase/types";

export type Flight = Tables<"flight_history">;

/** Parse "lat, lon" string into [lat, lon]. Returns null if invalid. */
export function parseLatLon(value: string | null | undefined): [number, number] | null {
  if (!value) return null;
  const parts = value.split(",").map((p) => parseFloat(p.trim()));
  if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) return null;
  return [parts[0], parts[1]];
}

export function formatDuration(startISO: string, endISO: string | null): string {
  const start = new Date(startISO).getTime();
  const end = endISO ? new Date(endISO).getTime() : Date.now();
  const mins = Math.max(0, Math.round((end - start) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
