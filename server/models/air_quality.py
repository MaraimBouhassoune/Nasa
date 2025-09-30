from pydantic import BaseModel
from typing import Dict, List, Optional, Any

class PollutantData(BaseModel):
    value: float
    unit: str
    source: List[str]

class WeatherData(BaseModel):
    precip_mm: float
    wind_speed_ms: float
    temp_c: float
    humidity: int
    source: List[str]

class AQIData(BaseModel):
    value: int
    scale: str
    category: str

class ForecastPoint(BaseModel):
    t: str  # ISO timestamp
    aqi: int

class HealthAdvice(BaseModel):
    general: str
    profiles: Dict[str, str]

class DataProvenance(BaseModel):
    tempo: Optional[Dict[str, Any]] = None
    openaq: Optional[Dict[str, Any]] = None
    meteo: Optional[Dict[str, Any]] = None

class AirQualityResponse(BaseModel):
    coord: Dict[str, float]
    location_name: str
    timestamp_iso: str
    pollutants: Dict[str, PollutantData]
    weather: WeatherData
    aqi: AQIData
    forecast_24h: List[ForecastPoint]
    advice: HealthAdvice
    history_7d: List[ForecastPoint]
    provenance: DataProvenance

class CitySearchResult(BaseModel):
    name: str
    country: str
    lat: float
    lon: float
    display_name: str
