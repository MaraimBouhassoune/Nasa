import os
from functools import lru_cache
from pydantic import BaseModel

class Settings(BaseModel):
    # NASA Earthdata credentials
    earthdata_username: str = os.getenv("EARTHDATA_USERNAME", "")
    earthdata_password: str = os.getenv("EARTHDATA_PASSWORD", "")
    
    # API URLs
    openaq_base_url: str = os.getenv("OPENAQ_BASE_URL", "https://api.openaq.org/v2")
    nominatim_url: str = "https://nominatim.openstreetmap.org"
    
    # Cache settings
    cache_ttl_seconds: int = int(os.getenv("CACHE_TTL_SECONDS", "900"))  # 15 minutes
    
    # Server settings
    port: int = int(os.getenv("PORT", "8000"))
    
    # NASA API endpoints
    tempo_base_url: str = "https://disc.gsfc.nasa.gov/api/harmony"
    imerg_base_url: str = "https://gpm1.gesdisc.eosdis.nasa.gov/data"
    merra2_base_url: str = "https://goldsmr4.gesdisc.eosdis.nasa.gov/data"
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
