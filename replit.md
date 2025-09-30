# AirGlobe - NASA Space Apps 2025

## Overview

AirGlobe is an interactive air quality prediction web application built for NASA Space Apps 2025 Challenge 15. The application displays a 3D globe interface where users can click on locations to view real-time and forecasted air quality data, combining NASA TEMPO satellite observations with ground station measurements and meteorological data to provide comprehensive air quality insights and personalized health recommendations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with Vite for fast development and HMR
- TypeScript for type safety
- Tailwind CSS for styling with Radix UI component primitives
- deck.gl for 3D globe visualization
- TanStack Query for server state management and caching

**Key Design Decisions:**
- **Component-Based UI**: Modular React components with clear separation between presentation (Globe, AirQualityPanel, CitySearch) and data fetching logic (custom hooks)
- **Real-Time Data Display**: Interactive globe allows clicking any location to fetch air quality data for that coordinate
- **Client-Side Caching**: TanStack Query provides 15-minute cache TTL matching backend cache strategy, reducing redundant API calls
- **Responsive Design**: Dark-themed UI optimized for data visualization with glassmorphic panels

### Backend Architecture

**Dual-Server Setup:**
- **Python FastAPI Backend (Port 8000)**: Handles all data aggregation, ML predictions, and external API integration
- **Node.js Express Frontend Server (Port 5000)**: Serves React app and proxies `/api` requests to Python backend
- **Rationale**: Python chosen for NASA data access libraries (earthaccess, xarray) and ML capabilities; Node.js provides optimal React/Vite development experience

**API Design:**
- RESTful endpoints: `/api/airquality` (main data endpoint) and `/api/cities/search` (geocoding)
- Query-based parameters for location (lat/lon) and forecast duration
- Structured JSON responses with data provenance tracking

**Data Processing Pipeline:**
1. Parallel data fetching from multiple sources (TEMPO, OpenAQ, weather services)
2. Data normalization and quality validation
3. AQI calculation using EPA standards
4. ML-based forecast generation using historical patterns
5. Health advice personalization based on user profiles

### Data Storage Solutions

**Cache Strategy:**
- **In-Memory Cache**: Python CacheService with TTL-based expiration (15-minute default)
- **Fallback Design**: No external cache dependency (Redis optional); ensures deployment simplicity
- **Cache Keys**: Coordinate-based with 2-decimal precision to group nearby requests

**Database Schema:**
- Drizzle ORM configured with PostgreSQL dialect
- User table schema defined but minimal database usage in MVP
- Database primarily reserved for potential user preferences and historical data storage

**Rationale**: Cache-first approach prioritizes response speed while managing API rate limits; database kept minimal to reduce infrastructure complexity for hackathon timeline.

### Machine Learning Integration

**ML Service Architecture:**
- Scikit-learn for regression models (LinearRegression, RandomForestRegressor)
- Time-series forecasting based on historical pollutant trends and weather patterns
- Feature engineering combines pollutant concentrations, meteorological data, and temporal factors
- Fallback to simple trend-based predictions when insufficient training data

**Model Selection Rationale**: Lightweight models chosen for rapid training and inference without GPU requirements; suitable for hackathon MVP with room for LSTM/transformer upgrades.

## External Dependencies

### NASA Data Sources

**TEMPO Satellite Data:**
- Provides NO₂, O₃, PM, and HCHO measurements
- Integration planned via earthaccess/harmony-py libraries
- Current implementation uses geographic fallback patterns for MVP

**IMERG Precipitation Data:**
- GPM rainfall measurements affecting air quality dispersion
- Accessed through NASA GES DISC APIs

**MERRA-2 Reanalysis:**
- Wind speed, temperature, and humidity data
- Critical for understanding pollutant transport and dispersion

### Third-Party APIs

**OpenAQ API:**
- Global ground-based air quality station network
- Provides real-time and historical pollutant measurements
- Used for validation and supplementing satellite data

**Nominatim (OpenStreetMap):**
- Geocoding service for city search functionality
- Returns coordinates and location metadata
- Free tier with rate limiting considerations

### Visualization Libraries

**deck.gl:**
- WebGL-based 3D globe rendering
- Chosen for performance with large geographic datasets
- Supports interactive overlays and custom layers

**Recharts:**
- Charting library for time-series forecast visualization
- Lightweight alternative to heavier charting solutions

### UI Component Libraries

**Radix UI:**
- Unstyled, accessible component primitives
- Provides dialog, dropdown, toast, and form components
- Allows full styling control with Tailwind

**Lucide React:**
- Icon library for consistent UI elements

### Development Tools

**Vite:**
- Frontend build tool with fast HMR and optimized production builds
- GLSL shader plugin support for advanced visualizations

**ESBuild:**
- Backend bundling for production deployment
- Significantly faster than traditional Node.js bundlers

**Drizzle Kit:**
- Database schema management and migrations
- Type-safe database client generation

## Replit Environment Setup

### Development Configuration

**Workflow Setup:**
- Single workflow `AirGlobe App` runs both Python and Node.js servers
- Command: `npm run dev:all` starts both servers in parallel
- Frontend served on port 5000 (webview output)
- Backend runs on localhost:8000 (proxied through Express)

**Build & Deployment:**
- Build command: `npm run build` (Vite + ESBuild)
- Production command: `npm run start`
- Deployment target: autoscale (stateless web app)

**Host Configuration:**
- Vite configured with `allowedHosts: true` for Replit proxy compatibility
- Frontend uses 0.0.0.0:5000 for Replit webview
- Backend uses localhost:8000 (internal only, proxied by Express)

### Package Management

**Node.js (v20):**
- All dependencies installed via npm
- package.json defines both runtime and dev dependencies

**Python (v3.11):**
- Dependencies managed via uv (pyproject.toml)
- Virtual environment in .pythonlibs directory

### Known Issues

**Deck.gl WebGL Initialization:**
- Warning: "Cannot read properties of null (reading 'luma')" 
- This is a deck.gl 9.x/luma.gl 9.x initialization warning
- Does not prevent app functionality
- Related to WebGL context creation in deck.gl
- Application continues to work despite the console error