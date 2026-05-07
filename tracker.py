import os
import requests
from supabase import create_client
import sys
import time

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
    
    # Retry logic: Try 2 times if there is a timeout
    for attempt in range(2):
        try:
            auth = (user, password)
            response = requests.get(
                f"https://opensky-network.org/api/states/all?icao24={HEX_CODE}", 
                auth=auth, 
                timeout=30 # Increased to 30 seconds
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('states'):
                    state = data['states'][0]
                    is_on_ground = state[8]
                    squawk = state[14]
                    
                    # State Logic: Check for an active flight in Supabase
                    active_flight = supabase.table("flight_history").select("*").is_("end_time", "null").execute()
                    
                    if not is_on_ground and not active_flight.data:
                        print("🚀 TAKEOFF: Plane is up! Logging new flight...")
                        supabase.table("flight_history").insert({
                            "icao_address": HEX_CODE,
                            "start_time": "now()",
                            "is_emergency": (squawk == "7700"),
                            "origin_airport": f"{state[6]}, {state[5]}"
                        }).execute()
                    elif is_on_ground and active_flight.data:
                        print("🛬 LANDING: Plane is down! Closing record.")
                        flight_id = active_flight.data[0]['id']
                        supabase.table("flight_history").update({
                            "end_time": "now()",
                            "destination_airport": f"{state[6]}, {state[5]}"
                        }).eq("id", flight_id).execute()
                    else:
                        status = "Cruising" if not is_on_ground else "Parked"
                        print(f"✅ Status: {status}. Everything is synced.")
                else:
                    print("☁️ Plane not currently visible to OpenSky.")
                return 

        except requests.exceptions.Timeout:
            print(f"⌛ Attempt {attempt + 1} timed out. Retrying in 5s...")
            time.sleep(5)
            
    print("❌ Failed to reach OpenSky after 2 attempts.")

if __name__ == "__main__":
    check_flight()
