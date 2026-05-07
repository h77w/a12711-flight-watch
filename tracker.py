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

supabase = create_client(url, key)
HEX_CODE = "a12711" 

def check_flight():
    print(f"📡 Requesting data for {HEX_CODE} (30s timeout)...")
    
    # Try to get the current state from OpenSky
    state_data = None
    for attempt in range(2):
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
                break
        except Exception as e:
            print(f"⌛ Attempt {attempt + 1} timed out or failed. Retrying...")
            time.sleep(5)

    # 2. Check for an active flight in our "Brain" (Supabase)
    active_flight = supabase.table("flight_history").select("*").is_("end_time", "null").execute()
    has_active_flight = len(active_flight.data) > 0

    # 3. Logic Branching
    if state_data:
        is_on_ground = state_data[8]
        squawk = state_data[14]
        lat, lon = state_data[6], state_data[5]

        if not is_on_ground and not has_active_flight:
            print("🚀 TAKEOFF: New flight detected. Logging to Supabase.")
            supabase.table("flight_history").insert({
                "icao_address": HEX_CODE,
                "start_time": "now()",
                "is_emergency": (squawk == "7700"),
                "origin_airport": f"{lat}, {lon}"
            }).execute()
        
        elif is_on_ground and has_active_flight:
            print("🛬 LANDING: Normal landing detected. Closing record.")
            flight_id = active_flight.data[0]['id']
            supabase.table("flight_history").update({
                "end_time": "now()",
                "destination_airport": f"{lat}, {lon}"
            }).eq("id", flight_id).execute()
        
        else:
            print(f"✅ Status: {'Cruising' if not is_on_ground else 'Parked'}. No changes needed.")

    else:
        # 4. THE SAFETY NET: What if the plane is GONE?
        if has_active_flight:
            print("☁️ Plane is invisible to OpenSky, but a flight is open in the DB.")
            
            # Check if we should auto-close (if the flight has been open for > 30 mins)
            start_str = active_flight.data[0]['start_time']
            # Handles different timestamp formats from Supabase
            start_time = datetime.fromisoformat(start_str.replace('Z', '+00:00'))
            duration = datetime.now(timezone.utc) - start_time

            if duration > timedelta(minutes=30):
                print("🏁 AUTO-CLOSE: Signal lost for over 30 mins. Assuming landing.")
                flight_id = active_flight.data[0]['id']
                supabase.table("flight_history").update({
                    "end_time": "now()",
                    "destination_airport": "Signal Lost (Last Known)"
                }).eq("id", flight_id).execute()
            else:
                print(f"⏳ Waiting for more data. Flight only started {duration.seconds // 60} mins ago.")
        else:
            print("💤 Plane is offline and no flights are open. Resting.")

if __name__ == "__main__":
    check_flight()
