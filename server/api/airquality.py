from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, List, Any
import asyncio
from datetime import datetime, timezone

from services.tempo_service import TempoService
from services.openaq_service import OpenAQService
from services.weather_service import WeatherService
from services.ml_service import MLService
from services.cache_service import CacheService
from utils.aqi_calculator import calculate_aqi, get_health_advice
from utils.geo_utils import format_location_name
from models.air_quality import (
    AirQualityResponse, 
    WeatherData, 
    AQIData, 
    ForecastPoint, 
    HealthAdvice, 
    DataProvenance,
    PollutantData
)

router = APIRouter()

# Initialize services
tempo_service = TempoService()
openaq_service = OpenAQService()
weather_service = WeatherService()
ml_service = MLService()
cache_service = CacheService()

@router.get("/airquality", response_model=AirQualityResponse)
async def get_air_quality(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
    hours: int = Query(24, ge=1, le=48, description="Forecast hours")
):
    """
    Get comprehensive air quality data for a location including:
    - Current pollutant levels from TEMPO and OpenAQ
    - Weather conditions from IMERG/MERRA-2
    - AQI calculation and health advice
    - ML-based forecast
    - Historical data
    """
    try:
        # Check cache first
        cache_key = f"airquality:{lat:.2f}:{lon:.2f}"
        cached_data = cache_service.get(cache_key)
        if cached_data:
            return cached_data

        # Fetch data from all sources concurrently
        tasks = [
            tempo_service.get_pollutants(lat, lon),
            openaq_service.get_nearest_measurements(lat, lon),
            weather_service.get_weather_data(lat, lon),
            openaq_service.get_historical_data(lat, lon, days=7)
        ]
        
        tempo_data, openaq_data, weather_data, historical_data = await asyncio.gather(
            *tasks, return_exceptions=True
        )

        # Handle exceptions from individual services
        tempo_dict: Dict[str, Any] = {}
        if isinstance(tempo_data, Exception):
            tempo_dict = {}
        elif tempo_data:
            tempo_dict = tempo_data
            
        openaq_dict: Dict[str, Any] = {}
        if isinstance(openaq_data, Exception):
            openaq_dict = {}
        elif openaq_data:
            openaq_dict = openaq_data
            
        weather_dict: Dict[str, Any] = {}
        if isinstance(weather_data, Exception):
            weather_dict = {}
        elif weather_data:
            weather_dict = weather_data
            
        historical_list: List[Dict[str, Any]] = []
        if isinstance(historical_data, Exception):
            historical_list = []
        elif historical_data:
            historical_list = historical_data

        # Merge pollutant data from TEMPO and OpenAQ
        merged_pollutants: Dict[str, Dict[str, Any]] = {}
        
        # TEMPO data (satellite)
        for pollutant, value in tempo_dict.items():
            if value is not None:
                merged_pollutants[pollutant] = {
                    "value": value,
                    "unit": "µg/m³" if pollutant != "hcho" else "ppb",
                    "source": ["TEMPO"]
                }

        # OpenAQ data (ground stations) - merge or use as fallback
        for pollutant, value in openaq_dict.get("pollutants", {}).items():
            if pollutant in merged_pollutants:
                # Average TEMPO and OpenAQ values, weighted towards ground truth
                tempo_val = merged_pollutants[pollutant]["value"]
                merged_val = (tempo_val * 0.4) + (value * 0.6)  # Weight ground stations higher
                merged_pollutants[pollutant]["value"] = merged_val
                merged_pollutants[pollutant]["source"].append("OpenAQ")
            else:
                merged_pollutants[pollutant] = {
                    "value": value,
                    "unit": "µg/m³",
                    "source": ["OpenAQ"]
                }

        # Calculate AQI from pollutants
        aqi_value = calculate_aqi(merged_pollutants)
        
        # Generate health advice
        health_advice = get_health_advice(aqi_value, weather_dict)

        # Generate forecast using ML
        forecast_data = await ml_service.predict_forecast(
            lat, lon, historical_list, weather_dict, hours
        )

        # Build response
        # Convert pollutants to PollutantData models
        pollutant_models = {
            key: PollutantData(**value) 
            for key, value in merged_pollutants.items()
        }
        
        response_data = AirQualityResponse(
            coord={"lat": lat, "lon": lon},
            location_name=format_location_name(lat, lon),
            timestamp_iso=datetime.now(timezone.utc).isoformat(),
            pollutants=pollutant_models,
            weather=WeatherData(**weather_dict) if weather_dict else WeatherData(
                precip_mm=0.0, wind_speed_ms=0.0, temp_c=20.0, humidity=60, source=[]
            ),
            aqi=AQIData(
                value=aqi_value,
                scale="0-500",
                category=get_aqi_category(aqi_value)
            ),
            forecast_24h=[ForecastPoint(**point) for point in forecast_data],
            advice=HealthAdvice(**health_advice),
            history_7d=[ForecastPoint(**point) for point in historical_list[-168:]] if historical_list else [],
            provenance=DataProvenance(
                tempo={"product": "NO2/O3/PM/HCHO", "nrt": True} if tempo_dict else None,
                openaq={"station_ids": openaq_dict.get("station_ids", [])} if openaq_dict else None,
                meteo={
                    "imerg": bool(weather_dict.get("precip_mm") is not None),
                    "merra2": bool(weather_dict.get("wind_speed_ms") is not None)
                }
            )
        )

        # Cache the response
        cache_service.set(cache_key, response_data)
        
        return response_data

    except Exception as e:
        print(f"Error in air quality endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch air quality data: {str(e)}")

def get_aqi_category(aqi: int) -> str:
    """Convert AQI value to category string"""
    if aqi <= 50:
        return "Good"
    elif aqi <= 100:
        return "Moderate"
    elif aqi <= 150:
        return "Unhealthy for Sensitive Groups"
    elif aqi <= 200:
        return "Unhealthy"
    elif aqi <= 300:
        return "Very Unhealthy"
    else:
        return "Hazardous"
