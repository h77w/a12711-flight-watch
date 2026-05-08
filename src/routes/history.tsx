import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@/components/ClientOnly";
import { HistoryMap } from "@/components/HistoryMap";
import { StatusBadge } from "@/components/StatusBadge";
import { useFlightHistory } from "@/hooks/useFlightHistory";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
  head: () => ({
    meta: [
      { title: "History Map · A12711" },
      { name: "description", content: "Great Circle map of all past flights for aircraft A12711." },
    ],
  }),
});

function HistoryPage() {
  const { flights } = useFlightHistory();

  return (
    <div className="h-full w-full flex flex-col">
      <header className="px-6 py-4 border-b border-border bg-card flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-[0.25em]">History Map</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            Great Circle routes · {flights?.filter((f) => f.end_time).length ?? 0} flights
          </p>
        </div>
        <StatusBadge />
      </header>
      <section className="flex-1 relative scan-line">
        <ClientOnly fallback={<div className="p-6 text-sm text-muted-foreground">Loading map…</div>}>
          {flights && <HistoryMap flights={flights} />}
        </ClientOnly>
      </section>
    </div>
  );
}
