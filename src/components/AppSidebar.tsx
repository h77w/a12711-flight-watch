import { Link, useRouterState } from "@tanstack/react-router";
import { Radio, History, Plane } from "lucide-react";

const items = [
  { title: "Live", url: "/", icon: Radio },
  { title: "History", url: "/history", icon: History },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col">
      <div className="px-4 py-5 border-b border-border flex items-center gap-2">
        <Plane className="h-5 w-5 text-primary" />
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Tracker</div>
          <div className="text-sm font-bold">A12711</div>
        </div>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {items.map((item) => {
          const active = pathname === item.url;
          return (
            <Link
              key={item.url}
              to={item.url}
              className={`flex items-center gap-2 px-3 py-2 text-sm uppercase tracking-wider rounded-sm transition-colors border ${
                active
                  ? "bg-tactical text-tactical-foreground border-tactical"
                  : "border-transparent hover:bg-muted text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border text-[10px] uppercase tracking-widest text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          System Online
        </div>
      </div>
    </aside>
  );
}
