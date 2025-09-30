export interface SelectedLocation {
  lat: number;
  lon: number;
  name?: string;
}

export interface PollutantData {
  value: number;
  unit: string;
  source: string[];
}

export interface WeatherData {
  precip_mm: number;
  wind_speed_ms: number;
  temp_c: number;
  humidity: number;
  source: string[];
}

export interface AQIData {
  value: number;
  scale: string;
  category: string;
}

export interface ForecastPoint {
  t: string;
  aqi: number;
}

export interface HealthAdvice {
  general: string;
  profiles: {
    asthma?: string;
    children?: string;
    elderly?: string;
    athletes?: string;
  };
}

export interface DataProvenance {
  tempo?: {
    product: string;
    nrt: boolean;
  };
  openaq?: {
    station_ids: string[];
  };
  meteo?: {
    imerg: boolean;
    merra2: boolean;
  };
}

export interface AirQualityResponse {
  coord: {
    lat: number;
    lon: number;
  };
  location_name: string;
  timestamp_iso: string;
  pollutants: {
    no2?: PollutantData;
    o3?: PollutantData;
    pm25?: PollutantData;
    hcho?: PollutantData;
  };
  weather: WeatherData;
  aqi: AQIData;
  forecast_24h: ForecastPoint[];
  advice: HealthAdvice;
  history_7d: ForecastPoint[];
  provenance: DataProvenance;
}

export interface CitySearchResult {
  name: string;
  country: string;
  lat: number;
  lon: number;
  display_name: string;
}
