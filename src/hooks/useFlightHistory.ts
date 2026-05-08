import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Flight } from "@/lib/flight-utils";

export function useFlightHistory() {
  const [flights, setFlights] = useState<Flight[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("flight_history")
        .select("*")
        .order("start_time", { ascending: false });
      if (cancelled) return;
      if (error) setError(error.message);
      else setFlights((data ?? []) as Flight[]);
    }
    load();

    const channel = supabase
      .channel("flight_history_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "flight_history" },
        () => load()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return { flights, error };
}

/** Returns the active flight (end_time NULL) if any, otherwise the most recent completed one. */
export function useCurrentFlight() {
  const { flights, error } = useFlightHistory();
  if (!flights) return { flight: null, isActive: false, loading: true, error };
  const active = flights.find((f) => f.end_time === null) ?? null;
  if (active) return { flight: active, isActive: true, loading: false, error };
  const lastCompleted = flights.find((f) => f.end_time !== null) ?? null;
  return { flight: lastCompleted, isActive: false, loading: false, error };
}
