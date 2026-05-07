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
        print(f"📡 Step 3: OpenSky responded with status {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            if data.get('states'):
                state_data = data['states'][0]
                print("📡 Step 4: Plane data retrieved successfully.")
            else:
                print("📡 Step 4: Plane is currently invisible (offline).")
    except Exception as e:
        print(f"⌛ Step 4: Request failed/timed out: {e}")

    print("🧠 Step 5: Checking Supabase for any open flights...")
    active_flight = supabase.table("flight_history").select("*").is_("end_time", "null").execute()
    has_active_flight = len(active_flight.data) > 0
    print(f"🧠 Step 6: Active flight in DB? {'Yes' if has_active_flight else 'No'}")

    if state_data:
        # Extract Callsign (Index 1) and strip spaces
        callsign = state_data[1].strip() if state_data[1] else "N/A"
        is_on_ground = state_data[8]
        lat, lon = state_data[6], state_data[5]

        if not is_on_ground and not has_active_flight:
            print(f"🚀 ACTION: Takeoff detected! Callsign: {callsign}")
            supabase.table("flight_history").insert({
                "icao_address": HEX_CODE,
                "callsign": callsign,
                "start_time": "now()",
                "last_seen": "now()",
                "last_lat": lat,
                "last_lon": lon,
                "origin_airport": f"{lat}, {lon}"
            }).execute()
        
        elif not is_on_ground and has_active_flight:
            print(f"✅ ACTION: Cruising ({callsign}). Saving breadcrumb at ({lat}, {lon}).")
            flight_id = active_flight.data[0]['id']
            supabase.table("flight_history").update({
                "callsign": callsign,
                "last_seen": "now()",
                "last_lat": lat,
                "last_lon": lon
            }).eq("id", flight_id).execute()

        elif is_on_ground and has_active_flight:
            print(f"🛬 ACTION: Landing confirmed for {callsign}. Closing record.")
            flight_id = active_flight.data[0]['id']
            supabase.table("flight_history").update({
                "end_time": "now()",
                "destination_airport": f"{lat}, {lon}"
            }).eq("id", flight_id).execute()
    
    else:
        # THE SAFETY NET: If the plane is GONE
        if has_active_flight:
            last_seen_str = active_flight.data[0].get('last_seen') or active_flight.data[0]['start_time']
            last_seen_dt = datetime.fromisoformat(last_seen_str.replace('Z', '+00:00'))
            signal_gap = datetime.now(timezone.utc) - last_seen_dt
            print(f"☁️ Step 7: Signal gap is {signal_gap.seconds // 60} minutes.")

            if signal_gap > timedelta(minutes=30):
                print("🏁 ACTION: Auto-closing flight using last saved breadcrumb.")
                flight_id = active_flight.data[0]['id']
                old_lat = active_flight.data[0].get('last_lat', "Unknown")
                old_lon = active_flight.data[0].get('last_lon', "Unknown")
                supabase.table("flight_history").update({
                    "end_time": "now()",
                    "destination_airport": f"{old_lat}, {old_lon} (Last Seen)"
                }).eq("id", flight_id).execute()
            else:
                print("⏳ Step 7: Gap is small. Keeping flight open.")
        else:
            print("💤 Step 7: Plane is offline and no flights are open. Resting.")

if __name__ == "__main__":
    check_flight()
