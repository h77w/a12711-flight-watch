import { useEffect, useState } from "react";
import { useCurrentFlight } from "@/hooks/useFlightHistory";

function formatLastSeen(lastSeen: string): string {
  const diffMs = Date.now() - new Date(lastSeen).getTime();
  const totalMins = Math.max(0, Math.floor(diffMs / 60000));
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0) return `last seen ${h}h ${m}m ago`;
  return `last seen ${m}m ago`;
}

export function StatusBadge() {
  const { flight, isActive, loading } = useCurrentFlight();
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  if (loading) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 px-3 py-1.5 border border-border bg-card text-[11px] uppercase tracking-widest">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            isActive ? "bg-primary animate-pulse" : "bg-muted-foreground"
          }`}
        />
        <span>
          {isActive
            ? `Flying as ${flight?.callsign ?? "—"}`
            : "On the ground / Out of range"}
        </span>
      </div>
      {flight?.last_seen && (
        <div className="px-3 py-1.5 border border-border bg-card text-[11px] uppercase tracking-widest text-muted-foreground">
          {formatLastSeen(flight.last_seen)}
        </div>
      )}
    </div>
  );
}
