import math
from typing import Dict, Any

def calculate_aqi(pollutants: Dict[str, Dict[str, Any]]) -> int:
    """
    Calculate Air Quality Index from pollutant concentrations
    Uses US EPA AQI calculation method
    """
    if not pollutants:
        return 50  # Default moderate value
    
    max_aqi = 0
    
    # AQI breakpoints for different pollutants (concentration -> AQI)
    breakpoints = {
        "pm25": [
            (0.0, 12.0, 0, 50),
            (12.1, 35.4, 51, 100),
            (35.5, 55.4, 101, 150),
            (55.5, 150.4, 151, 200),
            (150.5, 250.4, 201, 300),
            (250.5, 500.4, 301, 500),
        ],
        "pm10": [
            (0, 54, 0, 50),
            (55, 154, 51, 100),
            (155, 254, 101, 150),
            (255, 354, 151, 200),
            (355, 424, 201, 300),
            (425, 604, 301, 500),
        ],
        "o3": [  # 8-hour average
            (0, 54, 0, 50),
            (55, 70, 51, 100),
            (71, 85, 101, 150),
            (86, 105, 151, 200),
            (106, 200, 201, 300),
        ],
        "no2": [  # 1-hour average
            (0, 53, 0, 50),
            (54, 100, 51, 100),
            (101, 360, 101, 150),
            (361, 649, 151, 200),
            (650, 1249, 201, 300),
            (1250, 2049, 301, 500),
        ],
        "so2": [  # 1-hour average
            (0, 35, 0, 50),
            (36, 75, 51, 100),
            (76, 185, 101, 150),
            (186, 304, 151, 200),
            (305, 604, 201, 300),
            (605, 1004, 301, 500),
        ],
        "co": [  # 8-hour average (ppm to mg/m³: multiply by 1.145)
            (0, 4.4, 0, 50),
            (4.5, 9.4, 51, 100),
            (9.5, 12.4, 101, 150),
            (12.5, 15.4, 151, 200),
            (15.5, 30.4, 201, 300),
            (30.5, 50.4, 301, 500),
        ]
    }
    
    for pollutant, data in pollutants.items():
        if pollutant not in breakpoints:
            continue
        
        concentration = data.get("value")
        if concentration is None:
            continue
        
        # Find appropriate breakpoint
        for bp_low, bp_high, aqi_low, aqi_high in breakpoints[pollutant]:
            if bp_low <= concentration <= bp_high:
                # Linear interpolation
                aqi = ((aqi_high - aqi_low) / (bp_high - bp_low)) * (concentration - bp_low) + aqi_low
                max_aqi = max(max_aqi, int(round(aqi)))
                break
        else:
            # Concentration exceeds highest breakpoint
            if concentration > breakpoints[pollutant][-1][1]:
                max_aqi = max(max_aqi, 500)  # Hazardous
    
    return max(max_aqi, 50) if max_aqi > 0 else 50  # Minimum AQI of 50

def get_health_advice(aqi: int, weather_data: Dict) -> Dict[str, Any]:
    """
    Generate health advice based on AQI level and weather conditions
    """
    wind_speed = weather_data.get("wind_speed_ms", 0)
    precipitation = weather_data.get("precip_mm", 0)
    
    # Base advice by AQI level
    if aqi <= 50:  # Good
        general = "Air quality is good. Perfect day for outdoor activities."
        profiles = {
            "children": "Great day for outdoor play and sports.",
            "asthma": "Normal outdoor activities are fine.",
            "elderly": "Enjoy outdoor activities as usual.",
            "athletes": "Excellent conditions for training and competition."
        }
    elif aqi <= 100:  # Moderate
        general = "Air quality is moderate. Sensitive individuals may experience minor symptoms."
        profiles = {
            "children": "Outdoor activities are generally safe, but watch for any symptoms.",
            "asthma": "Consider carrying your rescue inhaler during outdoor activities.",
            "elderly": "Take breaks during prolonged outdoor activities.",
            "athletes": "You may experience slight decrease in performance during intense workouts."
        }
    elif aqi <= 150:  # Unhealthy for Sensitive Groups
        general = "Sensitive groups should limit prolonged outdoor exertion."
        profiles = {
            "children": "Limit intense outdoor activities. Choose indoor alternatives when possible.",
            "asthma": "Avoid prolonged outdoor exertion. Have your inhaler readily available.",
            "elderly": "Reduce time spent outdoors, especially during midday hours.",
            "athletes": "Consider indoor training. If outdoors, reduce intensity and duration."
        }
    elif aqi <= 200:  # Unhealthy
        general = "Everyone should limit prolonged outdoor exertion."
        profiles = {
            "children": "Avoid outdoor activities. Choose indoor play and exercise.",
            "asthma": "Stay indoors as much as possible. Have emergency medications available.",
            "elderly": "Minimize outdoor exposure. Consider staying indoors with air filtration.",
            "athletes": "Move workouts indoors. Avoid outdoor training."
        }
    elif aqi <= 300:  # Very Unhealthy
        general = "Everyone should avoid all outdoor exertion."
        profiles = {
            "children": "Stay indoors. Keep windows closed and use air purifiers if available.",
            "asthma": "Stay indoors with windows and doors closed. Avoid all outdoor activities.",
            "elderly": "Remain indoors. Consider using air purifiers and avoiding physical exertion.",
            "athletes": "Cancel outdoor training. Even indoor activities should be light."
        }
    else:  # Hazardous
        general = "Health warning: everyone should stay indoors and avoid all outdoor activities."
        profiles = {
            "children": "Emergency conditions: keep children indoors with air filtration if possible.",
            "asthma": "Emergency: stay indoors, have medications ready, seek medical attention if symptoms worsen.",
            "elderly": "Emergency: stay indoors, minimize physical activity, seek medical care if needed.",
            "athletes": "Emergency: cancel all activities. Even light indoor exercise should be avoided."
        }
    
    # Weather modifications
    if wind_speed > 5.0:
        general += " Strong winds may help disperse pollutants."
    
    if precipitation > 2.0:
        general += " Rain is helping to clear the air."
    
    return {
        "general": general,
        "profiles": profiles
    }
