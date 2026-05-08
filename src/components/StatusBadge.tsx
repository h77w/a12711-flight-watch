import { useCurrentFlight } from "@/hooks/useFlightHistory";

export function StatusBadge() {
  const { flight, isActive, loading } = useCurrentFlight();
  if (loading) return null;
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border border-border bg-card text-[11px] uppercase tracking-widest">
      <span
        className={`inline-block w-2 h-2 rounded-full ${
          isActive ? "bg-primary animate-pulse" : "bg-muted-foreground"
        }`}
      />
      <span>
        {isActive ? `Flying as ${flight?.callsign ?? "—"}` : "On the ground"}
      </span>
    </div>
  );
}
