import os
import requests
from supabase import create_client
import sys
import time
from datetime import datetime, timezone, timedelta

# Setup
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
user = os.environ.get("OPENSKY_USER")
password = os.environ.get("OPENSKY_PASS")
supabase = create_client(url, key)
HEX_CODE = "a12711" 

def check_flight():
    print(f"📡 Requesting data for {HEX_CODE}...")
    
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
        print(f"⌛ Connection issue: {e}")

    # Check for active flight
    active_flight = supabase.table("flight_history").select("*").is_("end_time", "null").execute()
    has_active_flight = len(active_flight.data) > 0

    if state_data:
        is_on_ground = state_data[8]
        lat, lon = state_data[6], state_data[5]

        if not is_on_ground and not has_active_flight:
            print("🚀 TAKEOFF: Logging new flight with initial coordinates.")
            supabase.table("flight_history").insert({
                "icao_address": HEX_CODE,
                "start_time": "now()",
                "last_seen": "now()",
                "last_lat": lat,
                "last_lon": lon,
                "origin_airport": f"{lat}, {lon}"
            }).execute()
        
        elif not is_on_ground and has_active_flight:
            print(f"✅ Cruising: Saving current position ({lat}, {lon}) to database.")
            flight_id = active_flight.data[0]['id']
            # HEARTBEAT UPDATE: Save progress so we have it if the signal drops
            supabase.table("flight_history").update({
                "last_seen": "now()",
                "last_lat": lat,
                "last_lon": lon
            }).eq("id", flight_id).execute()

        elif is_on_ground and has_active_flight:
            print("🛬 LANDING: Signal confirmed on ground. Closing record.")
            flight_id = active_flight.data[0]['id']
            supabase.table("flight_history").update({
                "end_time": "now()",
                "destination_airport": f"{lat}, {lon}"
            }).eq("id", flight_id).execute()
    
    else:
        # THE AUTO-CLOSE SAFETY NET
        if has_active_flight:
            last_seen_str = active_flight.data[0].get('last_seen') or active_flight.data[0]['start_time']
            last_seen_dt = datetime.fromisoformat(last_seen_str.replace('Z', '+00:00'))
            signal_gap = datetime.now(timezone.utc) - last_seen_dt

            if signal_gap > timedelta(minutes=30):
                print("🏁 AUTO-CLOSE: Using last known coordinates as destination.")
                flight_id = active_flight.data[0]['id']
                
                # Retrieve the last saved coordinates from the record
                old_lat = active_flight.data[0].get('last_lat')
                old_lon = active_flight.data[0].get('last_lon')
                
                supabase.table("flight_history").update({
                    "end_time": "now()",
                    "destination_airport": f"{old_lat}, {old_lon} (Last Seen)"
                }).eq("id", flight_id).execute()
            else:
                print(f"⏳ Signal lost for {signal_gap.seconds // 60} mins. Holding open...")

if __name__ == "__main__":
    check_flight()
