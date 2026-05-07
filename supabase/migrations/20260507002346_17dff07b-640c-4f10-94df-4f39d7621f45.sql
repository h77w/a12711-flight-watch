
CREATE TABLE public.flight_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id text NOT NULL DEFAULT 'A12711',
  origin text NOT NULL,
  origin_lat double precision NOT NULL,
  origin_lon double precision NOT NULL,
  destination text NOT NULL,
  destination_lat double precision NOT NULL,
  destination_lon double precision NOT NULL,
  flight_date timestamptz NOT NULL DEFAULT now(),
  is_emergency boolean NOT NULL DEFAULT false,
  is_diversion boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.flight_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read flight history"
  ON public.flight_history FOR SELECT
  USING (true);
