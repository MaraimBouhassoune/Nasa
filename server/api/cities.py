from fastapi import APIRouter, Query, HTTPException
import httpx
from typing import List
from config import get_settings
from models.air_quality import CitySearchResult

router = APIRouter()
settings = get_settings()

@router.get("/cities/search", response_model=List[CitySearchResult])
async def search_cities(q: str = Query(..., min_length=2, description="City name to search")):
    """
    Search for cities using OpenStreetMap Nominatim geocoding API
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{settings.nominatim_url}/search",
                params={
                    "q": q,
                    "format": "json",
                    "limit": 10,
                    "addressdetails": 1,
                    "extratags": 1,
                    "namedetails": 1,
                    "featuretype": "city",
                    "accept-language": "en",
                },
                headers={
                    "User-Agent": "AirGlobe-NASA-SpaceApps/1.0"
                }
            )
            response.raise_for_status()
            
            results = response.json()
            cities = []
            
            for result in results:
                # Filter for city-like results
                if result.get("type") in ["city", "town", "village", "municipality"] or \
                   result.get("class") == "place":
                    
                    address = result.get("address", {})
                    
                    cities.append(CitySearchResult(
                        name=result.get("name", ""),
                        country=address.get("country", ""),
                        lat=float(result["lat"]),
                        lon=float(result["lon"]),
                        display_name=result.get("display_name", "")
                    ))
            
            return cities[:10]  # Limit to 10 results
            
    except httpx.RequestError as e:
        print(f"Error searching cities: {e}")
        raise HTTPException(status_code=503, detail="Geocoding service unavailable")
    except Exception as e:
        print(f"Unexpected error in city search: {e}")
        raise HTTPException(status_code=500, detail="Failed to search cities")
