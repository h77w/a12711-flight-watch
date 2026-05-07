import os
import requests
from supabase import create_client
import sys
import time
from datetime import datetime, timezone, timedelta

# 1. Setup Connections
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
user = os.environ.get("OPENSKY_USER")
password = os.environ.get("OPENSKY_PASS")

if not all([url, key, user, password]):
    print("❌ ERROR: Missing secrets. Check GitHub Actions Secrets.")
    sys.exit(1)

print("🔗 Step 1: Connecting to Supabase...")
supabase = create_client(url, key)
HEX_CODE = "a12711" 

def check_flight():
    print(f"📡 Step 2: Requesting data for {HEX_CODE} (30s timeout)...")
    
    state_data = None
    try:
        auth = (user, password)
        response = requests.get(
            f"https://opensky-network.org/api/states/all?icao24={HEX_CODE}", 
            auth=auth, 
            timeout=30 
        )
        if response.status_code == 200:
            data = response.json()
            if data.get('states'):
                state_data = data['states'][0]
    except Exception as e:
        print(f"⌛ Step 4: Request failed: {e}")

    # Check for active flight
    active_flight = supabase.table("flight_history").select("*").is_("end_time", "null").execute()
    has_active_flight = len(active_flight.data) > 0

    if state_data:
        # 🧠 CALLSIGN LOGIC: Try to get a fresh one, otherwise keep the old one
        new_callsign = state_data[1].strip() if state_data[1] else None
        
        if has_active_flight:
            # If OpenSky is blank now, use the one already in the DB
            existing_callsign = active_flight.data[0].get('callsign')
            db_callsign = new_callsign if new_callsign else existing_callsign
        else:
            db_callsign = new_callsign if new_callsign else "N/A"

        is_on_ground = state_data[8]
        lat, lon = state_data[6], state_data[5]

        if not is_on_ground and not has_active_flight:
            print(f"🚀 ACTION: Takeoff! Callsign: {db_callsign}")
            supabase.table("flight_history").insert({
                "icao_address": HEX_CODE,
                "callsign": db_callsign,
                "start_time": "now()",
                "last_seen": "now()",
                "last_lat": lat,
                "last_lon": lon,
                "origin_airport": f"{lat}, {lon}"
            }).execute()
        
        elif not is_on_ground and has_active_flight:
            print(f"✅ ACTION: Cruising ({db_callsign}). Saving breadcrumb.")
            flight_id = active_flight.data[0]['id']
            supabase.table("flight_history").update({
                "callsign": db_callsign, # This won't overwrite with null anymore
                "last_seen": "now()",
                "last_lat": lat,
                "last_lon": lon
            }).eq("id", flight_id).execute()

        elif is_on_ground and has_active_flight:
            print(f"🛬 ACTION: Landing confirmed for {db_callsign}. Closing record.")
            flight_id = active_flight.data[0]['id']
            supabase.table("flight_history").update({
                "end_time": "now()",
                "destination_airport": f"{lat}, {lon}"
            }).eq("id", flight_id).execute()
    
    else:
        if signal_gap > timedelta(minutes=30):
                # 1. Define it first
                flight_id = active_flight.data[0]['id'] 
                
                # 2. Then print it
                print(f"🏁 ACTION: Gap exceeded 30m. Auto-closing flight {flight_id}...", flush=True)
                
                old_lat = active_flight.data[0].get('last_lat')
                old_lon = active_flight.data[0].get('last_lon')
                
                supabase.table("flight_history").update({
                    "end_time": "now()",
                    "destination_airport": f"{old_lat}, {old_lon} (Last Seen)"
                }).eq("id", flight_id).execute()
                
                print("🛑 Safety-close complete.", flush=True)
            else:
                print("⏳ Still waiting for signal to return or 30m timer to expire.", flush=True)
        else:
            print("💤 Status: No active flight and no signal. Resting.", flush=True)

if __name__ == "__main__":
    check_flight()
