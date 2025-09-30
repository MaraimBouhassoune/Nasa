import { X, MapPin, Clock, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { PollutantCard } from './PollutantCard';
import { WeatherCard } from './WeatherCard';
import { ForecastChart } from './ForecastChart';
import { HealthAdvicePanel } from './HealthAdvicePanel';
import { useAirQuality } from '../hooks/useAirQuality';
import { getAQICategory, getAQIColor } from '../lib/constants';
import type { SelectedLocation } from '../lib/types';

interface AirQualityPanelProps {
  location: SelectedLocation;
  healthProfile: string;
  onClose: () => void;
}

export function AirQualityPanel({ location, healthProfile, onClose }: AirQualityPanelProps) {
  const { data: airQuality, isLoading, error } = useAirQuality(location);

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Air Quality Data</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-gray-700">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="text-red-400 text-sm mb-2">Error loading data</div>
            <div className="text-gray-400 text-xs">
              {error instanceof Error ? error.message : 'Unknown error occurred'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Air Quality Data</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-gray-700">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
        </div>
      </div>
    );
  }

  if (!airQuality) {
    return null;
  }

  const aqiCategory = getAQICategory(airQuality.aqi.value);
  const aqiColor = getAQIColor(airQuality.aqi.value);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <MapPin className="w-5 h-5 text-blue-400" />
          <div>
            <h2 className="text-lg font-semibold text-white">{airQuality.location_name}</h2>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{new Date(airQuality.timestamp_iso).toLocaleString()}</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-gray-700">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* AQI Badge */}
        <Card className="p-4 bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">{airQuality.aqi.value}</div>
              <div className="text-sm text-gray-400">Air Quality Index</div>
            </div>
            <Badge 
              className="text-white font-medium px-3 py-1"
              style={{ backgroundColor: aqiColor }}
            >
              {aqiCategory.label}
            </Badge>
          </div>
        </Card>

        {/* Pollutants */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-300">Pollutants</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(airQuality.pollutants).map(([key, data]) => (
              <PollutantCard key={key} type={key} data={data} />
            ))}
          </div>
        </div>

        {/* Weather */}
        <WeatherCard weather={airQuality.weather} />

        {/* Forecast Chart */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-medium text-gray-300">24h Forecast</h3>
          </div>
          <ForecastChart 
            forecast={airQuality.forecast_24h}
            history={airQuality.history_7d}
          />
        </div>

        {/* Health Advice */}
        <HealthAdvicePanel 
          advice={airQuality.advice}
          aqi={airQuality.aqi.value}
          activeProfile={healthProfile}
        />

        {/* Data Sources */}
        <Card className="p-3 bg-gray-800 border-gray-700">
          <h3 className="text-xs font-medium text-gray-400 mb-2">Data Sources</h3>
          <div className="space-y-1 text-xs text-gray-500">
            {airQuality.provenance.tempo && (
              <div>NASA TEMPO ({airQuality.provenance.tempo.product})</div>
            )}
            {airQuality.provenance.openaq && (
              <div>OpenAQ ({airQuality.provenance.openaq.station_ids.length} stations)</div>
            )}
            {airQuality.provenance.meteo && (
              <div>
                NASA {airQuality.provenance.meteo.imerg ? 'IMERG' : ''} 
                {airQuality.provenance.meteo.merra2 ? ' MERRA-2' : ''}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
