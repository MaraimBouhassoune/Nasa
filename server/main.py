import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from api.airquality import router as airquality_router
from api.cities import router as cities_router
from services.cache_service import CacheService
from config import get_settings

settings = get_settings()

# Initialize cache service
cache_service = CacheService()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🌍 AirGlobe API starting up...")
    yield
    # Shutdown
    print("🌍 AirGlobe API shutting down...")

app = FastAPI(
    title="AirGlobe API",
    description="NASA Space Apps 2025 - Air Quality Prediction API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "AirGlobe API"}

# API routes
app.include_router(airquality_router, prefix="/api")
app.include_router(cities_router, prefix="/api")

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return {
        "error": exc.detail,
        "status_code": exc.status_code
    }

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    print(f"Unhandled error: {exc}")
    return {
        "error": "Internal server error",
        "status_code": 500
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
