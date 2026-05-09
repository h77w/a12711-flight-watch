// Dedicated client for the EXTERNAL Supabase project that the Python tracker
// writes flight_history to. This is separate from the internal Lovable Cloud
// client in ./client.ts.
import { createClient } from "@supabase/supabase-js";

const EXTERNAL_SUPABASE_URL = "https://frdcecidxurlgqaefaln.supabase.co";
const EXTERNAL_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_lsXCn1vQDWcxPY1L0gV7qQ_46s4HOqM";

export const externalSupabase = createClient(
  EXTERNAL_SUPABASE_URL,
  EXTERNAL_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
