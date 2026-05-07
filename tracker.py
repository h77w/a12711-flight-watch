import os
import requests
from supabase import create_client

# 1. Setup Connections
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

# Aircraft to track (United B38M - A12711)
HEX_CODE = "a12711" 

def check_flight():
    # 2. Ask OpenSky: "Where is the plane?"
    # Uses the auth credentials you'll put in GitHub Secrets
    auth = (os.environ.get("OPENSKY_USER"), os.environ.get("OPENSKY_PASS"))
    response = requests.get(f"https://opensky-network.org/api/states/all?icao24={HEX_CODE}", auth=auth)
    data = response.json()
    
    # 3. Analyze the data
    if data['states']:
        state = data['states'][0]
        is_on_ground = state[8]
        lat, lon = state[6], state[5]
        squawk = state[14]
        
        # Check if we have an "active" flight in our database (no end_time)
        active_flight = supabase.table("flight_history").select("*").is_("end_time", "null").execute()
        
        if not is_on_ground:
            if not active_flight.data:
                # START NEW FLIGHT
                print("Takeoff detected! Logging new flight...")
                supabase.table("flight_history").insert({
                    "icao_address": HEX_CODE,
                    "start_time": "now()",
                    "is_emergency": (squawk == "7700")
                }).execute()
        else:
            if active_flight.data:
                # END EXISTING FLIGHT
                print("Landing detected! Closing flight record...")
                flight_id = active_flight.data[0]['id']
                supabase.table("flight_history").update({
                    "end_time": "now()",
                    "destination_airport": "Determining..." # Lovable can update this later
                }).eq("id", flight_id).execute()

if __name__ == "__main__":
    check_flight()
