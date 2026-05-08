import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@/components/ClientOnly";
import { LiveMap } from "@/components/LiveMap";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/")({
  component: LivePage,
  head: () => ({
    meta: [
      { title: "Live Tracker · A12711" },
      { name: "description", content: "Real-time tactical flight tracker for aircraft A12711." },
    ],
  }),
});

function LivePage() {
  return (
    <div className="h-full w-full flex flex-col">
      <header className="px-6 py-4 border-b border-border bg-card flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-[0.25em]">Aircraft A12711 - B38M</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            Supabase Realtime
          </p>
        </div>
        <StatusBadge />
      </header>
      <div className="flex-1 relative scan-line">
        <ClientOnly fallback={<div className="p-6 text-sm text-muted-foreground">Loading map…</div>}>
          <LiveMap />
        </ClientOnly>
      </div>
    </div>
  );
}
