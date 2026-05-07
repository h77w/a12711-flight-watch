import os
import requests
from supabase import create_client
import sys

# 1. Setup Connections
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
user = os.environ.get("OPENSKY_USER")
password = os.environ.get("OPENSKY_PASS")

if not all([url, key, user, password]):
    print("❌ ERROR: Missing one or more secrets (URL, Key, User, or Pass).")
    sys.exit(1)

supabase = create_client(url, key)
HEX_CODE = "a12711" 

def check_flight():
    print(f"📡 Checking status for aircraft {HEX_CODE}...")
    
    try:
        # 2. Ask OpenSky (with a strict 10-second timeout)
        auth = (user, password)
        response = requests.get(
            f"https://opensky-network.org/api/states/all?icao24={HEX_CODE}", 
            auth=auth, 
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ OpenSky returned an error code: {response.status_code}")
            return

        data = response.json()
        
        # 3. Analyze the data
        if data.get('states'):
            state = data['states'][0]
            is_on_ground = state[8]
            squawk = state[14]
            print(f"✈️ Plane found! On ground: {is_on_ground} | Squawk: {squawk}")
            
            active_flight = supabase.table("flight_history").select("*").is_("end_time", "null").execute()
            
            if not is_on_ground:
                if not active_flight.data:
                    print("🚀 Takeoff detected! Logging to Supabase...")
                    supabase.table("flight_history").insert({
                        "icao_address": HEX_CODE,
                        "start_time": "now()",
                        "is_emergency": (squawk == "7700")
                    }).execute()
            else:
                if active_flight.data:
                    print("🛬 Landing detected! Closing flight record...")
                    flight_id = active_flight.data[0]['id']
                    supabase.table("flight_history").update({"end_time": "now()"}).eq("id", flight_id).execute()
        else:
            print("☁️ Plane is currently offline or out of range.")

    except requests.exceptions.Timeout:
        print("⌛ ERROR: OpenSky took too long to respond (Timeout).")
    except Exception as e:
        print(f"⚠️ An unexpected error occurred: {e}")

if __name__ == "__main__":
    check_flight()
