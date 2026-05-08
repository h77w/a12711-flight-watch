
-- Align flight_history schema with the Python tracker robot, and enable realtime.
DROP TABLE IF EXISTS public.flight_history CASCADE;

CREATE TABLE public.flight_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  icao_address text NOT NULL DEFAULT 'a12711',
  callsign text,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  last_seen timestamptz,
  last_lat double precision,
  last_lon double precision,
  origin_airport text,
  destination_airport text,
  is_emergency boolean NOT NULL DEFAULT false,
  is_diversion boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_flight_history_active ON public.flight_history (end_time) WHERE end_time IS NULL;
CREATE INDEX idx_flight_history_start ON public.flight_history (start_time DESC);

ALTER TABLE public.flight_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read flight history"
  ON public.flight_history FOR SELECT
  USING (true);

-- Realtime
ALTER TABLE public.flight_history REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.flight_history;
