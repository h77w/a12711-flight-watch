const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const TOKEN_URL =
  "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 8000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

async function getToken(): Promise<string | null> {
  const clientId = Deno.env.get("OPENSKY_USERNAME");
  const clientSecret = Deno.env.get("OPENSKY_PASSWORD");
  if (!clientId || !clientSecret) return null;

  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token;
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetchWithTimeout(
    TOKEN_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
    8000
  );

  if (!res.ok) {
    console.error("OpenSky token fetch failed", res.status, await res.text());
    return null;
  }

  const json = await res.json();
  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 1800) * 1000,
  };
  return cachedToken.token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const icao = "a12711";
  const url = `https://opensky-network.org/api/states/all?icao24=${icao}`;

  try {
    const headers: Record<string, string> = {};
    try {
      const token = await getToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
    } catch (e) {
      console.warn("Token step failed, falling back to anonymous", e);
    }

    const res = await fetchWithTimeout(url, { headers }, 9000);

    if (!res.ok) {
      return new Response(
        JSON.stringify({ state: null, error: `OpenSky HTTP ${res.status}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const json = await res.json();
    const s = json.states?.[0];
    const state = s
      ? {
          callsign: (s[1] || "A12711").trim(),
          lon: s[5],
          lat: s[6],
          altitude: s[7] ?? 0,
          onGround: !!s[8],
          velocity: s[9] ?? 0,
          heading: s[10] ?? 0,
          squawk: s[14],
        }
      : null;

    return new Response(
      JSON.stringify({ state, time: json.time ?? null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    // Never 500 the client — return null state so the UI handles gracefully.
    return new Response(
      JSON.stringify({ state: null, error: (e as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
