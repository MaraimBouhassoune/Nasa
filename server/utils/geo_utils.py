import math
from typing import Tuple

def format_location_name(lat: float, lon: float) -> str:
    """
    Generate a human-readable location name from coordinates
    """
    # Convert to degrees, minutes for display
    lat_deg = int(abs(lat))
    lat_min = int((abs(lat) - lat_deg) * 60)
    lat_dir = "N" if lat >= 0 else "S"
    
    lon_deg = int(abs(lon))
    lon_min = int((abs(lon) - lon_deg) * 60)
    lon_dir = "E" if lon >= 0 else "W"
    
    return f"{lat_deg}°{lat_min}'{lat_dir}, {lon_deg}°{lon_min}'{lon_dir}"

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on Earth
    Returns distance in kilometers
    """
    # Convert to radians
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    # Haversine formula
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = (math.sin(dlat / 2) ** 2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2)
    c = 2 * math.asin(math.sqrt(a))
    
    # Earth's radius in kilometers
    earth_radius = 6371.0
    
    return earth_radius * c

def get_region_name(lat: float, lon: float) -> str:
    """
    Get a rough region name based on coordinates
    """
    # Very simplified region mapping
    if -90 <= lat < -60:
        return "Antarctica"
    elif -60 <= lat < -30:
        if -180 <= lon < -60:
            return "South America"
        elif -60 <= lon < 20:
            return "South Atlantic"
        elif 20 <= lon < 150:
            return "Africa/Indian Ocean"
        else:
            return "Australia/Pacific"
    elif -30 <= lat < 0:
        if -180 <= lon < -30:
            return "South America"
        elif -30 <= lon < 50:
            return "Africa"
        elif 50 <= lon < 150:
            return "Asia/Australia"
        else:
            return "Pacific Ocean"
    elif 0 <= lat < 30:
        if -180 <= lon < -60:
            return "North America"
        elif -60 <= lon < 0:
            return "South America"
        elif 0 <= lon < 50:
            return "Africa/Middle East"
        elif 50 <= lon < 150:
            return "Asia"
        else:
            return "Pacific Ocean"
    elif 30 <= lat < 60:
        if -180 <= lon < -60:
            return "North America"
        elif -60 <= lon < 20:
            return "Atlantic Ocean"
        elif 20 <= lon < 150:
            return "Europe/Asia"
        else:
            return "Pacific Ocean"
    else:  # lat >= 60
        if -180 <= lon < -60:
            return "North America"
        elif -60 <= lon < 150:
            return "Arctic/Siberia"
        else:
            return "Arctic Ocean"
