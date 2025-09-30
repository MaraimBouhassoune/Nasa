import { Cloud, Wind, Thermometer, Droplets } from 'lucide-react';
import { Card } from './ui/card';
import type { WeatherData } from '../lib/types';

interface WeatherCardProps {
  weather: WeatherData;
}

export function WeatherCard({ weather }: WeatherCardProps) {
  return (
    <Card className="p-4 bg-gray-800 border-gray-700">
      <h3 className="text-sm font-medium text-gray-300 mb-3">Weather Conditions</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Thermometer className="w-4 h-4 text-orange-400" />
          <div>
            <div className="text-sm font-medium text-white">{weather.temp_c.toFixed(1)}°C</div>
            <div className="text-xs text-gray-400">Temperature</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Droplets className="w-4 h-4 text-blue-400" />
          <div>
            <div className="text-sm font-medium text-white">{weather.humidity}%</div>
            <div className="text-xs text-gray-400">Humidity</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Wind className="w-4 h-4 text-gray-400" />
          <div>
            <div className="text-sm font-medium text-white">{weather.wind_speed_ms.toFixed(1)} m/s</div>
            <div className="text-xs text-gray-400">Wind Speed</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Cloud className="w-4 h-4 text-blue-300" />
          <div>
            <div className="text-sm font-medium text-white">{weather.precip_mm.toFixed(1)} mm</div>
            <div className="text-xs text-gray-400">Precipitation</div>
          </div>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        Source: {weather.source.join(', ')}
      </div>
    </Card>
  );
}
