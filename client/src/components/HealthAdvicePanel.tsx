import { AlertTriangle, Info, Heart, Activity } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { HEALTH_PROFILES, getAQICategory } from '../lib/constants';
import type { HealthAdvice } from '../lib/types';

interface HealthAdvicePanelProps {
  advice: HealthAdvice;
  aqi: number;
  activeProfile: string;
}

export function HealthAdvicePanel({ advice, aqi, activeProfile }: HealthAdvicePanelProps) {
  const aqiCategory = getAQICategory(aqi);
  const profileAdvice = advice.profiles[activeProfile as keyof typeof advice.profiles];
  const profileInfo = HEALTH_PROFILES[activeProfile as keyof typeof HEALTH_PROFILES];

  const getIcon = () => {
    if (aqi > 150) return <AlertTriangle className="w-4 h-4 text-red-400" />;
    if (aqi > 100) return <Info className="w-4 h-4 text-orange-400" />;
    return <Heart className="w-4 h-4 text-green-400" />;
  };

  return (
    <Card className="p-4 bg-gray-800 border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-medium text-gray-300">Health Recommendations</h3>
        </div>
        
        <Badge variant="secondary" className="text-xs">
          {profileInfo?.icon} {profileInfo?.label}
        </Badge>
      </div>

      {/* General advice */}
      <div className="mb-4">
        <div className="flex items-start space-x-2">
          {getIcon()}
          <div className="flex-1">
            <div className="text-sm text-white font-medium mb-1">General</div>
            <div className="text-sm text-gray-300">{advice.general}</div>
          </div>
        </div>
      </div>

      {/* Profile-specific advice */}
      {profileAdvice && (
        <div className="border-t border-gray-700 pt-3">
          <div className="flex items-start space-x-2">
            {getIcon()}
            <div className="flex-1">
              <div className="text-sm text-white font-medium mb-1">
                For {profileInfo?.label}
              </div>
              <div className="text-sm text-gray-300">{profileAdvice}</div>
            </div>
          </div>
        </div>
      )}

      {/* AQI level indicator */}
      <div className="mt-4 pt-3 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Air Quality Level</span>
          <Badge 
            style={{ backgroundColor: aqiCategory.color === 'green' ? '#10b981' : 
                                   aqiCategory.color === 'yellow' ? '#f59e0b' :
                                   aqiCategory.color === 'orange' ? '#f97316' :
                                   aqiCategory.color === 'red' ? '#ef4444' :
                                   aqiCategory.color === 'purple' ? '#8b5cf6' : '#7f1d1d' }}
            className="text-white text-xs"
          >
            {aqiCategory.label}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
