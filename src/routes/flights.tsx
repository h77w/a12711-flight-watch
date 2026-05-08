import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { useFlightHistory } from "@/hooks/useFlightHistory";
import { formatDuration } from "@/lib/flight-utils";

export const Route = createFileRoute("/flights")({
  component: FlightsPage,
  head: () => ({
    meta: [
      { title: "Past Flights · A12711" },
      { name: "description", content: "Log of all completed flights for aircraft A12711." },
    ],
  }),
});

function FlightsPage() {
  const { flights, error } = useFlightHistory();
  const completed = flights?.filter((f) => f.end_time !== null) ?? [];

  return (
    <div className="h-full w-full flex flex-col">
      <header className="px-6 py-4 border-b border-border bg-card flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-[0.25em]">Past Flights</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            {completed.length} completed
          </p>
        </div>
        <StatusBadge />
      </header>
      <div className="flex-1 overflow-y-auto">
        {!flights && <div className="p-6 text-sm text-muted-foreground">Loading…</div>}
        {error && <div className="p-6 text-sm text-destructive">{error}</div>}
        {flights && completed.length === 0 && (
          <div className="p-6 text-sm text-muted-foreground uppercase tracking-widest">
            No completed flights yet.
          </div>
        )}
        <div className="divide-y divide-border">
          {completed.map((f) => {
            const flagged = f.is_emergency || f.is_diversion;
            return (
              <div
                key={f.id}
                className={`px-6 py-4 ${
                  flagged ? "bg-destructive/10 border-l-4 border-l-destructive" : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-bold tracking-wider">{f.callsign ?? "—"}</span>
                    {flagged && <AlertTriangle className="h-4 w-4 text-destructive" />}
                  </div>
                  <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">
                    {formatDuration(f.start_time, f.end_time)}
                  </span>
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                  {new Date(f.start_time).toLocaleString()}
                </div>
                {flagged && (
                  <div className="mt-1 text-[10px] uppercase tracking-widest text-destructive font-bold">
                    {f.is_emergency && "Emergency"}
                    {f.is_emergency && f.is_diversion && " · "}
                    {f.is_diversion && "Diverted"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
