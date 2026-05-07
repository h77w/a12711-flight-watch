const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const username = Deno.env.get("OPENSKY_USERNAME");
    const password = Deno.env.get("OPENSKY_PASSWORD");
    const icao = "a12711";

    const headers: Record<string, string> = {};
    if (username && password) {
      headers["Authorization"] =
        "Basic " + btoa(`${username}:${password}`);
    }

    const res = await fetch(
      `https://opensky-network.org/api/states/all?icao24=${icao}`,
      { headers }
    );

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: `OpenSky HTTP ${res.status}` }),
        {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
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

    return new Response(JSON.stringify({ state, time: json.time ?? null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
