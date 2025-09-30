import httpx
import asyncio
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from config import get_settings

settings = get_settings()

class OpenAQService:
    """
    OpenAQ air quality data service
    Retrieves real-time and historical air quality measurements from ground stations
    """
    
    def __init__(self):
        self.base_url = settings.openaq_base_url
        self.timeout = 15.0
    
    async def get_nearest_measurements(self, lat: float, lon: float, radius_km: int = 50) -> Dict:
        """
        Get latest measurements from nearest ground stations
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Find nearest stations
                stations_response = await client.get(
                    f"{self.base_url}/locations",
                    params={
                        "coordinates": f"{lat},{lon}",
                        "radius": radius_km * 1000,  # Convert to meters
                        "limit": 10,
                        "order_by": "distance"
                    }
                )
                stations_response.raise_for_status()
                stations_data = stations_response.json()
                
                if not stations_data.get("results"):
                    return {}
                
                # Get measurements from nearest stations
                station_ids = [station["id"] for station in stations_data["results"][:5]]
                
                measurements_response = await client.get(
                    f"{self.base_url}/measurements",
                    params={
                        "location_id": ",".join(map(str, station_ids)),
                        "limit": 100,
                        "order_by": "datetime",
                        "sort": "desc",
                        "date_from": (datetime.now() - timedelta(hours=6)).isoformat(),
                    }
                )
                measurements_response.raise_for_status()
                measurements_data = measurements_response.json()
                
                # Process measurements
                pollutants = {}
                station_ids_used = set()
                
                for measurement in measurements_data.get("results", []):
                    parameter = measurement.get("parameter")
                    value = measurement.get("value")
                    location_id = measurement.get("locationId")
                    
                    if parameter and value is not None:
                        # Map OpenAQ parameter names to our standard names
                        param_mapping = {
                            "no2": "no2",
                            "o3": "o3", 
                            "pm25": "pm25",
                            "pm10": "pm10",
                            "so2": "so2",
                            "co": "co"
                        }
                        
                        standard_param = param_mapping.get(parameter.lower())
                        if standard_param and standard_param not in pollutants:
                            pollutants[standard_param] = value
                            station_ids_used.add(str(location_id))
                
                return {
                    "pollutants": pollutants,
                    "station_ids": list(station_ids_used)
                }
                
        except httpx.RequestError as e:
            print(f"OpenAQ request error: {e}")
            return {}
        except Exception as e:
            print(f"OpenAQ service error: {e}")
            return {}
    
    async def get_historical_data(self, lat: float, lon: float, days: int = 7) -> List[Dict]:
        """
        Get historical air quality data for the past N days
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Calculate date range
                end_date = datetime.now()
                start_date = end_date - timedelta(days=days)
                
                response = await client.get(
                    f"{self.base_url}/measurements",
                    params={
                        "coordinates": f"{lat},{lon}",
                        "radius": 50000,  # 50km radius
                        "date_from": start_date.isoformat(),
                        "date_to": end_date.isoformat(),
                        "limit": 1000,
                        "order_by": "datetime",
                        "sort": "asc"
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                # Process historical data into hourly AQI values
                historical_points = []
                measurements_by_hour = {}
                
                for measurement in data.get("results", []):
                    timestamp = measurement.get("date", {}).get("utc")
                    parameter = measurement.get("parameter")
                    value = measurement.get("value")
                    
                    if timestamp and parameter and value is not None:
                        # Round to nearest hour
                        dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                        hour_key = dt.replace(minute=0, second=0, microsecond=0)
                        
                        if hour_key not in measurements_by_hour:
                            measurements_by_hour[hour_key] = {}
                        
                        measurements_by_hour[hour_key][parameter] = value
                
                # Convert to AQI values for each hour
                for hour, measurements in measurements_by_hour.items():
                    # Simple AQI calculation from available measurements
                    aqi = self._calculate_simple_aqi(measurements)
                    if aqi is not None:
                        historical_points.append({
                            "t": hour.isoformat(),
                            "aqi": aqi
                        })
                
                return sorted(historical_points, key=lambda x: x["t"])
                
        except Exception as e:
            print(f"Error fetching historical data: {e}")
            return []
    
    def _calculate_simple_aqi(self, measurements: Dict[str, float]) -> Optional[int]:
        """Simple AQI calculation from available measurements"""
        if not measurements:
            return None
            
        # Simple approach: use the highest individual pollutant AQI
        max_aqi = 0
        
        # Basic AQI breakpoints for major pollutants
        aqi_breakpoints = {
            "pm25": [(0, 12, 0, 50), (12.1, 35.4, 51, 100), (35.5, 55.4, 101, 150)],
            "pm10": [(0, 54, 0, 50), (55, 154, 51, 100), (155, 254, 101, 150)],
            "o3": [(0, 54, 0, 50), (55, 70, 51, 100), (71, 85, 101, 150)],
            "no2": [(0, 53, 0, 50), (54, 100, 51, 100), (101, 360, 101, 150)],
        }
        
        for param, value in measurements.items():
            if param in aqi_breakpoints:
                for bp_low, bp_high, aqi_low, aqi_high in aqi_breakpoints[param]:
                    if bp_low <= value <= bp_high:
                        aqi = ((aqi_high - aqi_low) / (bp_high - bp_low)) * (value - bp_low) + aqi_low
                        max_aqi = max(max_aqi, int(aqi))
                        break
        
        return max_aqi if max_aqi > 0 else None
