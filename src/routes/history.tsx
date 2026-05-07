import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientOnly } from "@/components/ClientOnly";
import { HistoryMap } from "@/components/HistoryMap";
import { AlertTriangle, ArrowRight } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Flight = Tables<"flight_history">;

export const Route = createFileRoute("/history")({
  component: HistoryPage,
  head: () => ({
    meta: [
      { title: "Flight History · A12711" },
      { name: "description", content: "Past flights, route heatmap and emergency events for aircraft A12711." },
    ],
  }),
});

function HistoryPage() {
  const { data: flights, isLoading } = useQuery({
    queryKey: ["flight_history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flight_history")
        .select("*")
        .order("flight_date", { ascending: false });
      if (error) throw error;
      return data as Flight[];
    },
  });

  return (
    <div className="h-full w-full flex">
      <section className="w-[420px] shrink-0 border-r border-border bg-card flex flex-col">
        <header className="px-5 py-4 border-b border-border">
          <h1 className="text-lg font-bold uppercase tracking-[0.25em]">Flight Log</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            {flights?.length ?? 0} records
          </p>
        </header>
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {isLoading && <div className="p-4 text-sm text-muted-foreground">Loading…</div>}
          {!isLoading && (!flights || flights.length === 0) && (
            <div className="p-6 text-sm text-muted-foreground uppercase tracking-widest">
              No flight history available.
            </div>
          )}
          {flights?.map((f) => {
            const flagged = f.is_emergency || f.is_diversion;
            return (
              <div
                key={f.id}
                className={`px-5 py-3 ${
                  flagged ? "bg-destructive/10 border-l-4 border-l-destructive" : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold tracking-wider">
                    <span>{f.origin}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span>{f.destination}</span>
                  </div>
                  {flagged && <AlertTriangle className="h-4 w-4 text-destructive" />}
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                  {new Date(f.flight_date).toLocaleString()}
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
      </section>

      <section className="flex-1 relative scan-line">
        <div className="absolute top-4 left-4 z-[1000] bg-card border border-border px-4 py-3 text-xs shadow-md">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Route Heatmap</div>
          <div className="space-y-1 font-mono">
            <LegendRow color="oklch(0.45 0.12 145)" label="Low frequency" />
            <LegendRow color="oklch(0.7 0.18 65)" label="Medium" />
            <LegendRow color="oklch(0.58 0.24 27)" label="High frequency" />
          </div>
        </div>
        <ClientOnly fallback={<div className="p-6 text-sm text-muted-foreground">Loading map…</div>}>
          {flights && <HistoryMap flights={flights} />}
        </ClientOnly>
      </section>
    </div>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block w-6 h-1" style={{ background: color }} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
